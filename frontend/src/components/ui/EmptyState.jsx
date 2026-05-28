import useAuthStore from "../../stores/authStore"

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const darkMode = useAuthStore(s => s.darkMode)
  const dm = darkMode
  
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 24px", textAlign: "center",
      background: dm ? "#111827" : "#ffffff",
      borderRadius: "24px", border: `2px dashed ${dm ? "#1f2937" : "#f1f5f9"}`
    }}>
      <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.8 }}>{icon}</div>
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: dm ? "#f9fafb" : "#0f172a", marginBottom: "8px" }}>{title}</h3>
      <p style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "320px", marginBottom: "24px", lineHeight: 1.5 }}>{description}</p>
      
      {actionLabel && (
        <button 
          onClick={onAction}
          style={{
            padding: "10px 24px", borderRadius: "12px", border: "none", background: "#2563EB", color: "#fff",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(37,99,235,0.2)"
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
