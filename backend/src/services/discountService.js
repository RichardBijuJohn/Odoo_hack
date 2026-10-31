const pool = require('../config/db');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

function lifecycleStatus(discount, date = today()) {
  if (discount.status === 'inactive') return 'inactive';
  if (date < dateOnly(discount.start_date)) return 'scheduled';
  if (date > dateOnly(discount.end_date)) return 'expired';
  if (discount.usage_limit !== null && Number(discount.used_count) >= Number(discount.usage_limit)) return 'inactive';
  return 'active';
}

function validateDiscountInput(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const code = typeof input.code === 'string' ? input.code.trim().toUpperCase() : '';
  const type = input.discount_type;
  const value = Number(input.discount_value);
  const minimumPurchase = Number(input.minimum_purchase_amount || 0);
  const minimumQuantity = Number(input.minimum_quantity || 0);
  const usageLimit = input.usage_limit === '' || input.usage_limit === null || input.usage_limit === undefined
    ? null : Number(input.usage_limit);
  const startDate = input.start_date;
  const endDate = input.end_date;

  if (!name) throw httpError(400, 'Discount name is required.');
  if (!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(code)) throw httpError(400, 'Discount code must be 3-50 letters, numbers, underscores, or hyphens.');
  if (!['percentage', 'fixed'].includes(type)) throw httpError(400, 'Discount type must be percentage or fixed.');
  if (!Number.isFinite(value) || value <= 0) throw httpError(400, 'Discount value must be greater than zero.');
  if (type === 'percentage' && value > 100) throw httpError(400, 'Percentage discount cannot exceed 100%.');
  if (!Number.isFinite(minimumPurchase) || minimumPurchase < 0) throw httpError(400, 'Minimum purchase amount cannot be negative.');
  if (!Number.isFinite(minimumQuantity) || minimumQuantity < 0) throw httpError(400, 'Minimum quantity cannot be negative.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
    throw httpError(400, 'End date must be after or equal to the start date and both dates must be valid.');
  }
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) throw httpError(400, 'Usage limit must be a positive whole number.');
  if (!['product', 'subscription'].includes(input.apply_to || 'subscription')) throw httpError(400, 'Apply to must be product or subscription.');
  if (!['active', 'inactive'].includes(input.status || 'active')) throw httpError(400, 'Status must be active or inactive.');

  return {
    name, code, description: typeof input.description === 'string' ? input.description.trim() : null,
    discount_type: type, discount_value: roundMoney(value),
    minimum_purchase_amount: roundMoney(minimumPurchase), minimum_quantity: minimumQuantity,
    start_date: startDate, end_date: endDate, usage_limit: usageLimit,
    apply_to: input.apply_to || 'subscription', status: input.status || 'active',
    product_ids: [...new Set((input.product_ids || []).map(Number).filter(Number.isInteger))],
    plan_ids: [...new Set((input.plan_ids || []).map(Number).filter(Number.isInteger))],
  };
}

async function getDiscount(connection, id) {
  const [rows] = await connection.execute('SELECT * FROM discounts WHERE id = ?', [id]);
  if (!rows.length) return null;
  const [products] = await connection.execute('SELECT product_id FROM discount_products WHERE discount_id = ?', [id]);
  const [plans] = await connection.execute('SELECT plan_id FROM discount_plans WHERE discount_id = ?', [id]);
  return { ...rows[0], product_ids: products.map((row) => row.product_id), plan_ids: plans.map((row) => row.plan_id), lifecycle_status: lifecycleStatus(rows[0]) };
}

async function saveDiscount(connection, input, id = null) {
  const data = validateDiscountInput(input);
  const duplicateParams = id ? [data.code, id] : [data.code];
  const duplicateSql = id ? 'SELECT id FROM discounts WHERE code = ? AND id <> ?' : 'SELECT id FROM discounts WHERE code = ?';
  const [duplicate] = await connection.execute(duplicateSql, duplicateParams);
  if (duplicate.length) throw httpError(409, 'Discount code must be unique.');

  let discountId = id;
  if (id) {
    await connection.execute(
      `UPDATE discounts SET name=?, code=?, description=?, discount_type=?, discount_value=?,
       minimum_purchase_amount=?, minimum_quantity=?, start_date=?, end_date=?, usage_limit=?, apply_to=?, status=? WHERE id=?`,
      [data.name, data.code, data.description, data.discount_type, data.discount_value, data.minimum_purchase_amount, data.minimum_quantity, data.start_date, data.end_date, data.usage_limit, data.apply_to, data.status, id]
    );
    await connection.execute('DELETE FROM discount_products WHERE discount_id = ?', [id]);
    await connection.execute('DELETE FROM discount_plans WHERE discount_id = ?', [id]);
  } else {
    const [result] = await connection.execute(
      `INSERT INTO discounts (name, code, description, discount_type, discount_value, minimum_purchase_amount, minimum_quantity, start_date, end_date, usage_limit, apply_to, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.code, data.description, data.discount_type, data.discount_value, data.minimum_purchase_amount, data.minimum_quantity, data.start_date, data.end_date, data.usage_limit, data.apply_to, data.status]
    );
    discountId = result.insertId;
  }
  for (const productId of data.product_ids) await connection.execute('INSERT INTO discount_products (discount_id, product_id) VALUES (?, ?)', [discountId, productId]);
  for (const planId of data.plan_ids) await connection.execute('INSERT INTO discount_plans (discount_id, plan_id) VALUES (?, ?)', [discountId, planId]);
  return getDiscount(connection, discountId);
}

async function calculateDiscount(connection, { code, eligibleAmount, quantity = 0, productIds = [], planId = null, lineItems = [], incrementUsage = false }) {
  if (!code) return { discount: null, discountAmount: 0, eligibleAmount: roundMoney(eligibleAmount) };
  const [rows] = await connection.execute('SELECT * FROM discounts WHERE code = ? FOR UPDATE', [String(code).trim().toUpperCase()]);
  if (!rows.length) throw httpError(400, 'Discount code was not found.');
  const discount = rows[0];
  const status = lifecycleStatus(discount);
  if (status !== 'active') throw httpError(400, `Discount is ${status} and cannot be applied.`);
  const [productRows] = await connection.execute('SELECT product_id FROM discount_products WHERE discount_id = ?', [discount.id]);
  const [planRows] = await connection.execute('SELECT plan_id FROM discount_plans WHERE discount_id = ?', [discount.id]);
  let applicableAmount = Number(eligibleAmount);
  let applicableQuantity = Number(quantity);
  if (productRows.length) {
    const applicableProductIds = productRows.map((row) => Number(row.product_id));
    if (!productIds.some((id) => applicableProductIds.includes(Number(id)))) throw httpError(400, 'Discount does not apply to the selected products.');
    if (lineItems.length) {
      const applicableItems = lineItems.filter((item) => applicableProductIds.includes(Number(item.productId)));
      applicableAmount = applicableItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      applicableQuantity = applicableItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }
  }
  if (applicableAmount < Number(discount.minimum_purchase_amount)) throw httpError(400, 'Purchase amount does not meet the discount minimum.');
  if (applicableQuantity < Number(discount.minimum_quantity)) throw httpError(400, 'Quantity does not meet the discount minimum.');
  if (planRows.length && !planRows.some((row) => Number(row.plan_id) === Number(planId))) throw httpError(400, 'Discount does not apply to the selected subscription plan.');
  const amount = discount.discount_type === 'percentage'
    ? applicableAmount * Number(discount.discount_value) / 100
    : Number(discount.discount_value);
  const discountAmount = roundMoney(Math.min(amount, applicableAmount));
  if (incrementUsage) {
    if (discount.usage_limit !== null && Number(discount.used_count) >= Number(discount.usage_limit)) throw httpError(400, 'Discount usage limit has been reached.');
    await connection.execute('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?', [discount.id]);
  }
  return { discount, discountAmount, eligibleAmount: roundMoney(applicableAmount) };
}

module.exports = { lifecycleStatus, validateDiscountInput, getDiscount, saveDiscount, calculateDiscount, httpError };
