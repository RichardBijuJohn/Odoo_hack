import API from './api'

/**
 * Fetch all subscriptions from the backend with joined customer and plan details.
 * GET /api/subscriptions
 * @param {Object} [params] - Optional query parameters (customer_id, status)
 * @returns {Promise<{success: boolean, count: number, data: Array}>}
 */
export const getSubscriptions = async (params = {}) => {
  return await API.get('/subscriptions', { params })
}

/**
 * Fetch a single subscription by ID.
 * GET /api/subscriptions/:id
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export const getSubscriptionById = async (id) => {
  return await API.get(`/subscriptions/${id}`)
}

/**
 * Create a new subscription record.
 * POST /api/subscriptions
 * @param {Object} subscriptionData - { customer_id, plan_id, start_date, end_date, next_billing_date, status }
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export const createSubscription = async (subscriptionData) => {
  return await API.post('/subscriptions', subscriptionData)
}

export default {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
}

