const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

// Attach user authentication context
router.use(authenticate);

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

// Phone validation helper (optional string, 7-20 chars if provided)
const isValidPhone = (phone) => {
  if (phone === undefined || phone === null || phone === '') return true;
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.trim());
};

/**
 * GET /api/customers
 * Returns customer records from the database.
 * - Staff/Admin can view all customers (with optional search & status filter).
 * - Customer role can view only their own profile.
 */
router.get('/', async (req, res, next) => {
  try {
    // If authenticated as a customer, restrict to their own record
    if (req.user && req.user.role === 'customer') {
      if (!req.user.customerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No customer profile linked to this user.'
        });
      }

      const [rows] = await pool.query(
        'SELECT id, name, email, phone, address, company_name, status, created_at, updated_at FROM customers WHERE id = ?',
        [req.user.customerId]
      );

      return res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
      });
    }

    // For staff/admin or unauthenticated internal calls during development
    const { search, status } = req.query;
    let query = 'SELECT id, name, email, phone, address, company_name, status, created_at, updated_at FROM customers WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR company_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

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
 * GET /api/customers/:id
 * Fetch single customer by ID.
 * - Customers can ONLY view their own ID.
 * - Staff/Admin can view any.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided.'
      });
    }

    // Role-based boundary: customer cannot access another customer's record
    if (req.user && req.user.role === 'customer' && req.user.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view another customer’s details.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, address, company_name, status, created_at, updated_at FROM customers WHERE id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${customerId} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers
 * Creates a real customer in the database.
 * - Enforces required fields, email format, email uniqueness, phone validation.
 * - Respects staff/admin authorization when auth is present.
 */
router.post('/', async (req, res, next) => {
  try {
    // If auth is provided and role is 'customer', prevent creating arbitrary customer accounts
    if (req.user && req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only staff or administrators can create new customers.'
      });
    }

    const { name, email, phone, address, company_name, status } = req.body;

    // 1. Validate required name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required and must be a non-empty string.'
      });
    }

    // 2. Validate required email format
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    // 3. Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format.'
      });
    }

    // 4. Validate status enum if provided
    const validStatuses = ['active', 'inactive', 'lead'];
    const customerStatus = status ? status.toLowerCase() : 'active';
    if (!validStatuses.includes(customerStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}.`
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;
    const cleanAddress = address ? address.trim() : null;
    const cleanCompany = company_name ? company_name.trim() : null;

    // 5. Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A customer with email '${trimmedEmail}' already exists.`
      });
    }

    // 6. Insert new customer using parameterized query
    const [result] = await pool.query(
      `INSERT INTO customers (name, email, phone, address, company_name, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trimmedName, trimmedEmail, cleanPhone, cleanAddress, cleanCompany, customerStatus]
    );

    // 7. Fetch the newly created record
    const [createdRows] = await pool.query(
      'SELECT id, name, email, phone, address, company_name, status, created_at, updated_at FROM customers WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
