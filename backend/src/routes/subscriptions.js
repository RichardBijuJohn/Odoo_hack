const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Attach user authentication context
router.use(authenticate);

// Date format validation helper. Accepts both ISO and localized day-first strings.
const normalizeDateString = (dateString) => {
  if (typeof dateString !== 'string') return '';

  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.exec(dateString);
  if (isoMatch) return dateString;

  const localMatch = /^\d{2}-\d{2}-\d{4}$/.exec(dateString);
  if (!localMatch) return '';

  const [day, month, year] = dateString.split('-').map(Number);
  if (!day || !month || !year) return '';

  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const d = new Date(`${normalized}T00:00:00`);
  return d instanceof Date && !isNaN(d.getTime()) ? normalized : '';
};

const isValidDate = (dateString) => {
  return !!normalizeDateString(dateString);
};

const BASE_SUBSCRIPTION_SELECT = `
  SELECT 
    s.id,
    s.customer_id,
    s.plan_id,
    DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
    DATE_FORMAT(s.next_billing_date, '%Y-%m-%d') AS next_billing_date,
    s.status,
    s.created_at,
    s.updated_at,
    c.name AS customer_name,
    c.email AS customer_email,
    c.company_name AS customer_company,
    p.name AS plan_name,
    p.billing_cycle AS plan_billing_cycle,
    p.price AS plan_price,
    p.currency AS plan_currency
  FROM subscriptions s
  JOIN customers c ON s.customer_id = c.id
  JOIN plans p ON s.plan_id = p.id
`;

/**
 * GET /api/subscriptions
 * Return subscriptions with joined customer and plan information.
 * - Customer role: strictly scoped to their own subscriptions.
 * - Attempting to request another customer's data returns 403.
 * - Staff/Admin: can view all subscriptions or filter by customer_id/status.
 */
router.get('/', async (req, res, next) => {
  try {
    const { customer_id, status } = req.query;

    // Security check: if customer role, prevent IDOR access to another customer's data
    if (req.user && req.user.role === 'customer') {
      if (!req.user.customerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No customer profile linked to this user.'
        });
      }

      // If customer requested a specific customer_id that is NOT their own, deny access
      if (customer_id && parseInt(customer_id, 10) !== req.user.customerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot view subscriptions of another customer.'
        });
      }

      // Force filter strictly to this customer's own subscriptions
      let query = `${BASE_SUBSCRIPTION_SELECT} WHERE s.customer_id = ?`;
      const params = [req.user.customerId];

      if (status) {
        query += ' AND s.status = ?';
        params.push(status);
      }

      query += ' ORDER BY s.created_at DESC';

      const [rows] = await pool.query(query, params);
      return res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
      });
    }

    // Staff/Admin or general development access
    let query = `${BASE_SUBSCRIPTION_SELECT} WHERE 1=1`;
    const params = [];

    if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(parseInt(customer_id, 10));
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/:id
 * Return a single subscription by ID with joined customer and plan data.
 * - Enforces role-based customer ownership check.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const subId = parseInt(req.params.id, 10);
    if (isNaN(subId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID provided.'
      });
    }

    const [rows] = await pool.query(
      `${BASE_SUBSCRIPTION_SELECT} WHERE s.id = ?`,
      [subId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Subscription with ID ${subId} not found.`
      });
    }

    const subscription = rows[0];

    // Customer ownership boundary check
    if (req.user && req.user.role === 'customer' && req.user.customerId !== subscription.customer_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view another customer’s subscription.'
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions
 * Creates a real subscription in the database.
 * - Validates customer exists in `customers` table.
 * - Validates plan exists in `plans` table.
 * - Validates start_date, end_date, next_billing_date, and status.
 * - Enforces customer ownership: customers cannot create subscriptions for other customers.
 */
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, plan_id, start_date, end_date, next_billing_date, status } = req.body;
    const normalizedStartDate = normalizeDateString(start_date);
    const normalizedEndDate = normalizeDateString(end_date);
    const normalizedNextBillingDate = normalizeDateString(next_billing_date);

    // 1. Validate customer_id
    if (!customer_id || isNaN(parseInt(customer_id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'A valid customer_id (integer) is required.'
      });
    }
    const customerIdNum = parseInt(customer_id, 10);

    // Security check: customer role cannot subscribe another customer
    if (req.user && req.user.role === 'customer' && req.user.customerId !== customerIdNum) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot create a subscription for another customer.'
      });
    }

    // 2. Validate plan_id
    if (!plan_id || isNaN(parseInt(plan_id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'A valid plan_id (integer) is required.'
      });
    }
    const planIdNum = parseInt(plan_id, 10);

    // 3. Validate start_date
    if (!normalizedStartDate) {
      return res.status(400).json({
        success: false,
        message: 'A valid start_date in YYYY-MM-DD or DD-MM-YYYY format is required.'
      });
    }

    // 4. Validate end_date if provided
    if (end_date !== undefined && end_date !== null && end_date !== '') {
      if (!normalizedEndDate) {
        return res.status(400).json({
          success: false,
          message: 'end_date must be in YYYY-MM-DD or DD-MM-YYYY format.'
        });
      }
      if (new Date(normalizedEndDate) < new Date(normalizedStartDate)) {
        return res.status(400).json({
          success: false,
          message: 'end_date must be on or after start_date.'
        });
      }
    }

    // 5. Validate next_billing_date if provided
    if (next_billing_date !== undefined && next_billing_date !== null && next_billing_date !== '') {
      if (!normalizedNextBillingDate) {
        return res.status(400).json({
          success: false,
          message: 'next_billing_date must be in YYYY-MM-DD or DD-MM-YYYY format.'
        });
      }
    }

    // 6. Validate status if provided
    const validStatuses = ['active', 'trial', 'paused', 'canceled', 'expired'];
    const subStatus = status ? status.toLowerCase() : 'trial';
    if (!validStatuses.includes(subStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}.`
      });
    }

    // 7. Verify customer exists in database
    const [customerRows] = await pool.query('SELECT id, name, email FROM customers WHERE id = ?', [customerIdNum]);
    if (customerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${customerIdNum} does not exist.`
      });
    }

    // 8. Verify plan exists in database
    const [planRows] = await pool.query('SELECT id, name, price, billing_cycle FROM plans WHERE id = ?', [planIdNum]);
    if (planRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Plan with ID ${planIdNum} does not exist.`
      });
    }

    // 9. Insert subscription
    const cleanEndDate = normalizedEndDate || null;
    const cleanNextBilling = normalizedNextBillingDate || null;

    const [insertResult] = await pool.query(
      `INSERT INTO subscriptions (customer_id, plan_id, start_date, end_date, next_billing_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerIdNum, planIdNum, normalizedStartDate, cleanEndDate, cleanNextBilling, subStatus]
    );

    // 10. Fetch inserted subscription with JOINed customer and plan details
    const [createdRows] = await pool.query(
      `${BASE_SUBSCRIPTION_SELECT} WHERE s.id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully.',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
