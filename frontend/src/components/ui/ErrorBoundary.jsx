import React from "react"
import { Link } from "react-router-dom"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f8fafc", padding: "24px", textAlign: "center", fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ maxWidth: "440px", width: "100%", background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "12px", letterSpacing: "-0.5px" }}>Something went wrong</h1>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              An unexpected error occurred. We've been notified and are looking into it.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px", borderRadius: "12px", border: "none", background: "#2563EB", color: "#fff",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                Refresh Page
              </button>
              <button 
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.href = "/dashboard"
                }}
                style={{
                  padding: "10px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", color: "#64748b",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all 0.2s"
                }}
              >
                Back to Safety
              </button>
            </div>
            {process.env.NODE_ENV === "development" && (
              <details style={{ marginTop: "24px", textAlign: "left", background: "#f1f5f9", padding: "12px", borderRadius: "8px", fontSize: "11px", color: "#ef4444", overflow: "auto" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, marginBottom: "4px" }}>Error Details (Dev Only)</summary>
                <pre>{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
