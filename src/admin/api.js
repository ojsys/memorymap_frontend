import axios from 'axios'

const API_ORIGIN = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({ baseURL: `${API_ORIGIN}/api` })

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mm_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retried) {
      const refresh = localStorage.getItem('mm_admin_refresh')
      if (refresh) {
        try {
          const res = await axios.post(`${API_ORIGIN}/api/token/refresh/`, { refresh })
          localStorage.setItem('mm_admin_token', res.data.access)
          err.config._retried = true
          err.config.headers.Authorization = `Bearer ${res.data.access}`
          return api(err.config)
        } catch {
          localStorage.removeItem('mm_admin_token')
          localStorage.removeItem('mm_admin_refresh')
          window.location.href = '/admin-panel/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
