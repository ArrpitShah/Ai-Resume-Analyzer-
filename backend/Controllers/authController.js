import {
  signUp,
  login,
  logout,
  refreshSession,
  forgotPassword,
} from "../Services/authService.js"


export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email aur password required hain." })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimum 6 characters ka hona chahiye." })
    }

    const result = await signUp({ email, password, fullName: fullName ?? "" })
    res.status(201).json(result)

  } catch (err) {
    console.error("[register] Error:", err.message)

    if (err.message.includes("already registered")) {
      return res.status(409).json({ error: "Email already registered." })
    }

    res.status(500).json({ error: "Signup failed. Please try again." })
  }
}



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email aur password required hain." })
    }

    const result = await login({ email, password })
    res.json(result)

  } catch (err) {
    console.error("[login] Error:", err.message)

    if (err.message.includes("Invalid login")) {
      return res.status(401).json({ error: "Invalid email or password." })
    }

    res.status(500).json({ error: "Login failed. Please try again." })
  }
}



export const logoutUser = async (req, res) => {
  try {
    const result = await logout()
    res.json(result)
  } catch (err) {
    console.error("[logout] Error:", err.message)
    res.status(500).json({ error: "Logout failed." })
  }
}


export const getMe = async (req, res) => {
  res.json({
    user_id: req.user.id,
    email:   req.user.email,
  })
}


export const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required." })
    }

    const result = await refreshSession(refresh_token)
    res.json(result)

  } catch (err) {
    console.error("[refresh] Error:", err.message)
    res.status(401).json({ error: "Token refresh failed." })
  }
}



export const forgotPasswordHandler = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email required." })
    }

    const result = await forgotPassword(email)
    res.json(result)

  } catch (err) {
    console.error("[forgotPassword] Error:", err.message)
    res.status(500).json({ error: "Failed to send reset email." })
  }
}