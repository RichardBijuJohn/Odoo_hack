const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const billingCycles = ['weekly', 'monthly', 'quarterly', 'yearly'];
const planStatuses = ['active', 'archived'];
const maxInteger = 2147483647;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseInteger(value, label, { min = 0, defaultValue } = {}) {
  if ((value === undefined || value === null || value === '') && defaultValue !== undefined) {
    return defaultValue;
  }

  if (!['number', 'string'].includes(typeof value) || value === '') {
    throw httpError(400, `${label} must be a valid integer.`);
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > maxInteger) {
    throw httpError(400, `${label} must be an integer between ${min} and ${maxInteger}.`);
  }
  return number;
}

async function getPlan(id) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.product_id, p.name, p.billing_cycle, p.price, p.currency,
            p.trial_days, p.user_limit, p.status, p.created_at, p.updated_at,
            pr.name AS product_name
     FROM plans p
     LEFT JOIN products pr ON pr.id = p.product_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.product_id, p.name, p.billing_cycle, p.price, p.currency,
              p.trial_days, p.user_limit, p.status, p.created_at, p.updated_at,
              pr.name AS product_name
       FROM plans p
       LEFT JOIN products pr ON pr.id = p.product_id
       ORDER BY p.created_at DESC, p.id DESC`
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) {
      throw httpError(400, 'Plan name is required and must be 100 characters or fewer.');
    }

    const billingCycle = typeof body.billing_cycle === 'string'
      ? body.billing_cycle.toLowerCase()
      : '';
    if (!billingCycles.includes(billingCycle)) {
      throw httpError(400, `Billing cycle must be one of: ${billingCycles.join(', ')}.`);
    }

    const rawPrice = body.price;
    const price = Number(rawPrice);
    if (!['number', 'string'].includes(typeof rawPrice) ||
        rawPrice === undefined || rawPrice === null || rawPrice === '' ||
        !Number.isFinite(price) || price < 0 || price > 99999999.99 ||
        Math.abs(price * 100 - Math.round(price * 100)) > 1e-7) {
      throw httpError(400, 'Price must be a number between 0 and 99999999.99 with at most two decimal places.');
    }

    if (body.currency !== undefined && typeof body.currency !== 'string') {
      throw httpError(400, 'Currency must be a string.');
    }
    const currency = body.currency === undefined ? 'USD' : body.currency.trim().toUpperCase();
    if (!currency || currency.length > 10) {
      throw httpError(400, 'Currency is required and must be 10 characters or fewer.');
    }

    const trialDays = parseInteger(body.trial_days, 'Trial days', { defaultValue: 0 });
    const userLimit = parseInteger(body.user_limit, 'User limit', { min: 1, defaultValue: 1 });
    if (body.status !== undefined && typeof body.status !== 'string') {
      throw httpError(400, 'Status must be a string.');
    }
    const status = body.status === undefined ? 'active' : body.status.toLowerCase();
    if (!planStatuses.includes(status)) {
      throw httpError(400, `Status must be one of: ${planStatuses.join(', ')}.`);
    }

    let productId = null;
    if (body.product_id !== undefined && body.product_id !== null && body.product_id !== '') {
      productId = parseInteger(body.product_id, 'Product ID', { min: 1 });
      const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [productId]);
      if (!products.length) {
        throw httpError(400, 'Selected product does not exist.');
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO plans
         (product_id, name, billing_cycle, price, currency, trial_days, user_limit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, name, billingCycle, price, currency, trialDays, userLimit, status]
    );

    const createdPlan = await getPlan(result.insertId);
    if (!createdPlan) {
      throw new Error('Plan was inserted but could not be retrieved.');
    }

    res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: createdPlan
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
