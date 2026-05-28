import { useState, useEffect } from "react"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

const StatCard = ({ label, value, icon, color, loading, dm }) => (
  <div style={{
    background: dm ? "#111827" : "white",
    border: `1px solid ${dm ? "#1f2937" : "#f1f5f9"}`,
    borderRadius: 16,
    padding: "20px 24px", transition: "all 0.2s",
  }} className="gradient-border">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        {icon}
      </div>
    </div>
    {loading
      ? <><div className="skeleton" style={{ height: 32, width: "50%", marginBottom: 8 }}/><div className="skeleton" style={{ height: 12, width: "70%" }}/></>
      : <>
          <p style={{ fontSize: 28, fontWeight: 700, color: dm ? "#f9fafb" : "#0f172a", fontFamily: "Poppins, sans-serif", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>{label}</p>
        </>
    }
  </div>
)

const Analytics = () => {
  const darkMode = useAuthStore(s => s.darkMode)
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const dm = darkMode
  const C = {
    card: dm ? "#111827" : "white",
    border: dm ? "#1f2937" : "#f1f5f9",
    text: dm ? "#f9fafb" : "#0f172a",
    sub: dm ? "#94a3b8" : "#64748b",
    body: dm ? "#d1d5db" : "#374151",
    muted: dm ? "#1f2937" : "#f8fafc",
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resumesRes, jdsRes] = await Promise.allSettled([
          api.get("/api/resume/my-resumes"),
          api.get("/api/jd/my-jds"),
        ])

        const resumes = resumesRes.status === "fulfilled" ? resumesRes.value.data.data : []
        const jds     = jdsRes.status === "fulfilled"     ? jdsRes.value.data.data     : []

        setStats({
          totalResumes:  resumes?.length ?? 0,
          totalJDs:      jds?.length     ?? 0,
          avgExperience: resumes?.length
            ? (resumes.reduce((s, r) => s + (r.total_experience ?? 0), 0) / resumes.length).toFixed(1)
            : 0,
        })
      } catch (_) {
        setStats({ totalResumes: 0, totalJDs: 0, avgExperience: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <style>{`
        .chart-bar {
          background: linear-gradient(135deg, #2563EB, #6366f1);
          border-radius: 6px 6px 0 0;
          transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }
        .chart-bar:hover { opacity: 0.85; }
        .chart-bar:hover::after {
          content: attr(data-value);
          position: absolute;
          top: -28px; left: 50%;
          transform: translateX(-50%);
          background: ${dm ? "#1f2937" : "#0f172a"}; color: white;
          padding: 4px 8px; border-radius: 6px;
          font-size: 12px; white-space: nowrap;
          border: 1px solid ${dm ? "#374151" : "transparent"};
        }
        .progress-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #2563EB, #6366f1);
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <TopBar title="Analytics" subtitle="Track your resume processing and matching statistics" />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Resumes"
          value={stats?.totalResumes ?? "—"}
          loading={loading}
          color="#2563EB" dm={dm}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 2v6h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="JDs Analyzed"
          value={stats?.totalJDs ?? "—"}
          loading={loading}
          color="#10b981" dm={dm}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Avg Experience"
          value={loading ? "—" : `${stats?.avgExperience} yrs`}
          loading={loading}
          color="#f59e0b" dm={dm}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Skills Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top Skills */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>
            Common Skills Distribution
          </p>
          {[
            { label: "JavaScript/TypeScript", percent: 85 },
            { label: "React / Node.js", percent: 72 },
            { label: "Python", percent: 60 },
            { label: "SQL / Databases", percent: 55 },
            { label: "Docker / AWS", percent: 40 },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: C.body }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2563EB" }}>{item.percent}%</span>
              </div>
              <div style={{ height: 8, background: dm ? "#1f2937" : "#f1f5f9", borderRadius: 4 }}>
                <div className="progress-bar-fill" style={{ width: `${item.percent}%` }}/>
              </div>
            </div>
          ))}
        </div>

        {/* ATS Score Distribution */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>
            ATS Score Ranges
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, paddingBottom: 0 }}>
            {[
              { label: "0-40", height: 20, count: 2 },
              { label: "40-60", height: 45, count: 8 },
              { label: "60-75", height: 85, count: 24 },
              { label: "75-90", height: 100, count: 31 },
              { label: "90+", height: 70, count: 18 },
            ].map((bar) => (
              <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div className="chart-bar" data-value={`${bar.count} resumes`} style={{ width: "100%", height: bar.height }}/>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{bar.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>ATS Score Range</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 24px", textAlign: "center", marginTop: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: dm ? "rgba(37,99,235,.1)" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M18 20V10M12 20V4M6 20v-6" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>
          Detailed Analytics Coming Soon
        </p>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          Match history, trend analysis, and more insights will be available soon.
        </p>
      </div>
    </div>
  )

}

export default Analytics