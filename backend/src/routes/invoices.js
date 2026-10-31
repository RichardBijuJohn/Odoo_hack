const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');

const router = express.Router();
const invoiceStatuses = ['draft', 'confirmed', 'paid', 'cancelled'];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function numberValue(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw httpError(400, `${label} must be a number between ${min} and ${max}.`);
  }
  return number;
}

function decimalPlaces(value, places, label) {
  const scale = 10 ** places;
  if (Math.abs(value * scale - Math.round(value * scale)) > 1e-7) {
    throw httpError(400, `${label} supports at most ${places} decimal places.`);
  }
}

function validDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${label} must be a valid date in YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${label} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw httpError(400, 'Add between 1 and 100 invoice items.');
  }

  return items.map((item, index) => {
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    if (!description || description.length > 500) {
      throw httpError(400, `Item ${index + 1} needs a description of 1 to 500 characters.`);
    }

    const quantity = numberValue(item.quantity, `Item ${index + 1} quantity`, { min: 0.001, max: 1000000 });
    const unitPrice = numberValue(item.unit_price, `Item ${index + 1} unit price`, { max: 99999999.99 });
    const taxPercentage = numberValue(item.tax_percentage ?? 0, `Item ${index + 1} tax percentage`, { max: 100 });
    decimalPlaces(quantity, 3, `Item ${index + 1} quantity`);
    decimalPlaces(unitPrice, 2, `Item ${index + 1} unit price`);
    decimalPlaces(taxPercentage, 2, `Item ${index + 1} tax percentage`);
    const subtotal = roundMoney(quantity * unitPrice);
    const taxAmount = roundMoney(subtotal * taxPercentage / 100);
    if (subtotal > 99999999.99 || taxAmount > 99999999.99) throw httpError(400, `Item ${index + 1} exceeds the maximum invoice amount.`);

    return {
      description,
      quantity,
      unitPrice,
      taxPercentage,
      subtotal,
      taxAmount,
      total: roundMoney(subtotal + taxAmount)
    };
  });
}

function invoiceNumber() {
  return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function saveItems(connection, invoiceId, items) {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO invoice_items
        (invoice_id, description, quantity, unit_price, tax_percentage, subtotal, tax_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.description, item.quantity, item.unitPrice, item.taxPercentage, item.subtotal, item.taxAmount, item.total]
    );
  }
}

async function getInvoice(connection, id) {
  const [rows] = await connection.execute(
    `SELECT i.*, c.name AS customer_name, c.email AS customer_email
     FROM invoices i JOIN customers c ON c.id = i.customer_id
     WHERE i.id = ?`,
    [id]
  );
  if (!rows.length) return null;

  const [items] = await connection.execute(
    `SELECT id, description, quantity, unit_price, tax_percentage, subtotal, tax_amount, total_amount
     FROM invoice_items WHERE invoice_id = ? ORDER BY id`,
    [id]
  );
  return { ...rows[0], items };
}

router.get('/options', async (req, res, next) => {
  try {
    const [customers] = await pool.execute(
      `SELECT id, name, email FROM customers WHERE status = 'active' ORDER BY name`
    );
    const [subscriptions] = await pool.execute(
      `SELECT s.id, s.customer_id, p.name AS plan_name
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.status IN ('active', 'trial') ORDER BY s.id DESC`
    );
    res.json({ success: true, data: { customers, subscriptions } });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;
    if (status && !invoiceStatuses.includes(status)) {
      throw httpError(400, 'Status must be draft, confirmed, paid, or cancelled.');
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const sortColumns = { issue_date: 'i.issue_date', due_date: 'i.due_date', invoice_number: 'i.invoice_number' };
    const sortBy = sortColumns[req.query.sort_by] || 'i.issue_date';
    const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC';
    const conditions = [];
    const parameters = [];

    if (status) {
      conditions.push('i.status = ?');
      parameters.push(status);
    }
    if (search) {
      conditions.push('(i.invoice_number LIKE ? OR c.name LIKE ?)');
      parameters.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [invoices] = await pool.execute(
      `SELECT i.id, i.invoice_number, i.customer_id, c.name AS customer_name, c.email AS customer_email,
              i.subscription_id, i.amount, i.tax_amount, i.total_amount, i.paid_amount,
              GREATEST(i.total_amount - i.paid_amount, 0) AS balance_due,
              i.status, i.issue_date, i.due_date, i.created_at
       FROM invoices i JOIN customers c ON c.id = i.customer_id
       ${where}
       ORDER BY ${sortBy} ${direction}, i.id DESC`,
      parameters
    );
    const [summaryRows] = await pool.execute(
      `SELECT COUNT(*) AS total_invoices,
              SUM(status = 'draft') AS draft_invoices,
              SUM(status = 'confirmed') AS confirmed_invoices,
              SUM(status = 'paid') AS paid_invoices,
              COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount - paid_amount ELSE 0 END), 0) AS outstanding_amount
       FROM invoices`
    );
    res.json({ success: true, data: invoices, summary: summaryRows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Invoice ID must be a positive integer.');
    const invoice = await getInvoice(pool, Number(req.params.id));
    if (!invoice) throw httpError(404, 'Invoice not found.');
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const customerId = numberValue(req.body.customer_id, 'Customer', { min: 1, max: 2147483647 });
    const subscriptionId = req.body.subscription_id ? numberValue(req.body.subscription_id, 'Subscription', { min: 1, max: 2147483647 }) : null;
    const issueDate = validDate(req.body.issue_date, 'Invoice date');
    const dueDate = validDate(req.body.due_date, 'Due date');
    if (dueDate < issueDate) throw httpError(400, 'Due date cannot be before the invoice date.');
    const items = parseItems(req.body.items);
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
    const taxAmount = roundMoney(items.reduce((sum, item) => sum + item.taxAmount, 0));
    const total = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
    if (subtotal > 99999999.99 || taxAmount > 99999999.99 || total > 99999999.99) {
      throw httpError(400, 'Invoice total exceeds the maximum supported amount.');
    }

    await connection.beginTransaction();
    const [customerRows] = await connection.execute('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!customerRows.length) throw httpError(400, 'Selected customer does not exist.');
    if (subscriptionId) {
      const [subscriptionRows] = await connection.execute(
        'SELECT id, customer_id FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
      if (!subscriptionRows.length || Number(subscriptionRows[0].customer_id) !== customerId) {
        throw httpError(400, 'Selected subscription does not belong to this customer.');
      }
    }

    const [result] = await connection.execute(
      `INSERT INTO invoices
        (subscription_id, customer_id, invoice_number, amount, tax_amount, total_amount, paid_amount, status, issue_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'draft', ?, ?)`,
      [subscriptionId, customerId, invoiceNumber(), subtotal, taxAmount, total, issueDate, dueDate]
    );
    await saveItems(connection, result.insertId, items);
    await connection.commit();
    res.status(201).json({ success: true, data: await getInvoice(pool, result.insertId) });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Invoice ID must be a positive integer.');
    const id = Number(req.params.id);
    const customerId = numberValue(req.body.customer_id, 'Customer', { min: 1, max: 2147483647 });
    const subscriptionId = req.body.subscription_id ? numberValue(req.body.subscription_id, 'Subscription', { min: 1, max: 2147483647 }) : null;
    const issueDate = validDate(req.body.issue_date, 'Invoice date');
    const dueDate = validDate(req.body.due_date, 'Due date');
    if (dueDate < issueDate) throw httpError(400, 'Due date cannot be before the invoice date.');
    const items = parseItems(req.body.items);
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
    const taxAmount = roundMoney(items.reduce((sum, item) => sum + item.taxAmount, 0));
    const total = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
    if (subtotal > 99999999.99 || taxAmount > 99999999.99 || total > 99999999.99) {
      throw httpError(400, 'Invoice total exceeds the maximum supported amount.');
    }

    await connection.beginTransaction();
    const [invoiceRows] = await connection.execute('SELECT status, paid_amount FROM invoices WHERE id = ? FOR UPDATE', [id]);
    if (!invoiceRows.length) throw httpError(404, 'Invoice not found.');
    if (invoiceRows[0].status !== 'draft') throw httpError(409, 'Only draft invoices can be edited.');
    if (Number(invoiceRows[0].paid_amount) > 0) throw httpError(409, 'An invoice with payments cannot be edited.');
    const [customerRows] = await connection.execute('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!customerRows.length) throw httpError(400, 'Selected customer does not exist.');
    if (subscriptionId) {
      const [subscriptionRows] = await connection.execute(
        'SELECT id, customer_id FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
      if (!subscriptionRows.length || Number(subscriptionRows[0].customer_id) !== customerId) {
        throw httpError(400, 'Selected subscription does not belong to this customer.');
      }
    }

    await connection.execute(
      `UPDATE invoices SET customer_id = ?, subscription_id = ?, amount = ?, tax_amount = ?,
       total_amount = ?, issue_date = ?, due_date = ? WHERE id = ?`,
      [customerId, subscriptionId, subtotal, taxAmount, total, issueDate, dueDate, id]
    );
    await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    await saveItems(connection, id, items);
    await connection.commit();
    res.json({ success: true, data: await getInvoice(pool, id) });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.patch('/:id/confirm', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Invoice ID must be a positive integer.');
    const [result] = await pool.execute(
      `UPDATE invoices SET status = 'confirmed' WHERE id = ? AND status = 'draft'`,
      [Number(req.params.id)]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT status FROM invoices WHERE id = ?', [Number(req.params.id)]);
      if (!rows.length) throw httpError(404, 'Invoice not found.');
      throw httpError(409, 'Only draft invoices can be confirmed.');
    }
    res.json({ success: true, data: await getInvoice(pool, Number(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Invoice ID must be a positive integer.');
    const [result] = await pool.execute(
      `UPDATE invoices SET status = 'cancelled' WHERE id = ? AND status IN ('draft', 'confirmed') AND paid_amount = 0`,
      [Number(req.params.id)]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT status FROM invoices WHERE id = ?', [Number(req.params.id)]);
      if (!rows.length) throw httpError(404, 'Invoice not found.');
      throw httpError(409, 'Invoices with payments, paid invoices, or already cancelled invoices cannot be cancelled.');
    }
    res.json({ success: true, data: await getInvoice(pool, Number(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
