import { Link, useNavigate } from "react-router-dom"
import useAuthStore from "../stores/authStore"

export default function NotFound() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const darkMode = useAuthStore(s => s.darkMode)

  const dm = darkMode
  const bg = dm ? "#0a0f1e" : "#f8fafc"
  const cardBg = dm ? "#111827" : "#fff"
  const text = dm ? "#f9fafb" : "#0f172a"
  const sub = dm ? "#94a3b8" : "#64748b"

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: bg, padding: "24px", textAlign: "center", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: "480px", width: "100%", background: cardBg, padding: "48px 32px", borderRadius: "32px", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", border: `1px solid ${dm ? "#1f2937" : "#f1f5f9"}` }}>
        <div style={{ 
          fontSize: "100px", fontWeight: 900, lineHeight: 1, marginBottom: "20px", 
          background: "linear-gradient(135deg, #2563EB, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          404
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: text, marginBottom: "12px", letterSpacing: "-0.5px" }}>
          Page Not Found
        </h1>
        <p style={{ color: sub, fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
          Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button 
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            style={{
              padding: "14px 24px", borderRadius: "16px", border: "none", background: "#2563EB", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}
          >
            Go to {user ? "Dashboard" : "Login"}
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            style={{
              padding: "14px 24px", borderRadius: "16px", border: `1px solid ${dm ? "#1f2937" : "#e2e8f0"}`, background: "transparent", color: text,
              fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}
          >
            Go Back
          </button>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${dm ? "#1f2937" : "#f1f5f9"}` }}>
          <p style={{ fontSize: "13px", color: sub }}>
            Need help? <Link to="/contact" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
