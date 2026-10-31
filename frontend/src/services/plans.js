import API from './api'

export const getPlans = async () => API.get('/plans')

export const createPlan = async (planData) => API.post('/plans', planData)

export default {
  getPlans,
  createPlan,
}