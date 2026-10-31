import API from './api'

export const getSubscriptionOptions = () => API.get('/subscriptions/options')
export const getSubscriptions = (params = {}) => API.get('/subscriptions', { params })
export const getSubscriptionSummary = () => API.get('/subscriptions/summary')
export const getSubscriptionById = (id) => API.get(`/subscriptions/${id}`)
export const createSubscription = (data) => API.post('/subscriptions', data)
export const cancelSubscription = (id, reason) => API.patch(`/subscriptions/${id}/cancel`, { reason })
export const confirmSubscriptionPayment = (id) => API.patch(`/subscriptions/${id}/confirm-payment`)
export const renewSubscription = (id) => API.post(`/subscriptions/${id}/renew`)

export default {
  getSubscriptionOptions,
  getSubscriptions,
  getSubscriptionSummary,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  confirmSubscriptionPayment,
  renewSubscription,
}
