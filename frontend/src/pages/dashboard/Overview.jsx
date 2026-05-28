import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"
import { Skeleton } from "../../components/ui/Skeleton"
import EmptyState from "../../components/ui/EmptyState"

const generateDisplayName = (name, id) => {
  if (!name) return `Candidate_${id?.slice(-4) ?? "????"}`
  const num = id ? parseInt(id.replace(/-/g,"").slice(-4), 16) % 9000 + 1000 : Math.floor(Math.random()*9000)+1000
  return `${name.replace(/\s+/g,"_")}_${num}`
}

const extractSkills = (resumeList) => {
  const count = {}
  const total = resumeList.length
  if (!total) return []

  resumeList.forEach(r => {
    const sj = r.structured_json ?? {}
    const skills = [
      ...(sj?.skills?.technical      ?? []),
      ...(sj?.skills?.tools          ?? []),
      ...(sj?.skills?.languages      ?? []),
      ...(sj?.basic_info?.skills     ?? []),
      ...(Array.isArray(sj?.skills)  ? sj.skills : []),
    ].filter(s => typeof s === "string")

    skills.forEach(s => {
      const k = s.trim().toLowerCase()
      if (k.length > 1 && k.length < 40) {
        count[k] = (count[k] ?? 0) + 1
      }
    })
  })

  return Object.entries(count)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 7)
    .map(([skill, n]) => ({
      label: skill.charAt(0).toUpperCase() + skill.slice(1),
      pct:   Math.round((n / total) * 100),
      count: n,
    }))
}

const buildBuckets = (analysisList) => {
  const buckets = [
    { l:"90+",   min:90, max:101, color:"#10b981" },
    { l:"75–90", min:75, max:90,  color:"#2563EB" },
    { l:"60–75", min:60, max:75,  color:"#60a5fa" },
    { l:"40–60", min:40, max:60,  color:"#fbbf24" },
    { l:"0–40",  min:0,  max:40,  color:"#f87171" },
  ].map(b => ({ ...b, count:0 }))

  analysisList.forEach(a => {
    const s = a.ats_score ?? 0
    const b = buckets.find(b => s >= b.min && s < b.max)
    if (b) b.count++
  })

  const max = Math.max(...buckets.map(b => b.count), 1)
  return buckets.map(b => ({ ...b, pct: Math.round((b.count / max) * 100) }))
}

const getScoreColor = (score) => {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#2563EB"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

const getRatingStyles = (r = "") => {
  r = r.toLowerCase()
  if (r.includes("excellent")) return { bg:"#f0fdf4", border:"#bbf7d0", text:"#059669" }
  if (r.includes("good"))      return { bg:"#eff6ff", border:"#bfdbfe", text:"#2563EB" }
  if (r.includes("average"))   return { bg:"#fffbeb", border:"#fde68a", text:"#d97706" }
  return { bg:"#fef2f2", border:"#fecaca", text:"#dc2626" }
}

const MiniRing = ({ score, size=28, dm }) => {
  const color = getScoreColor(score)
  const r = (size-6)/2
  const circ = 2*Math.PI*r
  const fill = ((score??0)/100)*circ
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={dm?"#1f2937":"#f1f5f9"} strokeWidth="3" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 1s ease-out" }}/>
      </svg>
      <span style={{ fontSize:8, fontWeight:800, color: dm?"#f1f5f9":"#0f172a" }}>{score??0}</span>
    </div>
  )
}

const getCandidateAvatar = (name = "") => {
  const n = name.toLowerCase().trim()
  if (!n) return "👤"
  const isFemale = n.endsWith("a") || n.endsWith("i") || n.endsWith("ee") || 
                   n.startsWith("ms.") || n.startsWith("mrs.") || n.startsWith("miss") ||
                   ["ananya", "nidhi", "priya", "sneha", "pooja", "aditi", "riya"].some(x => n.includes(x))
  const girls = ["👩‍💼", "👩‍💻", "👩‍🎓", "👩‍🔬", "👩‍🎨"]
  const boys  = ["👨‍💼", "👨‍💻", "👨‍🎓", "👨‍🔬", "👨‍🎨"]
  let hash = 0
  for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash)
  const list = isFemale ? girls : boys
  return list[Math.abs(hash) % list.length]
}

const StatCard = ({ label, value, icon, color, loading, dm }) => (
  <div style={{
    background: dm?"#111827":"#fff",
    border:`1px solid ${dm?"#1f2937":"#f1f5f9"}`,
    borderRadius:16, padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0
  }}>
    <div style={{ 
      width: 40, height: 40, borderRadius: 12, 
      background: `${color}18`, display: "flex", 
      alignItems: "center", justifyContent: "center", 
      color, marginBottom: 12 
    }}>
      {icon}
    </div>
    {loading
      ? <><Skeleton width="50%" height="32px" style={{ marginBottom:8 }}/><Skeleton width="70%" height="12px" /></>
      : <>
          <p style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "Lilita One, Satoshi, sans-serif", lineHeight: 1, letterSpacing: "-0.5px", color: dm ? "#f9fafb" : "#0f172a" }}>
            {value}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
        </>
    }
  </div>
)

export default function Overview() {
  const navigate        = useNavigate()
  const user            = useAuthStore((s) => s.user)
  const darkMode        = useAuthStore((s) => s.darkMode)
  const setLastAnalysis = useAuthStore((s) => s.setLastAnalysis)

  const [stats,      setStats]      = useState(null)
  const [resumes,    setResumes]    = useState([])
  const [allResumes, setAllResumes] = useState([])
  const [analyses,   setAnalyses]   = useState([])
  const [profile,    setProfile]    = useState(null)
  const [skills,     setSkills]     = useState([])
  const [buckets,    setBuckets]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)

  const dm = darkMode
  const C = {
    card:   dm?"#111827":"#ffffff",
    border: dm?"#1f2937":"#f1f5f9",
    text:   dm?"#f9fafb":"#0f172a",
    body:   dm?"#d1d5db":"#374151",
    muted:  "#94a3b8",
    barBg:  dm?"#1f2937":"#f1f5f9",
    hover:  dm?"#1f2937":"#f8fafc",
    rowBdr: dm?"#1f2937":"#f1f5f9",
  }

  useEffect(() => {
    const fetch = async () => {
      const uid = user?.id
      if (!uid) { setLoading(false); return }
      try {
        const token = localStorage.getItem("access_token")
        const H = { Authorization:`Bearer ${token}` }
        const [rRes, jRes, aRes, pRes] = await Promise.allSettled([
          api.get(`/api/resume/user/${uid}`, { headers:H }),
          api.get(`/api/jd/user/${uid}`,     { headers:H }),
          api.get(`/api/match/user/${uid}`,  { headers:H }),
          api.get(`/api/payment/profile`,    { headers:H }),
        ])
        const r = rRes.status==="fulfilled" ? rRes.value.data.data??[] : []
        const j = jRes.status==="fulfilled" ? jRes.value.data.data??[] : []
        const a = aRes.status==="fulfilled" ? aRes.value.data.data??[] : []
        const p = pRes.status==="fulfilled" ? pRes.value.data.data : null

        setAllResumes(r)
        setResumes(r.slice(0,6))
        setAnalyses(a)
        setProfile(p)
        setStats({ resumes:r.length, jds:j.length })

        const sk = extractSkills(r)
        setSkills(sk)
        setBuckets(buildBuckets(a))
      } catch (err) {
        console.error("[Overview] Fetch error:", err)
        setStats({ resumes: 0, jds: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user?.id])

  const handleResumeClick = (r) => {
    setSelected(r)
    setLastAnalysis(r)
    const sk = extractSkills([r])
    setSkills(sk.length ? sk : extractSkills(allResumes))
    const resumeAnalyses = analyses.filter(a => a.resume_id === r.id)
    setBuckets(buildBuckets(resumeAnalyses.length ? resumeAnalyses : analyses))
  }

  const resetSelection = () => {
    setSelected(null)
    setSkills(extractSkills(allResumes))
    setBuckets(buildBuckets(analyses))
  }

  const hasSkills = skills.length > 0
  const hasATS    = buckets.some(b => b.count > 0)

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`
        .ov-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; transition:box-shadow .2s; padding: 24px; min-width: 0; }
        @media (max-width: 640px) { 
          .ov-card { padding: 18px !important; } 
          .a-row { align-items: center !important; gap: 12px !important; padding: 12px !important; }
        }
        
        .a-row { display:flex; align-items:center; gap:14px; padding:14px; border-radius:12px; cursor:pointer; transition:all .15s; border-bottom:1px solid ${C.rowBdr}; }
        .a-row:last-child { border-bottom:none; }
        .a-row:hover { background:${C.hover}; }
        .a-row.sel { background:${dm?"rgba(37,99,235,.15)":"#eff6ff"}; border-left:3px solid #2563EB; padding-left:11px; }
        
        .hbar-track { height:24px; border-radius:6px; background:${C.barBg}; overflow:hidden; position:relative; flex:1; }
        .hbar-fill { height:100%; border-radius:6px; display:flex; align-items:center; padding:0 10px; font-size:11px; font-weight:700; color:#fff; transition:width 1s cubic-bezier(.4,0,.2,1); }
        
        .prog-bar-bg { height:6px; border-radius:3px; background:${C.barBg}; }
        .prog-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#2563EB,#6366f1); animation:progFill 1s ease-out forwards; }
        @keyframes progFill { from { width:0 } }
        
        .reset-btn { font-size:12px; color:#2563EB; background:none; border:none; cursor:pointer; font-weight:600; text-decoration:underline; padding:0; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr; }
          .charts-grid { grid-template-columns: 1fr; }
        }

        .sec-title { font-size:15px; font-weight:700; color:${C.text}; letter-spacing: -0.2px; }
        .sub-text { font-size:12px; color:${C.muted}; margin-top:1px; }
        .row-name { font-size:14px; font-weight:700; color:${C.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .row-sub { font-size:12px; color:${C.muted}; }
      `}</style>

      <TopBar title="Overview" subtitle="Your resume analysis dashboard" />

      {/* Stats */}
      <div className="stagger stats-grid">
        <StatCard label="Total Resumes" value={stats?.resumes??"—"} loading={loading} color="#2563EB" dm={dm}
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>}
        />
        <StatCard label="Analyses Performed" value={stats?.jds??"—"} loading={loading} color="#10b981" dm={dm}
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"/></svg>}
        />
        
        <div style={{ background: dm?"#111827":"#fff", border:`1px solid ${dm?"#1f2937":"#f1f5f9"}`, borderRadius:16, padding: "20px", display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(147,51,234,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#9333ea" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            {profile?.subscription_status === "pro" && <span style={{ fontSize:10, fontWeight:800, background:"#9333ea", color:"#fff", padding:"2px 8px", borderRadius:6 }}>PRO</span>}
          </div>
          {loading ? <Skeleton width="60%" height="32px" /> : (
            <>
              <p style={{ fontSize:"1.75rem", fontWeight:700, color:dm?"#f9fafb":"#0f172a", fontFamily:"Lilita One" }}>
                {profile?.subscription_status === "pro" ? "Unlimited ∞" : `${profile?.usage_count ?? 0} / 5`}
              </p>
              <p style={{ fontSize:"0.85rem", color:"#94a3b8", marginTop:4 }}>Usage this month</p>
              {profile?.subscription_status !== "pro" && (
                <div style={{ height:4, background:dm?"#1f2937":"#f1f5f9", borderRadius:2, marginTop:12, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"#9333ea", width:`${Math.min(((profile?.usage_count??0)/5)*100, 100)}%`, transition:"width 1s" }}/>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="ov-card">
          <p className="sec-title">Skill Distribution</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            {selected
              ? <p className="sub-text">{selected.candidate_name ?? "Selected"} &nbsp;<button className="reset-btn" onClick={resetSelection}>Reset</button></p>
              : <p className="sub-text">Top skills across all resumes</p>
            }
          </div>
          {loading ? [1,2,3,4].map(i=>(<div key={i} style={{ marginBottom:14 }}><Skeleton width="40%" height="12px" style={{ marginBottom:6 }}/><Skeleton height="6px" /></div>)) 
            : !hasSkills ? <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"20px 0" }}>No data</p>
            : skills.map(s => (
              <div key={s.label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:C.body }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#2563EB" }}>{s.pct}%</span>
                </div>
                <div className="prog-bar-bg"><div className="prog-bar-fill" style={{ width:`${s.pct}%` }}/></div>
              </div>
            ))
          }
        </div>

        <div className="ov-card">
          <p className="sec-title">ATS Score Range</p>
          <p className="sub-text" style={{ marginBottom: 20 }}>Breakdown of matching scores</p>
          {loading ? [1,2,3,4,5].map(i=>(<div key={i} style={{ marginBottom:12 }}><Skeleton height="24px" borderRadius="6px" /></div>))
            : !hasATS ? <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"20px 0" }}>No data</p>
            : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {buckets.map(b => (
                  <div key={b.l} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:C.muted, width:38, textAlign:"right" }}>{b.l}</span>
                    <div className="hbar-track">
                      <div className="hbar-fill" style={{ width: b.count>0?`${b.pct}%`:"0%", background: b.color, minWidth: b.count>0?30:0, justifyContent:"center" }}>{b.count>0 && b.count}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ov-card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <p className="sec-title">Recent Activity</p>
            <p className="sub-text">Your latest resume uploads</p>
          </div>
          <button onClick={()=>navigate("/dashboard/analyses")} style={{ fontSize:13, color:"#2563EB", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>View All →</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loading ? [1,2,3].map(i=>(<div key={i} style={{ display:"flex", gap:12, padding:"12px 14px" }}><Skeleton width="42px" height="42px" /><div style={{ flex:1 }}><Skeleton width="30%" height="14px" style={{ marginBottom:6 }}/><Skeleton width="50%" height="11px" /></div></div>))
            : resumes.length===0 ? (
              <div style={{ padding: "10px" }}>
                <EmptyState 
                  icon="📄" 
                  title="No resumes yet" 
                  description="Upload your first resume to see insights and start matching with jobs."
                  actionLabel="Upload Resume"
                  onAction={() => navigate("/dashboard/upload")}
                />
              </div>
            )
            : resumes.map((r) => {
                const latestA = analyses
                  .filter(a => a.resume_id === r.id)
                  .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0]
                const ats = latestA?.ats_score
                const rating = latestA?.overall_rating
                const rs = rating ? getRatingStyles(rating) : null

                return (
                  <div key={r.id} className={`a-row${selected?.id===r.id?" sel":""}`}
                    onClick={()=>selected?.id===r.id ? resetSelection() : handleResumeClick(r)}>
                    <div style={{ width:42, height:42, borderRadius:12, background:dm?"#1f2937":"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>
                      {getCandidateAvatar(r.candidate_name)}
                    </div>
                    <div style={{ flex:1, minWidth: 0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:2 }}>
                        <p className="row-name">{generateDisplayName(r.candidate_name, r.id)}</p>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          {ats !== undefined && <MiniRing score={ats} dm={dm} />}
                          {rs && (
                            <span style={{ fontSize:"8px", fontWeight:"800", padding:"1px 6px", borderRadius:"100px", background:rs.bg, color:rs.text, border:`1px solid ${rs.border}`, textTransform:"uppercase" }}>
                              {rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="row-sub">{r.email} • {r.total_experience??0}y exp</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                       <p style={{ fontSize:11, fontWeight:600, color:C.muted }}>{new Date(r.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
                       <span style={{ fontSize:10, fontWeight:700, color:"#2563EB", textTransform:"uppercase" }}>{selected?.id===r.id?"Selected":"View"}</span>
                    </div>
                  </div>
                )
            })
          }
        </div>
      </div>
    </div>
  )
}
