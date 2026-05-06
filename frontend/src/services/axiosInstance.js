
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,  
})


axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default axiosInstance