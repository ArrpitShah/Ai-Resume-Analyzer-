import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"
import { Skeleton } from "../../components/ui/Skeleton"

export default function AdminDashboard() {
  const darkMode = useAuthStore(s => s.darkMode)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const dm = darkMode
  const C = {
    card:   dm ? "#111827" : "#ffffff",
    border: dm ? "#1f2937" : "#f1f5f9",
    text:   dm ? "#f9fafb" : "#0f172a",
    body:   dm ? "#d1d5db" : "#374151",
    muted:  "#94a3b8",
  }

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get("/admin/metrics")
        setMetrics(res.data)
      } catch (e) {
        toast.error("Failed to load admin metrics")
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const MetricCard = ({ label, value, sub, color }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "Lilita One, sans-serif" }}>{value}</p>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</p>
    </div>
  )

  return (
    <div className="container-px">
      <TopBar title="Admin Console" subtitle="System-wide performance and health metrics" />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height="120px" borderRadius="16px" />)}
        </div>
      ) : metrics && (
        <div className="animate-fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
            <MetricCard label="Avg Response Time" value={`${metrics.avgResponseTime}ms`} sub="Last 24 hours" color="#2563EB" />
            <MetricCard label="Total Requests" value={metrics.totalRequests} sub="Successful operations" color="#10b981" />
            <MetricCard label="Error Rate" value={`${metrics.errorRate}%`} sub="Failure frequency" color="#ef4444" />
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>Slowest Operations</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metrics.slowestEntries?.map((entry, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: dm ? "#1f2937" : "#f8fafc" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Operation #{metrics.slowestEntries.length - i}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{entry.total_ms}ms</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
