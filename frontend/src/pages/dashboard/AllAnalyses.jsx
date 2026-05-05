import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import axios from "axios"

const getRatingColor = (r = "") => {
  r = r.toLowerCase()
  if (r.includes("excellent")) return { bg:"#f0fdf4", border:"#bbf7d0", text:"#059669" }
  if (r.includes("good"))      return { bg:"#eff6ff", border:"#bfdbfe", text:"#2563EB" }
  if (r.includes("average"))   return { bg:"#fffbeb", border:"#fde68a", text:"#d97706" }
  return { bg:"#fef2f2", border:"#fecaca", text:"#dc2626" }
}

const getScoreColor = (score) => {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#2563EB"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

export default function AllAnalyses() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const darkMode  = useAuthStore((s) => s.darkMode)
  const [analyses, setAnalyses] = useState([])
  const [resumes,  setResumes]  = useState({})
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState("grid")
  const [search,   setSearch]   = useState("")

  const dm = darkMode
  const C = {
    card:   dm ? "#111827" : "#fff",
    border: dm ? "#1f2937" : "#f1f5f9",
    text:   dm ? "#f9fafb" : "#0f172a",
    body:   dm ? "#d1d5db" : "#374151",
    muted:  "#94a3b8",
    hover:  dm ? "#1f2937" : "#f8fafc",
    rowBdr: dm ? "#1f2937" : "#f8fafc",
    subcard:dm ? "#1f2937" : "#f8fafc",
    search: dm ? "#111827" : "#fff",
    searchBorder: dm ? "#1f2937" : "#e2e8f0",
    searchText: dm ? "#f1f5f9" : "#0f172a",
    vbtn:   dm ? "#111827" : "#fff",
    vbtnBorder: dm ? "#1f2937" : "#e2e8f0",
  }

  const fetchData = async () => {
    const userId = user?.id
    if (!userId) { setLoading(false); return }
    try {
      const token = localStorage.getItem("access_token")
      const H = { Authorization: `Bearer ${token}` }
      const [aRes, rRes] = await Promise.allSettled([
        axios.get(`http://localhost:5000/api/match/user/${userId}`,  { headers:H }),
        axios.get(`http://localhost:5000/api/resume/user/${userId}`, { headers:H }),
      ])
      const aData = aRes.status==="fulfilled" ? aRes.value.data.data??[] : []
      const rData = rRes.status==="fulfilled" ? rRes.value.data.data??[] : []
      const rMap = {}
      rData.forEach(r => { rMap[r.id] = r.candidate_name ?? "" })
      setResumes(rMap)
      setAnalyses(aData)
    } catch (err) { console.error(err); setAnalyses([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 10000)
    return () => clearInterval(iv)
  }, [user?.id])

  const filtered = analyses
    .filter(a => {
      const name = resumes[a.resume_id] ?? ""
      return name.toLowerCase().includes(search.toLowerCase()) ||
             (a.overall_rating ?? "").toLowerCase().includes(search.toLowerCase())
    })
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))

  const getCandidateName = (a) => {
    const name = resumes[a.resume_id] ?? ""
    if (!name) return `Candidate_${a.resume_id?.slice(-4) ?? "????"}`
    const num = parseInt(a.resume_id?.replace(/-/g,"").slice(-4) ?? "0", 16) % 9000 + 1000
    return `${name.replace(/\s+/g,"_")}_${num}`
  }

  return (
    <div style={{ color: C.text }}>
      <style>{`
        .aa-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 16px; padding: 20px; cursor: pointer;
          transition: all .2s;
        }
        .aa-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 6px 24px rgba(37,99,235,.1);
          transform: translateY(-2px);
        }
        .aa-row {
          display:flex; align-items:center; gap:14px;
          padding:14px 18px; border-radius:12px; cursor:pointer;
          transition:background .15s;
          border-bottom: 1px solid ${C.rowBdr};
        }
        .aa-row:last-child { border-bottom:none; }
        .aa-row:hover { background:${C.hover}; }
        .aa-subcard {
          background: ${C.subcard};
          border-radius: 9px; padding: 9px 12px;
        }
        .score-bar { height:4px; border-radius:4px; background:${C.subcard}; overflow:hidden; margin-top:8px; }
        .score-fill { height:100%; border-radius:4px; transition:width 1s ease; }
        .search-box {
          width:100%; padding:10px 16px 10px 40px;
          border-radius:12px; border:1px solid ${C.searchBorder};
          background:${C.search}; font-size:14px;
          font-family:'Inter',sans-serif; outline:none;
          color:${C.searchText}; transition:all .2s;
        }
        .search-box::placeholder { color:#94a3b8; }
        .search-box:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
        .v-btn {
          width:34px; height:34px; border-radius:9px;
          border:1px solid ${C.vbtnBorder}; background:${C.vbtn};
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:#64748b; transition:all .15s;
        }
        .v-btn.on { background:#eff6ff; border-color:#bfdbfe; color:#2563EB; }
        .ref-btn {
          padding:8px 14px; border-radius:10px;
          border:1px solid ${C.vbtnBorder}; background:${C.vbtn};
          color:${C.body}; font-size:13px; font-weight:500;
          cursor:pointer; font-family:'Inter',sans-serif;
          display:flex; align-items:center; gap:6px; transition:all .15s;
        }
        .ref-btn:hover { opacity:.8; }
        .aa-name { font-size:14px; font-weight:600; color:${C.text}; margin-bottom:2px; }
        .aa-score-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; font-weight:600; margin-bottom:2px; }
        .aa-score-val { font-size:18px; font-weight:700; font-family:'Satoshi,sans-serif'; }
        .aa-date { font-size:11px; color:#94a3b8; }
        .aa-link { font-size:12px; color:#2563EB; font-weight:600; }
      `}</style>

      <TopBar title="All Analyses" subtitle="Click any analysis to view full details" />

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ position:"relative", flex:1, maxWidth:360 }}>
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </span>
          <input className="search-box" placeholder="Search by name or rating..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className={`v-btn${view==="grid"?" on":""}`} onClick={()=>setView("grid")}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
          <button className={`v-btn${view==="list"?" on":""}`} onClick={()=>setView("list")}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <button className="ref-btn" onClick={fetchData}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Refresh
        </button>
        <p style={{ fontSize:13, color:"#94a3b8", whiteSpace:"nowrap" }}>{filtered.length} result{filtered.length!==1?"s":""}</p>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <div className="skeleton" style={{ width:44, height:44, borderRadius:12, marginBottom:14 }}/>
              <div className="skeleton" style={{ height:14, width:"60%", marginBottom:8 }}/>
              <div className="skeleton" style={{ height:11, width:"80%", marginBottom:8 }}/>
              <div className="skeleton" style={{ height:4, width:"100%" }}/>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"64px 24px" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:C.subcard, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4 }}>
            {search ? "No matching results" : "No analyses yet"}
          </p>
          <p style={{ fontSize:13, color:"#94a3b8", marginBottom:16 }}>
            {search ? "Try a different search term." : "Upload a resume and run JD Match to get started!"}
          </p>
          {!search && (
            <button onClick={()=>navigate("/dashboard/upload")}
              style={{ padding:"9px 20px", borderRadius:10, border:"none", background:"#2563EB", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              Upload Resume →
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="stagger" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {filtered.map((a) => {
            const rc = getRatingColor(a.overall_rating)
            return (
              <div key={a.id} className="aa-card" onClick={()=>navigate(`/dashboard/analysis/${a.id}`)}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="aa-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {getCandidateName(a)}
                    </p>
                    <span style={{ display:"inline-flex", padding:"2px 10px", borderRadius:100, background:rc.bg, border:`1px solid ${rc.border}`, color:rc.text, fontSize:11, fontWeight:600 }}>
                      {a.overall_rating ?? "—"}
                    </span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                  {[{l:"Match",v:a.match_percentage},{l:"ATS",v:a.ats_score}].map(item=>(
                    <div key={item.l} className="aa-subcard">
                      <p className="aa-score-label">{item.l} Score</p>
                      <p className="aa-score-val" style={{ color:getScoreColor(item.v??0) }}>{item.v??0}%</p>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width:`${item.v??0}%`, background:getScoreColor(item.v??0) }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <p className="aa-date">{new Date(a.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                  <span className="aa-link">View Details →</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
          {filtered.map((a) => {
            const rc = getRatingColor(a.overall_rating)
            return (
              <div key={a.id} className="aa-row" onClick={()=>navigate(`/dashboard/analysis/${a.id}`)}>
                <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p className="aa-name">{getCandidateName(a)}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ display:"inline-flex", padding:"2px 10px", borderRadius:100, background:rc.bg, border:`1px solid ${rc.border}`, color:rc.text, fontSize:11, fontWeight:600 }}>
                      {a.overall_rating ?? "—"}
                    </span>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>Match: <strong style={{ color:getScoreColor(a.match_percentage??0) }}>{a.match_percentage??0}%</strong></span>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>ATS: <strong style={{ color:getScoreColor(a.ats_score??0) }}>{a.ats_score??0}%</strong></span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p className="aa-date" style={{ marginBottom:4 }}>{new Date(a.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
                  <span className="aa-link">View →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}