const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const paymentMethods = ['cash', 'card', 'bank_transfer', 'upi'];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, 'Payment date must be a valid date in YYYY-MM-DD format.');
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw httpError(400, 'Payment date must be a valid date in YYYY-MM-DD format.');
  }
  return value;
}

router.get('/', async (req, res, next) => {
  try {
    const method = req.query.method;
    if (method && !paymentMethods.includes(method)) {
      throw httpError(400, 'Method must be cash, card, bank_transfer, or upi.');
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const from = req.query.from ? validDate(req.query.from) : null;
    const to = req.query.to ? validDate(req.query.to) : null;
    if (from && to && from > to) throw httpError(400, 'Start date cannot be after end date.');

    const conditions = [];
    const parameters = [];
    if (method) {
      conditions.push('p.payment_method = ?');
      parameters.push(method);
    }
    if (from) {
      conditions.push('DATE(p.payment_date) >= ?');
      parameters.push(from);
    }
    if (to) {
      conditions.push('DATE(p.payment_date) <= ?');
      parameters.push(to);
    }
    if (search) {
      conditions.push('(CAST(p.id AS CHAR) LIKE ? OR CONCAT(\'PAY-\', LPAD(p.id, 6, \'0\')) LIKE ? OR i.invoice_number LIKE ? OR c.name LIKE ? OR p.transaction_ref LIKE ?)');
      parameters.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [payments] = await pool.execute(
      `SELECT p.id, CONCAT('PAY-', LPAD(p.id, 6, '0')) AS payment_number, p.invoice_id,
              i.invoice_number, i.customer_id, c.name AS customer_name, c.email AS customer_email,
              p.amount, p.payment_method, p.transaction_ref, p.note, p.status, p.payment_date
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN customers c ON c.id = i.customer_id
       ${where}
       ORDER BY p.payment_date DESC, p.id DESC`,
      parameters
    );
    const [summaryRows] = await pool.execute(
      `SELECT COUNT(*) AS total_payments,
              COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS amount_received,
              SUM(status = 'pending') AS pending_payments,
              SUM(status = 'completed' AND payment_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)) AS recent_payments
       FROM payments`
    );
    res.json({ success: true, data: payments, summary: summaryRows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Payment ID must be a positive integer.');
    const [rows] = await pool.execute(
      `SELECT p.id, CONCAT('PAY-', LPAD(p.id, 6, '0')) AS payment_number, p.invoice_id,
              i.invoice_number, i.customer_id, c.name AS customer_name, c.email AS customer_email,
              p.amount, p.payment_method, p.transaction_ref, p.note, p.status, p.payment_date,
              i.total_amount, i.paid_amount,
              GREATEST(i.total_amount - i.paid_amount, 0) AS balance_due
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       JOIN customers c ON c.id = i.customer_id WHERE p.id = ?`,
      [Number(req.params.id)]
    );
    if (!rows.length) throw httpError(404, 'Payment not found.');
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    const invoiceId = Number(req.body.invoice_id);
    const amount = Number(req.body.amount);
    const method = req.body.payment_method;
    const paymentDate = validDate(req.body.payment_date);
    const reference = typeof req.body.transaction_ref === 'string' ? req.body.transaction_ref.trim() : '';
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw httpError(400, 'Select a valid invoice.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999.99) throw httpError(400, 'Payment amount must be greater than zero.');
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) throw httpError(400, 'Payment amount supports at most 2 decimal places.');
    if (!paymentMethods.includes(method)) throw httpError(400, 'Select a valid payment method.');
    if (reference.length > 100) throw httpError(400, 'Payment reference must be 100 characters or fewer.');
    if (note.length > 1000) throw httpError(400, 'Payment note must be 1000 characters or fewer.');
    const paymentCents = Math.round((amount + Number.EPSILON) * 100);
    if (paymentCents < 1) throw httpError(400, 'Payment amount must be at least 0.01.');

    await connection.beginTransaction();
    transactionStarted = true;
    const [invoiceRows] = await connection.execute(
      `SELECT id, status, total_amount, paid_amount FROM invoices WHERE id = ? FOR UPDATE`,
      [invoiceId]
    );
    if (!invoiceRows.length) throw httpError(404, 'Invoice not found.');
    const invoice = invoiceRows[0];
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      throw httpError(409, 'Payments can only be recorded against confirmed invoices.');
    }
    const totalCents = Math.round(Number(invoice.total_amount) * 100);
    const paidCents = Math.round(Number(invoice.paid_amount) * 100);
    const remainingCents = totalCents - paidCents;
    if (paymentCents > remainingCents) {
      throw httpError(400, `Payment exceeds the invoice balance of ${(remainingCents / 100).toFixed(2)}.`);
    }

    const newPaidCents = paidCents + paymentCents;
    const newStatus = newPaidCents >= totalCents ? 'paid' : 'confirmed';
    const [result] = await connection.execute(
      `INSERT INTO payments (invoice_id, amount, payment_method, transaction_ref, note, status, payment_date)
       VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
      [invoiceId, (paymentCents / 100).toFixed(2), method, reference || null, note || null, `${paymentDate} 12:00:00`]
    );
    await connection.execute(
      `UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`,
      [(newPaidCents / 100).toFixed(2), newStatus, invoiceId]
    );
    await connection.commit();
    transactionStarted = false;

    const [rows] = await pool.execute(
      `SELECT p.id, CONCAT('PAY-', LPAD(p.id, 6, '0')) AS payment_number, p.invoice_id,
              i.invoice_number, i.customer_id, c.name AS customer_name, c.email AS customer_email,
              p.amount, p.payment_method, p.transaction_ref, p.note, p.status, p.payment_date,
              i.total_amount, i.paid_amount, GREATEST(i.total_amount - i.paid_amount, 0) AS balance_due,
              i.status AS invoice_status
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       JOIN customers c ON c.id = i.customer_id WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        return next(rollbackError);
      }
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
