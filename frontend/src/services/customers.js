import API from './api'

/**
 * Fetch all customers from the backend.
 * GET /api/customers
 * @param {Object} [params] - Optional query parameters (search, status)
 * @returns {Promise<{success: boolean, count: number, data: Array}>}
 */
export const getCustomers = async (params = {}) => {
  return await API.get('/customers', { params })
}

/**
 * Fetch a single customer by ID.
 * GET /api/customers/:id
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export const getCustomerById = async (id) => {
  return await API.get(`/customers/${id}`)
}

/**
 * Create a new customer record.
 * POST /api/customers
 * @param {Object} customerData - { name, email, phone, address, company_name, status }
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export const createCustomer = async (customerData) => {
  return await API.post('/customers', customerData)
}

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
}

