import API from './api'

export const getDiscounts = (params = {}) => API.get('/discounts', { params })
export const createDiscount = (data) => API.post('/discounts', data)
export const updateDiscount = (id, data) => API.put(`/discounts/${id}`, data)
export const activateDiscount = (id) => API.patch(`/discounts/${id}/activate`)
export const deactivateDiscount = (id) => API.patch(`/discounts/${id}/deactivate`)
export const deleteDiscount = (id) => API.delete(`/discounts/${id}`)
