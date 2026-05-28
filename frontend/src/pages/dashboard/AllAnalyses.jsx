import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import { Skeleton } from "../../components/ui/Skeleton"
import EmptyState from "../../components/ui/EmptyState"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

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

export default function AllAnalyses() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const darkMode  = useAuthStore((s) => s.darkMode)
  const [analyses, setAnalyses] = useState([])
  const [resumes,  setResumes]  = useState({})
  const [loading,  setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [view,     setView]     = useState("grid")
  const [search,   setSearch]   = useState("")
  const [rating,   setRating]   = useState("")
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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

  const fetchData = async (pageNum = 1, isLoadMore = false) => {
    const userId = user?.id
    if (!userId) { setLoading(false); return }
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const H = { Authorization: `Bearer ${token}` }
      
      const res = await api.get(`/api/match/user/${userId}`, {
        headers: H,
        params: { page: pageNum, limit: 9, search, rating }
      })

      const { data, total: totalCount } = res.data
      setTotal(totalCount)

      if (isLoadMore) setAnalyses(prev => [...prev, ...data])
      else setAnalyses(data)

      // Get names mapping (mock or from joined data)
      const rMap = { ...resumes }
      data.forEach(a => { if (a.resumes) rMap[a.resume_id] = a.resumes.candidate_name })
      setResumes(rMap)

    } catch (err) {
      console.error(err)
      if (!isLoadMore) setAnalyses([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchData(1, false)
    setPage(1)
  }, [user?.id, search, rating])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchData(next, true)
  }

  const getCandidateName = (a) => {
    const name = resumes[a.resume_id] ?? ""
    if (!name) return `Candidate_${a.resume_id?.slice(-4) ?? "????"}`
    const num = parseInt(a.resume_id?.replace(/-/g,"").slice(-4) ?? "0", 16) % 9000 + 1000
    return `${name.replace(/\s+/g,"_")}_${num}`
  }

  return (
    <div style={{ color: C.text }}>
      <style>{`
        .aa-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .aa-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .aa-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .aa-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 16px; padding: 20px; cursor: pointer;
          transition: all .2s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        @media (max-width: 640px) {
          .aa-card { padding: 16px; }
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
        @media (max-width: 640px) {
          .aa-row { padding: 12px; gap: 10px; }
        }
        .aa-row:last-child { border-bottom:none; }
        .aa-row:hover { background:${C.hover}; }
        .aa-subcard {
          background: ${C.subcard};
          border-radius: 8px; padding: 8px 10px;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .score-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        @media (max-width: 480px) {
          .score-row {
            display: flex;
            gap: 6px;
            margin-bottom: 12px;
          }
          .aa-subcard { flex: 1; }
        }
        .score-bar { height:3px; border-radius:3px; background:${C.subcard}; overflow:hidden; margin-top:6px; }
        .score-fill { height:100%; border-radius:3px; transition:width 1s ease; }
        .search-box {
          width:100%; padding:12px 16px 12px 44px;
          border-radius:14px; border:1px solid ${C.searchBorder};
          background:${C.search}; font-size:14px;
          font-family:'Inter',sans-serif; outline:none;
          color:${C.searchText}; transition:all .2s;
        }
        .search-box::placeholder { color:#94a3b8; }
        .search-box:focus { border-color:#2563EB; box-shadow:0 0 0 4px rgba(37,99,235,.1); }
        
        .filter-select {
          padding: 8px 12px; border-radius: 10px; border: 1px solid ${C.vbtnBorder};
          background: ${C.vbtn}; color: ${C.body}; font-size: 13px; font-weight: 500;
          outline: none; cursor: pointer; transition: all 0.15s;
        }

        .v-btn {
          width:38px; height:38px; border-radius:10px;
          border:1px solid ${C.vbtnBorder}; background:${C.vbtn};
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:#64748b; transition:all .15s;
        }
        .v-btn.on { background:#eff6ff; border-color:#bfdbfe; color:#2563EB; }
        
        .load-more-btn {
          margin: 32px auto 0; padding: 12px 32px; border-radius: 14px;
          background: #2563EB; color: #fff; font-size: 14px; font-weight: 700;
          border: none; cursor: pointer; transition: all 0.2s; display: block;
          box-shadow: 0 4px 12px rgba(37,99,235,0.2);
        }
        .load-more-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .aa-name { font-size:14px; font-weight:600; color:${C.text}; margin-bottom:2px; }
        @media (max-width: 640px) { .aa-name { font-size: 13px; } }
        .aa-score-label { font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:.03em; font-weight:700; margin-bottom:1px; }
        .aa-score-val { font-size:15px; font-weight:800; font-family:'Satoshi,sans-serif'; }
        @media (max-width: 480px) { .aa-score-val { font-size: 14px; } }
        .aa-date { font-size:11px; color:#94a3b8; }
        .aa-link { font-size:12px; color:#2563EB; font-weight:600; }

        .toolbar { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 32px; 
          margin-bottom: 28px; 
          flex-wrap: wrap; 
        }
        @media (max-width: 640px) {
          .toolbar { gap: 10px; }
          .toolbar > div:first-child { max-width: none !important; width: 100%; flex: none; }
        }
      `}</style>

      <TopBar title="All Analyses" subtitle="Real-time paginated results with deep search" />

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position:"relative", flex:1, maxWidth:360 }}>
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </span>
          <input className="search-box" placeholder="Search candidate name..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <select className="filter-select" value={rating} onChange={e=>setRating(e.target.value)}>
            <option value="">All Ratings</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>

          {!isMobile && (
            <div style={{ display:"flex", gap:6 }}>
              <button className={`v-btn${view==="grid"?" on":""}`} onClick={()=>setView("grid")}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
              <button className={`v-btn${view==="list"?" on":""}`} onClick={()=>setView("list")}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && page === 1 ? (
        <div className="aa-grid">
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <Skeleton width="44px" height="44px" borderRadius="12px" style={{ marginBottom:14 }}/>
              <Skeleton width="60%" height="14px" style={{ marginBottom:8 }}/>
              <Skeleton width="80%" height="11px" style={{ marginBottom:12 }}/>
              <div style={{ display:"flex", gap:8 }}>
                <Skeleton height="32px" style={{ flex:1 }}/>
                <Skeleton height="32px" style={{ flex:1 }}/>
              </div>
            </div>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <EmptyState 
          icon="🔍" 
          title={search || rating ? "No results found" : "No analyses yet"}
          description={search || rating ? "Try adjusting your search or filters to find what you're looking for." : "Upload a resume and match it with a job to see your first analysis here."}
          actionLabel={search || rating ? "Clear Filters" : "Start New Match"}
          onAction={() => {
            if (search || rating) { setSearch(""); setRating("") }
            else navigate("/dashboard/jd-match")
          }}
        />
      ) : (
        <>
          {view === "grid" ? (
            <div className="stagger aa-grid">
              {analyses.map((a) => {
                const rc = getRatingColor(a.overall_rating)
                return (
                  <div key={a.id} className="aa-card" onClick={()=>navigate(`/dashboard/analysis/${a.id}`)}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                        {getCandidateAvatar(resumes[a.resume_id])}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                          <p className="aa-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:0 }}>
                            {getCandidateName(a)}
                          </p>
                          <span style={{ display:"inline-flex", padding:"1px 8px", borderRadius:100, background:rc.bg, border:`1px solid ${rc.border}`, color:rc.text, fontSize:9, fontWeight:700, textTransform:"uppercase", flexShrink:0 }}>
                            {a.overall_rating ?? "—"}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#94a3b8" }}>{new Date(a.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
                      </div>
                    </div>
                    <div className="score-row">
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
              {analyses.map((a) => {
                const rc = getRatingColor(a.overall_rating)
                return (
                  <div key={a.id} className="aa-row" onClick={()=>navigate(`/dashboard/analysis/${a.id}`)}>
                    <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>
                      {getCandidateAvatar(resumes[a.resume_id])}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        <p className="aa-name" style={{ marginBottom:0 }}>{getCandidateName(a)}</p>
                        <span style={{ display:"inline-flex", padding:"1px 7px", borderRadius:100, background:rc.bg, border:`1px solid ${rc.border}`, color:rc.text, fontSize:8, fontWeight:800, textTransform:"uppercase" }}>
                          {a.overall_rating ?? "—"}
                        </span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>Match: <strong style={{ color:getScoreColor(a.match_percentage??0) }}>{a.match_percentage??0}%</strong></span>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>ATS: <strong style={{ color:getScoreColor(a.ats_score??0) }}>{a.ats_score??0}%</strong></span>
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

          {analyses.length < total && (
            <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : `Load More (${total - analyses.length} left)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}