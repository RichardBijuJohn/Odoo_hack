const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const reportTypes = ['summary', 'detailed', 'daily', 'weekly', 'monthly', 'custom'];
const reportTypeLabels = {
  summary: 'Summary',
  detailed: 'Detailed',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom'
};
const maxRows = 5000;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${label} must use YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${label} must be a valid date.`);
  }
  return value;
}

function dateRange(type, filters) {
  let startDate = filters.start_date || '';
  let endDate = filters.end_date || '';

  if (type === 'daily' && !startDate && !endDate) {
    startDate = endDate = new Date().toISOString().slice(0, 10);
  } else if (type === 'weekly' && !startDate && !endDate) {
    const today = new Date();
    const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    startDate = monday.toISOString().slice(0, 10);
    endDate = sunday.toISOString().slice(0, 10);
  } else if (type === 'monthly' && !startDate && !endDate) {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  } else if (type === 'daily') {
    startDate = endDate = startDate || endDate;
  }

  if (startDate) startDate = validDate(startDate, 'Start date');
  if (endDate) endDate = validDate(endDate, 'End date');
  if (startDate && endDate && startDate > endDate) {
    throw httpError(400, 'Start date cannot be after end date.');
  }
  return { start_date: startDate || null, end_date: endDate || null };
}

const entities = {
  customers: {
    label: 'Customers',
    from: 'FROM customers c',
    select: 'c.id, c.name, c.email, c.phone, c.company_name, c.status, c.created_at',
    date: 'c.created_at',
    status: 'c.status',
    category: 'c.company_name',
    search: ['CAST(c.id AS CHAR)', 'c.name', 'c.email', 'c.company_name'],
    statuses: ['active', 'inactive', 'lead']
  },
  products: {
    label: 'Products',
    from: 'FROM products p',
    select: 'p.id, p.code, p.name, p.description, p.category, p.price, p.status, p.created_at',
    date: 'p.created_at',
    status: 'p.status',
    category: 'p.category',
    search: ['CAST(p.id AS CHAR)', 'p.code', 'p.name', 'p.category'],
    statuses: ['active', 'archived'],
    totals: { price: 'SUM(p.price)' }
  },
  plans: {
    label: 'Plans',
    from: 'FROM plans p LEFT JOIN products pr ON pr.id = p.product_id',
    select: 'p.id, p.name, p.billing_cycle, p.price, p.currency, p.trial_days, p.user_limit, p.status, pr.name AS product_name, p.created_at',
    date: 'p.created_at',
    status: 'p.status',
    category: 'p.billing_cycle',
    search: ['CAST(p.id AS CHAR)', 'p.name', 'pr.name', 'p.billing_cycle'],
    statuses: ['active', 'archived'],
    totals: { price: 'SUM(p.price)' }
  },
  subscriptions: {
    label: 'Subscriptions',
    from: 'FROM subscriptions s JOIN customers c ON c.id = s.customer_id JOIN plans p ON p.id = s.plan_id',
    select: 's.id, c.name AS customer_name, c.email AS customer_email, p.name AS plan_name, p.price, p.billing_cycle, s.status, s.start_date, s.end_date, s.next_billing_date, s.created_at',
    date: 's.created_at',
    status: 's.status',
    category: 'p.name',
    search: ['CAST(s.id AS CHAR)', 'c.name', 'c.email', 'p.name'],
    statuses: ['active', 'trial', 'paused', 'canceled', 'expired'],
    userId: 'c.id'
  },
  invoices: {
    label: 'Invoices',
    from: 'FROM invoices i JOIN customers c ON c.id = i.customer_id',
    select: 'i.id, i.invoice_number, c.name AS customer_name, c.email AS customer_email, i.subscription_id, i.amount, i.tax_amount, i.total_amount, i.paid_amount, GREATEST(i.total_amount - i.paid_amount, 0) AS balance_due, i.status, i.issue_date, i.due_date, i.created_at',
    date: 'i.issue_date',
    status: 'i.status',
    category: 'c.name',
    search: ['CAST(i.id AS CHAR)', 'i.invoice_number', 'c.name', 'c.email'],
    statuses: ['draft', 'confirmed', 'paid', 'cancelled'],
    totals: {
      subtotal: 'SUM(i.amount)',
      tax: 'SUM(i.tax_amount)',
      total: 'SUM(i.total_amount)',
      paid: 'SUM(i.paid_amount)',
      balance_due: 'SUM(GREATEST(i.total_amount - i.paid_amount, 0))'
    }
  },
  payments: {
    label: 'Payments',
    from: 'FROM payments p JOIN invoices i ON i.id = p.invoice_id JOIN customers c ON c.id = i.customer_id',
    select: 'p.id, i.invoice_number, c.name AS customer_name, p.amount, p.payment_method, p.transaction_ref, p.note, p.status, p.payment_date',
    date: 'p.payment_date',
    status: 'p.status',
    category: 'p.payment_method',
    search: ['CAST(p.id AS CHAR)', 'i.invoice_number', 'c.name', 'p.transaction_ref'],
    statuses: ['completed', 'pending', 'failed', 'refunded'],
    totals: { amount: 'SUM(p.amount)' }
  },
  discounts: {
    label: 'Discounts',
    from: 'FROM discounts d',
    select: 'd.id, d.code, d.description, d.discount_type, d.discount_value, d.start_date, d.end_date, d.max_uses, d.times_used, d.status, d.created_at',
    date: 'd.created_at',
    status: 'd.status',
    category: 'd.discount_type',
    search: ['CAST(d.id AS CHAR)', 'd.code', 'd.description'],
    statuses: ['active', 'expired', 'disabled'],
    totals: { discount_value: 'SUM(d.discount_value)' }
  },
  staff: {
    label: 'Staff',
    from: 'FROM users u',
    select: 'u.id, u.name, u.email, u.role, u.status, u.created_at',
    date: 'u.created_at',
    status: 'u.status',
    category: 'u.role',
    search: ['CAST(u.id AS CHAR)', 'u.name', 'u.email', 'u.role'],
    statuses: ['active', 'inactive'],
    userId: 'u.id'
  }
};

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildWhere(entity, filters) {
  const conditions = [];
  const parameters = [];
  if (filters.start_date) {
    conditions.push(`DATE(${entity.date}) >= ?`);
    parameters.push(filters.start_date);
  }
  if (filters.end_date) {
    conditions.push(`DATE(${entity.date}) <= ?`);
    parameters.push(filters.end_date);
  }
  if (filters.status) {
    if (!entity.statuses.includes(filters.status)) throw httpError(400, 'Select a valid status for this data source.');
    conditions.push(`${entity.status} = ?`);
    parameters.push(filters.status);
  }
  if (filters.category) {
    conditions.push(`CAST(${entity.category} AS CHAR) LIKE ?`);
    parameters.push(`%${filters.category}%`);
  }
  if (filters.search) {
    conditions.push(`(${entity.search.map((field) => `${field} LIKE ?`).join(' OR ')})`);
    parameters.push(...entity.search.map(() => `%${filters.search}%`));
  }
  if (filters.user_id && entity.userId) {
    conditions.push(`${entity.userId} = ?`);
    parameters.push(filters.user_id);
  }
  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    parameters
  };
}

async function overviewReport() {
  const [rows] = await pool.query(
    `SELECT 'Customers' AS section, COUNT(*) AS records, NULL AS value FROM customers
     UNION ALL SELECT 'Products', COUNT(*), NULL FROM products
     UNION ALL SELECT 'Plans', COUNT(*), NULL FROM plans
     UNION ALL SELECT 'Subscriptions', COUNT(*), NULL FROM subscriptions
     UNION ALL SELECT 'Invoices', COUNT(*), COALESCE(SUM(total_amount), 0) FROM invoices
     UNION ALL SELECT 'Payments', COUNT(*), COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) FROM payments
     UNION ALL SELECT 'Discounts', COUNT(*), NULL FROM discounts
     UNION ALL SELECT 'Staff', COUNT(*), NULL FROM users`
  );
  const [balances] = await pool.query(
    `SELECT COALESCE(SUM(GREATEST(total_amount - paid_amount, 0)), 0) AS outstanding
     FROM invoices WHERE status = 'confirmed'`
  );
  return {
    data: rows,
    summary: {
      record_count: rows.reduce((total, row) => total + Number(row.records), 0),
      module_count: rows.length,
      invoice_value: Number(rows.find((row) => row.section === 'Invoices').value || 0),
      payments_received: Number(rows.find((row) => row.section === 'Payments').value || 0),
      outstanding_balance: Number(balances[0].outstanding || 0)
    },
    truncated: false
  };
}

async function generateEntityReport(entityName, filters) {
  const entity = entities[entityName];
  const { clause, parameters } = buildWhere(entity, filters);
  const [aggregateRows] = await pool.execute(
    `SELECT COUNT(*) AS record_count${Object.entries(entity.totals || {}).map(([key, expression]) => `, ${expression} AS ${key}`).join('')}
     ${entity.from} ${clause}`,
    parameters
  );
  const recordCount = Number(aggregateRows[0].record_count || 0);
  const [data] = await pool.execute(
    `SELECT ${entity.select} ${entity.from} ${clause} ORDER BY ${entity.date} DESC LIMIT ?`,
    [...parameters, maxRows]
  );
  let statusBreakdown = [];
  if (entity.status) {
    const [statuses] = await pool.execute(
      `SELECT ${entity.status} AS status, COUNT(*) AS count ${entity.from} ${clause} GROUP BY ${entity.status} ORDER BY count DESC`,
      parameters
    );
    statusBreakdown = statuses.map((row) => ({ status: row.status, count: Number(row.count) }));
  }
  const totals = Object.fromEntries(
    Object.keys(entity.totals || {}).map((key) => [key, Number(aggregateRows[0][key] || 0)])
  );
  return {
    data,
    summary: { record_count: recordCount, status_breakdown: statusBreakdown, totals },
    truncated: recordCount > data.length
  };
}

async function listHistory(limit = 10) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.report_name, r.report_type, r.entity, r.record_count, r.export_format,
            r.file_name, r.created_at, u.name AS generated_by
     FROM report_runs r LEFT JOIN users u ON u.id = r.generated_by
     ORDER BY r.created_at DESC, r.id DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

router.get('/', async (req, res, next) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total_reports,
              COALESCE(SUM(DATE(created_at) = CURRENT_DATE), 0) AS reports_today,
              COALESCE(SUM(created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')), 0) AS monthly_reports
       FROM report_runs`
    );
    const [frequentRows] = await pool.query(
      `SELECT report_name, COUNT(*) AS count FROM report_runs
       GROUP BY report_name ORDER BY count DESC, report_name LIMIT 1`
    );
    const [activity] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS report_date, COUNT(*) AS count FROM report_runs
       WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY report_date`
    );
    const history = await listHistory(8);
    res.json({
      success: true,
      data: {
        summary: {
          total_reports: Number(stats.total_reports),
          reports_today: Number(stats.reports_today),
          monthly_reports: Number(stats.monthly_reports),
          most_frequent: frequentRows[0] || null
        },
        activity,
        history
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    res.json({ success: true, data: await listHistory(50) });
  } catch (error) {
    next(error);
  }
});

router.get('/history/:id/download', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Report ID must be a positive integer.');
    const [rows] = await pool.execute(
      'SELECT file_name, file_type, file_data FROM report_runs WHERE id = ?',
      [Number(req.params.id)]
    );
    if (!rows.length) throw httpError(404, 'Report not found.');
    if (!rows[0].file_data) throw httpError(404, 'This report has no saved export file yet. Open it and export a format first.');
    res.set({
      'Content-Type': rows[0].file_type,
      'Content-Disposition': `attachment; filename="${rows[0].file_name}"`
    });
    res.send(rows[0].file_data);
  } catch (error) {
    next(error);
  }
});

router.get('/history/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Report ID must be a positive integer.');
    const [rows] = await pool.execute(
      `SELECT r.id, r.report_name, r.report_type, r.entity, r.record_count, r.export_format,
              r.file_name, r.created_at, u.name AS generated_by, r.filters_json, r.summary_json, r.data_json
       FROM report_runs r LEFT JOIN users u ON u.id = r.generated_by WHERE r.id = ?`,
      [Number(req.params.id)]
    );
    if (!rows.length) throw httpError(404, 'Report not found.');
    const report = rows[0];
    res.json({
      success: true,
      data: {
        ...report,
        filters: parseJson(report.filters_json, {}),
        summary: parseJson(report.summary_json, {}),
        data: parseJson(report.data_json, [])
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/history/:id/file', express.raw({ type: 'application/octet-stream', limit: '20mb' }), async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Report ID must be a positive integer.');
    const format = req.query.format;
    const formats = {
      csv: { type: 'text/csv; charset=utf-8', extension: 'csv' },
      xlsx: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' },
      pdf: { type: 'application/pdf', extension: 'pdf' }
    };
    if (!formats[format]) throw httpError(400, 'Export format must be csv, xlsx, or pdf.');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw httpError(400, 'The export file is empty.');
    const filename = String(req.query.filename || `report-${req.params.id}.${formats[format].extension}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
    const [result] = await pool.execute(
      `UPDATE report_runs SET export_format = ?, file_name = ?, file_type = ?, file_data = ? WHERE id = ?`,
      [format, filename, formats[format].type, req.body, Number(req.params.id)]
    );
    if (!result.affectedRows) throw httpError(404, 'Report not found.');
    res.json({ success: true, data: { file_name: filename, export_format: format } });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const type = req.body.report_type;
    const entityName = req.body.entity;
    if (!reportTypes.includes(type)) throw httpError(400, 'Select a valid report type.');
    if (entityName !== 'overview' && !entities[entityName]) throw httpError(400, 'Select a valid report data source.');

    const incoming = req.body.filters && typeof req.body.filters === 'object' ? req.body.filters : req.body;
    const dates = dateRange(type, incoming);
    const search = typeof incoming.search === 'string' ? incoming.search.trim().slice(0, 100) : '';
    const status = typeof incoming.status === 'string' ? incoming.status.trim() : '';
    const category = typeof incoming.category === 'string' ? incoming.category.trim().slice(0, 100) : '';
    let userId = null;
    if (incoming.user_id !== undefined && incoming.user_id !== '') {
      userId = Number(incoming.user_id);
      if (!Number.isInteger(userId) || userId < 1) throw httpError(400, 'User ID must be a positive integer.');
    }
    const filters = { ...dates, status: status || null, category: category || null, search: search || null, user_id: userId };

    let result;
    if (entityName === 'overview') {
      if (type !== 'summary') throw httpError(400, 'Choose a specific data source for date-based reports.');
      result = await overviewReport();
    } else {
      result = await generateEntityReport(entityName, filters);
    }

    const reportName = `${reportTypeLabels[type]} Report - ${entityName === 'overview' ? 'Overview' : entities[entityName].label}`;
    const userIdFromAuth = Number(req.user?.id) || null;
    const [insert] = await pool.execute(
      `INSERT INTO report_runs
        (report_name, report_type, entity, generated_by, filters_json, summary_json, data_json, record_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reportName, type, entityName, userIdFromAuth, JSON.stringify(filters), JSON.stringify(result.summary), JSON.stringify(result.data), result.summary.record_count]
    );
    const [createdRows] = await pool.execute(
      `SELECT id, created_at FROM report_runs WHERE id = ?`,
      [insert.insertId]
    );
    res.status(201).json({
      success: true,
      data: {
        id: insert.insertId,
        report_name: reportName,
        report_type: type,
        entity: entityName,
        generated_by: null,
        generated_at: createdRows[0].created_at,
        filters,
        summary: result.summary,
        data: result.data,
        truncated: result.truncated
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
