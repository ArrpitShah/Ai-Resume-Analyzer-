const API_URL = import.meta.env.VITE_API_URL || "https://ai-resume-analyzer-10-yb7s.onrender.com"

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error("❌ VITE_API_URL is not defined! API calls will fail in production.")
}

import axios from "axios"
const api = axios.create({ baseURL: API_URL, timeout: 120000 })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
export default api