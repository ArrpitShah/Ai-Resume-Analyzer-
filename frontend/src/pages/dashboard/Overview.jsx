import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"



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



const StatCard = ({ label, value, icon, color, loading, dm }) => (
  <div style={{
    background: dm?"#111827":"#fff",
    border:`1px solid ${dm?"#1f2937":"#f1f5f9"}`,
    borderRadius:16, padding:"22px 24px",
  }}>
    <div style={{ width:42, height:42, borderRadius:12, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", color, marginBottom:16 }}>
      {icon}
    </div>
    {loading
      ? <><div className="skeleton" style={{ height:32, width:"50%", marginBottom:8 }}/><div className="skeleton" style={{ height:12, width:"70%" }}/></>
      : <>
          <p style={{ fontSize:30, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", lineHeight:1, letterSpacing:"-0.5px", color:dm?"#f9fafb":"#0f172a" }}>
            {value}
          </p>
          <p style={{ fontSize:13, color:"#94a3b8", marginTop:6 }}>{label}</p>
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
        const [rRes, jRes, aRes] = await Promise.allSettled([
          api.get(`/api/resume/user/${uid}`, { headers:H }),
          api.get(`/api/jd/user/${uid}`,     { headers:H }),
          api.get(`/api/match/user/${uid}`,  { headers:H }),
        ])
        const r = rRes.status==="fulfilled" ? rRes.value.data.data??[] : []
        const j = jRes.status==="fulfilled" ? jRes.value.data.data??[] : []
        const a = aRes.status==="fulfilled" ? aRes.value.data.data??[] : []

        setAllResumes(r)
        setResumes(r.slice(0,6))
        setAnalyses(a)
        setStats({ resumes:r.length, jds:j.length })

        const sk = extractSkills(r)
        setSkills(sk)
        setBuckets(buildBuckets(a))

        
        console.log("[Overview] Skill count:", sk.length, sk)
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

  const hasSkills = skills.some(s => s.pct > 0)
  const hasATS    = analyses.length > 0

  return (
    <div>
      <style>{`
        .ov-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; transition:box-shadow .2s; }
        .a-row { display:flex; align-items:center; gap:14px; padding:12px 14px; border-radius:12px; cursor:pointer; transition:background .15s; border-bottom:1px solid ${C.rowBdr}; }
        .a-row:last-child { border-bottom:none; }
        .a-row:hover { background:${C.hover}; }
        .a-row.sel { background:${dm?"rgba(37,99,235,.15)":"#eff6ff"}; border-left:3px solid #2563EB; padding-left:11px; }
        .hbar-track { height:28px; border-radius:8px; background:${C.barBg}; overflow:hidden; position:relative; cursor:pointer; transition:transform .15s; flex:1; }
        .hbar-track:hover { transform:scaleY(1.04); }
        .hbar-fill { height:100%; border-radius:8px; display:flex; align-items:center; padding:0 10px; font-size:12px; font-weight:600; color:#fff; transition:width 1s cubic-bezier(.4,0,.2,1); white-space:nowrap; overflow:hidden; min-width:0; }
        .prog-bar-bg { height:7px; border-radius:4px; background:${C.barBg}; }
        .prog-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#2563EB,#6366f1); animation:progFill 1.2s cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes progFill { from { width:0 } }
        .chip { display:inline-flex; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; background:rgba(37,99,235,.1); color:#2563EB; border:1px solid rgba(37,99,235,.2); }
        .reset-btn { font-size:12px; color:#2563EB; background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; text-decoration:underline; padding:0; }
        .skill-label { font-size:13px; color:${C.body}; }
        .skill-pct { font-size:13px; font-weight:600; color:#2563EB; }
        .sec-title { font-size:14px; font-weight:600; font-family:'Satoshi,Inter,sans-serif'; color:${C.text}; }
        .sub-text { font-size:12px; color:${C.muted}; margin-top:2px; }
        .row-name { font-size:14px; font-weight:600; color:${C.text}; margin-bottom:2px; }
        .row-sub { font-size:12px; color:${C.muted}; }
      `}</style>

      <TopBar title="Overview" subtitle="Your resume analysis dashboard" />

      {/* Stats */}
      <div className="stagger" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16, marginBottom:28 }}>
        <StatCard label="Total Resumes Analyzed" value={stats?.resumes??"—"} loading={loading} color="#2563EB" dm={dm}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 2v6h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <StatCard label="Total JD Analyses" value={stats?.jds??"—"} loading={loading} color="#10b981" dm={dm}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:28 }}>

        {/* Skill Distribution */}
        <div className="ov-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <p className="sec-title">Skill Distribution</p>
              {selected
                ? <p className="sub-text">{selected.candidate_name ?? "Selected"} &nbsp;<button className="reset-btn" onClick={resetSelection}>Reset</button></p>
                : <p className="sub-text">All {allResumes.length} resumes</p>
              }
            </div>
            {!hasSkills && !loading && (
              <span style={{ fontSize:11, color:C.muted, fontStyle:"italic", flexShrink:0 }}>Upload resumes to see data</span>
            )}
          </div>

          {loading ? (
            [1,2,3,4].map(i=>(
              <div key={i} style={{ marginBottom:14 }}>
                <div className="skeleton" style={{ height:11, width:"50%", marginBottom:6 }}/>
                <div className="skeleton" style={{ height:7, width:"100%" }}/>
              </div>
            ))
          ) : !hasSkills ? (
            <div style={{ padding:"28px 0", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
              <p style={{ fontSize:13, color:C.muted }}>No skill data found.</p>
              <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>Upload resumes to see distribution.</p>
            </div>
          ) : (
            skills.map((item) => (
              <div key={item.label} style={{ marginBottom:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span className="skill-label">{item.label}</span>
                  <span className="skill-pct">{item.pct}%</span>
                </div>
                <div className="prog-bar-bg">
                  <div className="prog-bar-fill" style={{ width:`${item.pct}%` }}/>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ATS Score Range */}
        <div className="ov-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <p className="sec-title">ATS Score Range</p>
              {selected
                ? <p className="sub-text">{selected.candidate_name ?? "Selected"}</p>
                : <p className="sub-text">All analyses</p>
              }
            </div>
            {hasATS && <span className="chip">{analyses.length} analyses</span>}
          </div>

          {loading ? (
            [1,2,3,4,5].map(i=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div className="skeleton" style={{ height:28, width:"100%", borderRadius:8 }}/>
              </div>
            ))
          ) : !hasATS ? (
            <div style={{ padding:"28px 0", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📉</div>
              <p style={{ fontSize:13, color:C.muted }}>No analyses yet.</p>
              <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>Run JD Match to see ATS distribution.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {buckets.map((b) => (
                <div key={b.l} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12, color:C.muted, width:44, textAlign:"right", flexShrink:0 }}>{b.l}</span>
                  <div className="hbar-track">
                    <div className="hbar-fill" style={{
                      width: b.count>0 ? `${b.pct}%` : "0%",
                      background: b.color,
                      minWidth: b.count>0 ? 36 : 0,
                    }}>
                      {b.count > 0 && `${b.count}`}
                    </div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:b.count>0?b.color:C.muted, width:20, flexShrink:0 }}>
                    {b.count>0 ? b.count : "–"}
                  </span>
                </div>
              ))}
              <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                Click a resume below to filter
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="ov-card" style={{ padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <p className="sec-title">Recent Analyses</p>
            <p className="sub-text">Click to filter charts above</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {selected && <button className="reset-btn" onClick={resetSelection}>Show all</button>}
            <button onClick={()=>navigate("/dashboard/analyses")}
              style={{ fontSize:13, color:"#2563EB", fontWeight:500, background:"none", border:"none", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              View all →
            </button>
          </div>
        </div>

        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.rowBdr}` }}>
              <div className="skeleton" style={{ width:40, height:40, borderRadius:10, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div className="skeleton" style={{ height:13, width:"40%", marginBottom:8 }}/>
                <div className="skeleton" style={{ height:11, width:"60%" }}/>
              </div>
            </div>
          ))
        ) : resumes.length===0 ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <p style={{ fontSize:14, color:C.muted }}>No analyses yet.</p>
            <button onClick={()=>navigate("/dashboard/upload")}
              style={{ marginTop:14, padding:"9px 20px", borderRadius:10, border:"none", background:"#2563EB", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              Upload Resume →
            </button>
          </div>
        ) : resumes.map((r) => (
          <div key={r.id} className={`a-row${selected?.id===r.id?" sel":""}`}
            onClick={()=>selected?.id===r.id ? resetSelection() : handleResumeClick(r)}>
            <div style={{ width:40, height:40, borderRadius:10, background:selected?.id===r.id?"linear-gradient(135deg,#bfdbfe,#93c5fd)":"linear-gradient(135deg,#eff6ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>
              📄
            </div>
            <div style={{ flex:1 }}>
              <p className="row-name">{generateDisplayName(r.candidate_name, r.id)}</p>
              <p className="row-sub">{r.email} • {r.total_experience??0} yrs exp</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:11, color:C.muted }}>
                {new Date(r.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </p>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, padding:"2px 10px", borderRadius:100, background:selected?.id===r.id?"rgba(37,99,235,.2)":"rgba(37,99,235,.08)", border:"1px solid rgba(37,99,235,.2)" }}>
                <span style={{ fontSize:11, color:"#2563EB", fontWeight:500 }}>
                  {selected?.id===r.id?"Selected ✓":"Click to filter"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}