import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Optional response interceptor for easier error handling
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error.response?.data || error.message)
  }
)

API.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('bl_current_user')
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser)
      if (user?.role) config.headers['x-user-role'] = user.role
      if (user?.id) config.headers['x-user-id'] = String(user.id)
    } catch {
      // Ignore malformed local demo state; the server will return the auth error.
    }
  }
  return config
})

export default API
