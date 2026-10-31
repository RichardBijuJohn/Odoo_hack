const express = require('express');
const pool = require('../config/db');
const { authenticate, requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(requireAuth);

const STATUSES = ['pending', 'active', 'expired', 'cancelled'];
const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'yearly'];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseId(value, label) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, `${label} must be a positive integer.`);
  return id;
}

function parseDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    throw httpError(400, `${label} must use YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw httpError(400, `${label} is invalid.`);
  return String(value);
}

function addPeriods(dateString, cycle, duration) {
  const date = new Date(`${dateString}T00:00:00Z`);
  if (cycle === 'daily') date.setUTCDate(date.getUTCDate() + duration);
  if (cycle === 'weekly') date.setUTCDate(date.getUTCDate() + (duration * 7));
  if (cycle === 'monthly') date.setUTCMonth(date.getUTCMonth() + duration);
  if (cycle === 'yearly') date.setUTCFullYear(date.getUTCFullYear() + duration);
  return date.toISOString().slice(0, 10);
}

const selectSubscription = `
  SELECT s.id, s.user_id AS customer_id, s.plan_id, s.quantity,
    DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
    s.billing_cycle, s.duration, s.original_amount, s.discount_amount,
    s.final_amount, s.payment_status,
    DATE_FORMAT(s.next_billing_date, '%Y-%m-%d') AS next_billing_date,
    s.status, s.cancellation_reason, s.notes, s.created_at, s.updated_at,
    u.name AS customer_name, u.email AS customer_email, u.company_name AS customer_company,
    p.name AS plan_name, p.price AS plan_price, p.currency AS plan_currency,
    p.billing_cycle AS plan_billing_cycle, p.product_id,
    pr.name AS product_name,
    i.id AS invoice_id, i.invoice_number, i.status AS invoice_status,
    i.total_amount AS invoice_total, DATE_FORMAT(i.due_date, '%Y-%m-%d') AS invoice_due_date
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
  JOIN plans p ON p.id = s.plan_id
  LEFT JOIN products pr ON pr.id = p.product_id
  LEFT JOIN invoices i ON i.subscription_id = s.id
`;

function canAccess(subscription, user) {
  return user.role !== 'customer' || subscription.customer_id === user.id || subscription.customerId === subscription.customer_id;
}

async function findSubscription(id) {
  const [rows] = await pool.query(`${selectSubscription} WHERE s.id = ?`, [id]);
  return rows[0];
}

router.get('/options', async (req, res, next) => {
  try {
    const [plans] = await pool.query(
      `SELECT id, name, price, currency, billing_cycle, trial_days, user_limit, product_id
       FROM plans WHERE LOWER(status) = 'active' ORDER BY name`
    );
    const [customers] = req.user.role === 'customer'
      ? await pool.query('SELECT id, name, email, company_name FROM users WHERE id = ? AND role = \'customer\'', [req.user.id])
      : await pool.query('SELECT id, name, email, company_name FROM users WHERE role = \'customer\' AND status = \'active\' ORDER BY name');
    res.json({ success: true, data: { plans, customers } });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const scope = req.user.role === 'customer' ? 'WHERE s.user_id = ?' : '';
    const params = req.user.role === 'customer' ? [req.user.id] : [];
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total,
        SUM(status = 'active') AS active, SUM(status = 'pending') AS pending,
        SUM(status = 'expired') AS expired, SUM(status = 'cancelled') AS cancelled
       FROM subscriptions s ${scope}`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { status, plan_id, search, sort = 'created_at', direction = 'desc' } = req.query;
    const conditions = [];
    const params = [];
    if (req.user.role === 'customer') {
      conditions.push('s.user_id = ?');
      params.push(req.user.id);
    }
    if (status && STATUSES.includes(String(status).toLowerCase())) {
      conditions.push('s.status = ?');
      params.push(String(status).toLowerCase());
    }
    if (plan_id) {
      conditions.push('s.plan_id = ?');
      params.push(parseId(plan_id, 'plan_id'));
    }
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR CAST(s.id AS CHAR) LIKE ?)');
      const term = `%${String(search).trim()}%`;
      params.push(term, term, term);
    }
    const sortColumn = { created_at: 's.created_at', start_date: 's.start_date', end_date: 's.end_date' }[sort] || 's.created_at';
    const sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`${selectSubscription} ${where} ORDER BY ${sortColumn} ${sortDirection}`, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const subscription = await findSubscription(parseId(req.params.id, 'Subscription ID'));
    if (!subscription) throw httpError(404, 'Subscription not found.');
    if (!canAccess(subscription, req.user)) throw httpError(403, 'You cannot access another customer\'s subscription.');
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const customerId = req.user.role === 'customer' ? req.user.id : parseId(req.body.customer_id, 'customer_id');
    const planId = parseId(req.body.plan_id, 'plan_id');
    const startDate = parseDate(req.body.start_date || new Date().toISOString().slice(0, 10), 'start_date');
    const duration = Number.parseInt(req.body.duration, 10) || 1;
    const quantity = Number.parseInt(req.body.quantity, 10) || 1;
    if (duration < 1 || duration > 120 || quantity < 1) throw httpError(400, 'Duration and quantity must be positive values.');

    const [users] = await connection.query('SELECT id FROM users WHERE id = ? AND role = \'customer\' AND status = \'active\'', [customerId]);
    if (!users.length) throw httpError(404, 'Customer account not found.');
    const [plans] = await connection.query(
      `SELECT id, price, currency, billing_cycle FROM plans WHERE id = ? AND LOWER(status) = 'active'`,
      [planId]
    );
    if (!plans.length) throw httpError(400, 'Only published subscription plans can be selected.');
    const plan = plans[0];
    const cycle = BILLING_CYCLES.includes(req.body.billing_cycle) ? req.body.billing_cycle : plan.billing_cycle;
    const originalAmount = Number(plan.price) * quantity;
    const discountAmount = Math.min(Math.max(Number(req.body.discount_amount) || 0, 0), originalAmount);
    const finalAmount = Math.max(originalAmount - discountAmount, 0);
    const endDate = addPeriods(startDate, cycle, duration);
    const nextBillingDate = endDate;

    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO subscriptions
        (user_id, plan_id, quantity, start_date, end_date, billing_cycle, duration,
         original_amount, discount_amount, final_amount, payment_status, next_billing_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending', ?)`,
      [customerId, planId, quantity, startDate, endDate, cycle, duration, originalAmount, discountAmount, finalAmount, nextBillingDate, req.body.notes || null]
    );
    await connection.query(
      `INSERT INTO invoices
       (subscription_id, user_id, invoice_number, amount, tax_amount, total_amount, status, issue_date, due_date)
       VALUES (?, ?, ?, ?, 0, ?, 'pending', ?, ?)`,
      [result.insertId, customerId, `INV-${Date.now()}-${result.insertId}`, finalAmount, finalAmount, startDate, endDate]
    );
    await connection.commit();
    res.status(201).json({ success: true, message: 'Subscription created and awaiting payment confirmation.', data: await findSubscription(result.insertId) });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'Subscription ID');
    const subscription = await findSubscription(id);
    if (!subscription) throw httpError(404, 'Subscription not found.');
    if (!canAccess(subscription, req.user)) throw httpError(403, 'You cannot cancel another customer\'s subscription.');
    if (!['pending', 'active'].includes(subscription.status)) throw httpError(400, 'Only pending or active subscriptions can be cancelled.');
    await pool.query('UPDATE subscriptions SET status = \'cancelled\', cancellation_reason = ? WHERE id = ?', [req.body.reason || null, id]);
    res.json({ success: true, data: await findSubscription(id) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/confirm-payment', async (req, res, next) => {
  try {
    if (req.user.role === 'customer') throw httpError(403, 'Payment confirmation requires staff or admin access.');
    const id = parseId(req.params.id, 'Subscription ID');
    const subscription = await findSubscription(id);
    if (!subscription) throw httpError(404, 'Subscription not found.');
    if (subscription.status !== 'pending') throw httpError(400, 'Only pending subscriptions can be activated.');
    await pool.query('UPDATE subscriptions SET status = \'active\', payment_status = \'paid\' WHERE id = ?', [id]);
    res.json({ success: true, data: await findSubscription(id) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/renew', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = parseId(req.params.id, 'Subscription ID');
    const current = await findSubscription(id);
    if (!current) throw httpError(404, 'Subscription not found.');
    if (!canAccess(current, req.user)) throw httpError(403, 'You cannot renew another customer\'s subscription.');
    if (current.status === 'cancelled') throw httpError(400, 'Cancelled subscriptions cannot be renewed.');
    const startDate = current.end_date && current.end_date > new Date().toISOString().slice(0, 10) ? current.end_date : new Date().toISOString().slice(0, 10);
    const endDate = addPeriods(startDate, current.billing_cycle, current.duration);
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO subscriptions
       (user_id, plan_id, quantity, start_date, end_date, billing_cycle, duration,
        original_amount, discount_amount, final_amount, payment_status, next_billing_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?, 'pending', ?)`,
      [current.customer_id, current.plan_id, current.quantity, startDate, endDate, current.billing_cycle, current.duration, Number(current.plan_price) * current.quantity, Number(current.plan_price) * current.quantity, endDate, `Renewal of subscription #${current.id}`]
    );
    await connection.query(
      `INSERT INTO invoices
       (subscription_id, user_id, invoice_number, amount, tax_amount, total_amount, status, issue_date, due_date)
       VALUES (?, ?, ?, ?, 0, ?, 'pending', ?, ?)`,
      [result.insertId, current.customer_id, `INV-${Date.now()}-${result.insertId}`, Number(current.plan_price) * current.quantity, Number(current.plan_price) * current.quantity, startDate, endDate]
    );
    await connection.commit();
    res.status(201).json({ success: true, data: await findSubscription(result.insertId) });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
