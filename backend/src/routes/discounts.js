const express = require('express');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { lifecycleStatus, getDiscount, saveDiscount, calculateDiscount, httpError } = require('../services/discountService');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(d.name LIKE ? OR d.code LIKE ? OR d.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (['active', 'inactive', 'scheduled', 'expired'].includes(status)) {
      if (status === 'inactive') conditions.push('d.status = ?');
      else if (status === 'scheduled') { conditions.push('d.status = "active" AND d.start_date > CURRENT_DATE'); }
      else if (status === 'expired') { conditions.push('d.status = "active" AND d.end_date < CURRENT_DATE'); }
      else conditions.push('d.status = "active" AND d.start_date <= CURRENT_DATE AND d.end_date >= CURRENT_DATE AND (d.usage_limit IS NULL OR d.used_count < d.usage_limit)');
      if (status === 'inactive') params.push('inactive');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT d.*, CASE
         WHEN d.status = 'inactive' THEN 'inactive'
         WHEN d.start_date > CURRENT_DATE THEN 'scheduled'
         WHEN d.end_date < CURRENT_DATE THEN 'expired'
         WHEN d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit THEN 'inactive'
         ELSE 'active' END AS lifecycle_status
       FROM discounts d ${where} ORDER BY d.created_at DESC`,
      params
    );
    const summary = {
      total: rows.length,
      active: rows.filter((row) => row.lifecycle_status === 'active').length,
      scheduled: rows.filter((row) => row.lifecycle_status === 'scheduled').length,
      expired: rows.filter((row) => row.lifecycle_status === 'expired').length,
    };
    res.json({ success: true, data: rows, summary });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Discount ID must be a positive integer.');
    const discount = await getDiscount(pool, Number(req.params.id));
    if (!discount) throw httpError(404, 'Discount not found.');
    res.json({ success: true, data: discount });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const discount = await saveDiscount(connection, req.body);
    await connection.commit();
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
});

router.put('/:id', async (req, res, next) => {
  let connection;
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Discount ID must be a positive integer.');
    connection = await pool.getConnection();
    await connection.beginTransaction();
    if (!await getDiscount(connection, Number(req.params.id))) throw httpError(404, 'Discount not found.');
    const discount = await saveDiscount(connection, req.body, Number(req.params.id));
    await connection.commit();
    res.json({ success: true, data: discount });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
});

async function setStatus(req, res, next, status) {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Discount ID must be a positive integer.');
    const [result] = await pool.execute('UPDATE discounts SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
    if (!result.affectedRows) throw httpError(404, 'Discount not found.');
    res.json({ success: true, data: await getDiscount(pool, Number(req.params.id)) });
  } catch (error) { next(error); }
}
router.patch('/:id/activate', (req, res, next) => setStatus(req, res, next, 'active'));
router.patch('/:id/deactivate', (req, res, next) => setStatus(req, res, next, 'inactive'));

router.delete('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Discount ID must be a positive integer.');
    const [result] = await pool.execute('DELETE FROM discounts WHERE id = ?', [Number(req.params.id)]);
    if (!result.affectedRows) throw httpError(404, 'Discount not found.');
    res.json({ success: true, message: 'Discount deleted.' });
  } catch (error) { next(error); }
});

router.post('/validate', async (req, res, next) => {
  try {
    const result = await calculateDiscount(pool, { ...req.body, incrementUsage: false });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/apply', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await calculateDiscount(connection, { ...req.body, incrementUsage: true });
    await connection.commit();
    res.json({ success: true, data: result });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
});

module.exports = router;
