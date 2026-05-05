import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5000/api",
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const signup = (data) => API.post("/auth/signup", data)
export const login  = (data) => API.post("/auth/login", data)
export const logout = ()     => API.post("/auth/logout")
export const getMe  = ()     => API.get("/auth/me")