import { getUserFromToken } from "../Services/authService.js"



export async function protect(req, res, next) {
  try {
    
    const authHeader = req.headers["authorization"]
    console.log("[protect] Auth header:", authHeader?.substring(0, 30))

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Access denied. Invalid token format." })
    }


    const user = await getUserFromToken(token)

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token." })
    }

    
    req.user = {
      id:    user.id,
      email: user.email,
    }

    next()

  } catch (err) {
    console.error("[authMiddleware] Error:", err.message)
    return res.status(401).json({ error: "Invalid or expired token." })
  }
}



export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers["authorization"]

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      req.user = null
      return next()
    }

    const token = authHeader.split(" ")[1]
    const user  = await getUserFromToken(token)

    req.user = user ? { id: user.id, email: user.email } : null
    next()

  } catch (err) {
    req.user = null
    next()
  }
}