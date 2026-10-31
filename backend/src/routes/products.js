const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');

const router = express.Router();
const statuses = ['active', 'inactive', 'archived'];
const stockStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
const maxMoney = 99999999.99;
const maxStock = 999999999.999;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function numberField(value, label, { min = 0, max = maxStock, decimals = 3, nullable = false } = {}) {
  if (nullable && (value === '' || value === null || value === undefined)) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw httpError(400, `${label} must be between ${min} and ${max}.`);
  }
  const scale = 10 ** decimals;
  if (Math.abs(number * scale - Math.round(number * scale)) > 1e-7) {
    throw httpError(400, `${label} supports at most ${decimals} decimal places.`);
  }
  return number;
}

function parseId(value, label = 'Product') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, `${label} ID must be a positive integer.`);
  return id;
}

function parseProduct(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 150) throw httpError(400, 'Product name is required and must be 150 characters or fewer.');

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (code.length > 50) throw httpError(400, 'SKU must be 50 characters or fewer.');
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length > 10000) throw httpError(400, 'Description must be 10,000 characters or fewer.');
  const categoryId = parseId(body.category_id, 'Category');
  const price = numberField(body.price, 'Selling price', { max: maxMoney, decimals: 2 });
  const costPrice = numberField(body.cost_price, 'Cost price', { max: maxMoney, decimals: 2, nullable: true });
  const stockQuantity = numberField(body.stock_quantity, 'Available quantity');
  const minimumStockLevel = numberField(body.minimum_stock_level ?? 0, 'Minimum stock level');
  const unitOfMeasure = typeof body.unit_of_measure === 'string' ? body.unit_of_measure.trim() : 'unit';
  if (!unitOfMeasure || unitOfMeasure.length > 30) throw httpError(400, 'Unit of measurement is required and must be 30 characters or fewer.');
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      throw httpError(400, 'Product image must be a valid HTTP or HTTPS URL.');
    }
  }
  const status = typeof body.status === 'string' ? body.status : 'active';
  if (!statuses.includes(status)) throw httpError(400, 'Status must be active, inactive, or archived.');

  return { name, code, description, categoryId, price, costPrice, stockQuantity, minimumStockLevel, unitOfMeasure, imageUrl: imageUrl || null, status };
}

function generatedSku() {
  return `PRD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function productSelect(where = '') {
  return `SELECT p.id, p.code, p.name, p.description, p.category_id,
                 COALESCE(pc.name, p.category) AS category, pc.name AS category_name,
                 p.price, p.cost_price, p.stock_quantity, p.minimum_stock_level,
                 p.unit_of_measure, p.image_url, p.status, p.created_at, p.updated_at,
                 CASE WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                      WHEN p.minimum_stock_level > 0 AND p.stock_quantity <= p.minimum_stock_level THEN 'low_stock'
                      ELSE 'in_stock' END AS stock_status
          FROM products p LEFT JOIN product_categories pc ON pc.id = p.category_id ${where}`;
}

async function getProduct(connection, id) {
  const [rows] = await connection.execute(productSelect('WHERE p.id = ?'), [id]);
  return rows[0] || null;
}

async function getCategory(connection, id) {
  const [rows] = await connection.execute('SELECT id, name FROM product_categories WHERE id = ?', [id]);
  if (!rows.length) throw httpError(400, 'Selected product category does not exist.');
  return rows[0];
}

function parseCategory(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!name || name.length > 50) throw httpError(400, 'Category name is required and must be 50 characters or fewer.');
  if (description.length > 255) throw httpError(400, 'Category description must be 255 characters or fewer.');
  return { name, description: description || null };
}

function handleDuplicate(error, res, next) {
  if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'A product or category with that name already exists.'));
  return next(error);
}

router.get('/summary', async (req, res, next) => {
  try {
    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS total_products,
              COALESCE(SUM(status = 'active'), 0) AS active_products,
              COALESCE(SUM(stock_quantity <= 0), 0) AS out_of_stock_products,
              COALESCE(SUM(stock_quantity > 0 AND minimum_stock_level > 0 AND stock_quantity <= minimum_stock_level), 0) AS low_stock_products,
              COUNT(DISTINCT category_id) AS used_categories
       FROM products`
    );
    const [[categoryCount]] = await pool.query('SELECT COUNT(*) AS total_categories FROM product_categories');
    const [recent] = await pool.query(
      `SELECT id, code, name, category, price, created_at FROM products
       ORDER BY created_at DESC, id DESC LIMIT 5`
    );
    res.json({
      success: true,
      data: {
        total_products: Number(summary.total_products),
        active_products: Number(summary.active_products),
        out_of_stock_products: Number(summary.out_of_stock_products),
        low_stock_products: Number(summary.low_stock_products),
        total_categories: Number(categoryCount.total_categories),
        used_categories: Number(summary.used_categories),
        recently_added: recent
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, COUNT(p.id) AS product_count
       FROM product_categories c LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, c.name, c.description, c.created_at ORDER BY c.name`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const category = parseCategory(req.body);
    const [result] = await pool.execute(
      'INSERT INTO product_categories (name, description) VALUES (?, ?)',
      [category.name, category.description]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, ...category, product_count: 0 } });
  } catch (error) {
    handleDuplicate(error, res, next);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'Category');
    const category = parseCategory(req.body);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute('SELECT id FROM product_categories WHERE id = ? FOR UPDATE', [id]);
      if (!existing.length) throw httpError(404, 'Product category not found.');
      await connection.execute('UPDATE product_categories SET name = ?, description = ? WHERE id = ?', [category.name, category.description, id]);
      await connection.execute('UPDATE products SET category = ? WHERE category_id = ?', [category.name, id]);
      await connection.commit();
      res.json({ success: true, data: { id, ...category } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    handleDuplicate(error, res, next);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'Category');
    const [usage] = await pool.execute('SELECT COUNT(*) AS product_count FROM products WHERE category_id = ?', [id]);
    if (!usage.length) throw httpError(404, 'Product category not found.');
    if (Number(usage[0].product_count) > 0) throw httpError(409, 'This category is in use. Reassign its products before deleting it.');
    const [result] = await pool.execute('DELETE FROM product_categories WHERE id = ?', [id]);
    if (!result.affectedRows) throw httpError(404, 'Product category not found.');
    res.json({ success: true, message: 'Product category deleted.' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const conditions = [];
    const parameters = [];
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      conditions.push('(p.name LIKE ? OR p.code LIKE ? OR CAST(p.id AS CHAR) LIKE ?)');
      parameters.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.category_id) {
      conditions.push('p.category_id = ?');
      parameters.push(parseId(req.query.category_id, 'Category'));
    }
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) throw httpError(400, 'Select a valid product status.');
      conditions.push('p.status = ?');
      parameters.push(req.query.status);
    }
    if (req.query.stock_status) {
      if (!stockStatuses.includes(req.query.stock_status)) throw httpError(400, 'Select a valid stock status.');
      if (req.query.stock_status === 'out_of_stock') conditions.push('p.stock_quantity <= 0');
      if (req.query.stock_status === 'low_stock') conditions.push('p.stock_quantity > 0 AND p.minimum_stock_level > 0 AND p.stock_quantity <= p.minimum_stock_level');
      if (req.query.stock_status === 'in_stock') conditions.push('p.stock_quantity > p.minimum_stock_level');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortColumns = { name: 'p.name', price: 'p.price', recent: 'p.created_at', stock: 'p.stock_quantity' };
    const sortColumn = sortColumns[req.query.sort_by] || sortColumns.recent;
    const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `${productSelect(where)} ORDER BY ${sortColumn} ${direction}, p.id DESC LIMIT ? OFFSET ?`,
      [...parameters, pageSize, offset]
    );
    const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM products p ${where}`, parameters);
    res.json({
      success: true,
      data: rows,
      pagination: { page, page_size: pageSize, total: Number(count.total), total_pages: Math.ceil(Number(count.total) / pageSize) }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  let connection;
  try {
    const id = parseId(req.params.id);
    connection = await pool.getConnection();
    const product = await getProduct(connection, id);
    if (!product) throw httpError(404, 'Product not found.');
    const [history] = await connection.execute(
      `SELECT id, previous_quantity, quantity_change, new_quantity, reason, created_at
       FROM product_stock_movements WHERE product_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
      [id]
    );
    res.json({ success: true, data: { ...product, stock_history: history } });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', async (req, res, next) => {
  let connection;
  try {
    const product = parseProduct(req.body);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const category = await getCategory(connection, product.categoryId);
    const code = product.code || generatedSku();
    const [result] = await connection.execute(
      `INSERT INTO products
        (code, name, description, category, category_id, price, cost_price, stock_quantity,
         minimum_stock_level, unit_of_measure, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, product.name, product.description || null, category.name, category.id, product.price, product.costPrice,
        product.stockQuantity, product.minimumStockLevel, product.unitOfMeasure, product.imageUrl, product.status]
    );
    if (product.stockQuantity > 0) {
      await connection.execute(
        `INSERT INTO product_stock_movements (product_id, previous_quantity, quantity_change, new_quantity, reason)
         VALUES (?, 0, ?, ?, 'Initial stock')`,
        [result.insertId, product.stockQuantity, product.stockQuantity]
      );
    }
    const created = await getProduct(connection, result.insertId);
    await connection.commit();
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    handleDuplicate(error, res, next);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id', async (req, res, next) => {
  let connection;
  try {
    const id = parseId(req.params.id);
    const product = parseProduct(req.body);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existingRows] = await connection.execute('SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE', [id]);
    if (!existingRows.length) throw httpError(404, 'Product not found.');
    const category = await getCategory(connection, product.categoryId);
    const code = product.code || generatedSku();
    const previousQuantity = Number(existingRows[0].stock_quantity);
    await connection.execute(
      `UPDATE products SET code = ?, name = ?, description = ?, category = ?, category_id = ?,
         price = ?, cost_price = ?, stock_quantity = ?, minimum_stock_level = ?,
         unit_of_measure = ?, image_url = ?, status = ? WHERE id = ?`,
      [code, product.name, product.description || null, category.name, category.id, product.price, product.costPrice,
        product.stockQuantity, product.minimumStockLevel, product.unitOfMeasure, product.imageUrl, product.status, id]
    );
    if (previousQuantity !== product.stockQuantity) {
      await connection.execute(
        `INSERT INTO product_stock_movements (product_id, previous_quantity, quantity_change, new_quantity, reason)
         VALUES (?, ?, ?, ?, 'Product details updated')`,
        [id, previousQuantity, product.stockQuantity - previousQuantity, product.stockQuantity]
      );
    }
    const updated = await getProduct(connection, id);
    await connection.commit();
    res.json({ success: true, data: updated });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    handleDuplicate(error, res, next);
  } finally {
    if (connection) connection.release();
  }
});

router.patch('/:id/stock', async (req, res, next) => {
  let connection;
  try {
    const id = parseId(req.params.id);
    const quantity = numberField(req.body.stock_quantity, 'Available quantity');
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason || reason.length > 255) throw httpError(400, 'A stock adjustment reason of 1 to 255 characters is required.');
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw httpError(404, 'Product not found.');
    const previousQuantity = Number(rows[0].stock_quantity);
    const change = quantity - previousQuantity;
    await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [quantity, id]);
    if (change !== 0) {
      await connection.execute(
        `INSERT INTO product_stock_movements (product_id, previous_quantity, quantity_change, new_quantity, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [id, previousQuantity, change, quantity, reason]
      );
    }
    const updated = await getProduct(connection, id);
    await connection.commit();
    res.json({ success: true, data: updated });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const [[product]] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) throw httpError(404, 'Product not found.');
    const [[usage]] = await pool.execute('SELECT COUNT(*) AS plan_count FROM plans WHERE product_id = ?', [id]);
    if (Number(usage.plan_count) > 0) throw httpError(409, 'This product is used by subscription plans. Archive it instead of deleting it.');
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
