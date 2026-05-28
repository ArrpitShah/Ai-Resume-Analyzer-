import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

const MATCH_MSGS = [
  "Uploading job descriptions...",
  "Tokenizing requirements...",
  "Running vector similarity model...",
  "Optimizing keyword matching...",
  "Analyzing skill gaps...",
  "Generating interview questions...",
  "Computing ATS scores...",
  "Finalizing insights...",
]

export default function JDMatch() {
  const navigate       = useNavigate()
  const lastResumeId   = useAuthStore((s) => s.lastResumeId)
  const lastResumeData = useAuthStore((s) => s.lastResumeData)  
  const darkMode       = useAuthStore((s) => s.darkMode)

  const candidateName = lastResumeData?.candidate_name

  const [jds, setJds]   = useState([""]) // Array of JD texts
  const [rid, setRid]   = useState(lastResumeId ?? "")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([]) // Array of result objects
  const [activeTab, setActiveTab] = useState("grid")
  const [selectedResultIdx, setSelectedResultIdx] = useState(0)
  const [rewrites, setRewrites] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [loadingAI, setLoadingAI] = useState(false)
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [msgIdx, setMsgIdx]   = useState(0)
  const timer = useRef(null)
  const token = localStorage.getItem("access_token")

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const dm = darkMode
  const C = {
    text:   dm ? "#f9fafb" : "#0f172a",
    sub:    dm ? "#94a3b8" : "#64748b",
    card:   dm ? "#111827" : "#ffffff",
    border: dm ? "#1f2937" : "#f1f5f9",
    muted:  dm ? "#1f2937" : "#f8fafc",
    body:   dm ? "#d1d5db" : "#374151",
  }

  useEffect(() => {
    if (loading) { timer.current = setInterval(()=>setMsgIdx(i=>(i+1)%MATCH_MSGS.length), 1600) }
    else clearInterval(timer.current)
    return ()=>clearInterval(timer.current)
  }, [loading])

  const handleAddJD = () => {
    if (jds.length < 5) setJds([...jds, ""])
    else toast.error("Maximum 5 JDs allowed for comparison")
  }

  const handleJDChange = (index, val) => {
    const newJds = [...jds]
    newJds[index] = val
    setJds(newJds)
  }

  const handleMatch = async () => {
    const validJds = jds.filter(t => t.trim().length > 10)
    if (validJds.length === 0) return toast.error("Please enter at least one valid job description")
    if (!rid.trim()) return toast.error("Please enter Resume ID")
    
    setLoading(true); setResults([]); setMsgIdx(0); setActiveTab("grid")
    try {
      // 1. Upload all valid JDs
      const jdPromises = validJds.map(text => api.post("/api/jd/upload", { text }))
      const jdResponses = await Promise.all(jdPromises)
      const jdIds = jdResponses.map(r => r.data.jd_id)

      // 2. Compare Multiple
      const mRes = await api.post("/api/match/compare", {
        resume_id: rid,
        jd_ids: jdIds
      })

      setResults(mRes.data.data)
      setSelectedResultIdx(0)
      toast.success("Comparison complete! 🎉")
    } catch(e){ 
      toast.error(e.response?.data?.error ?? "Comparison failed") 
    } finally { 
      setLoading(false) 
    }
  }

  const fetchRewrites = async (resId, jdId) => {
    setLoadingAI(true)
    try {
      const r = await api.post("/api/rewrite/suggest", { resume_id: resId, jd_id: jdId })
      setRewrites(r.data.suggestions)
    } catch (e) { toast.error("Failed to fetch rewrites") }
    finally { setLoadingAI(false) }
  }

  const fetchRoadmap = async (resId, jdId) => {
    setLoadingAI(true)
    try {
      const r = await api.post("/api/roadmap/generate", { resume_id: resId, jd_id: jdId })
      setRoadmap(r.data.roadmap)
    } catch (e) { toast.error("Failed to fetch roadmap") }
    finally { setLoadingAI(false) }
  }

  useEffect(() => {
    if (activeTab === "rewrite" && results[selectedResultIdx]) {
      fetchRewrites(rid, results[selectedResultIdx].jd_id)
    }
    if (activeTab === "roadmap" && results[selectedResultIdx]) {
      fetchRoadmap(rid, results[selectedResultIdx].jd_id)
    }
  }, [activeTab, selectedResultIdx])

  const rc = (r="")=>{
    r = r.toLowerCase()
    if(r.includes("excellent")) return "#10b981"
    if(r.includes("good"))      return "#2563EB"
    if(r.includes("average"))   return "#f59e0b"
    return "#ef4444"
  }

  return (
    <div className="container-px">
      <style>{`
        .rc-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:28px;}
        @media (max-width: 767px) { .rc-card { padding: 18px !important; } }
        
        .jin{width:100%;border-radius:12px;outline:none;border:1px solid ${C.border};background:${C.card};color:${C.text};font-size:14px;font-family:'Inter',sans-serif;transition:all .2s;}
        .jin::placeholder{color:#94a3b8;}
        .jin:hover{border-color:#cbd5e1;} .jin:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1);}
        
        .mbtn2{padding:13px 28px;border-radius:12px;border:none;background:#2563EB;color:#fff;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(37,99,235,.3);display:inline-flex;align-items:center;gap:8px;width:100%;justify-content:center;}
        .mbtn-outline{padding:10px 20px;border-radius:10px;border:1px solid #2563EB;background:transparent;color:#2563EB;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
        .mbtn-outline:hover{background:rgba(37,99,235,0.05);}

        .comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .comp-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:20px; transition:all .2s; }
        .comp-card:hover { transform:translateY(-4px); border-color:#2563EB; }
        .comp-card.active { border-color:#2563EB; box-shadow: 0 0 0 2px rgba(37,99,235,.1); }

        .candidate-pill {
          display:flex; align-items:center; gap:10px;
          background:${dm?"rgba(16,185,129,.08)":"#f0fdf4"}; border:1px solid ${dm?"rgba(16,185,129,.2)":"#bbf7d0"};
          border-radius:12px; padding:10px 14px;
        }
        .candidate-avatar {
          width:34px; height:34px; border-radius:9px;
          background:linear-gradient(135deg,#2563EB,#6366f1);
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-size:13px; font-weight:700; flex-shrink:0;
        }

        .tab-btn {
          padding: 10px 18px; border:none; background:none; cursor:pointer;
          font-size:14px; fontWeight:700; color:${C.sub}; border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn.on { color:#2563EB; border-bottom-color:#2563EB; }

        .rewrite-card {
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center;
          background: ${C.card}; border: 1px solid ${C.border}; border-radius: 12px; padding: 16px; margin-bottom: 12px;
        }
        .rewrite-text { font-size: 13px; padding: 12px; border-radius: 8px; line-height: 1.5; }
        .original { background: ${dm?"rgba(239,68,68,0.05)":"#fef2f2"}; color: ${dm?"#fca5a5":"#ef4444"}; }
        .improved { background: ${dm?"rgba(16,185,129,0.05)":"#f0fdf4"}; color: ${dm?"#6ee7b7":"#059669"}; }
        
        .roadmap-week {
          border-left: 2px solid #2563EB; padding-left: 24px; position: relative; padding-bottom: 32px;
        }
        .roadmap-week::before {
          content: ""; position: absolute; left: -7px; top: 0; width: 12px; height: 12px;
          border-radius: 50%; background: #2563EB; border: 2px solid ${C.card};
        }
        .resource-tag {
          display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; text-decoration: none; background: ${C.muted}; color: ${C.text};
          border: 1px solid ${C.border}; margin-right: 8px; margin-top: 8px;
        }
      `}</style>

      <TopBar title="JD Comparison" subtitle="Compare one resume against multiple job descriptions for multi-opportunity insights" />

      {/* Input */}
      <div className="rc-card" style={{ marginBottom: 24 }}>
        
        <div style={{ marginBottom: 24 }}>
           <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.body, marginBottom:10 }}>Selected Resume</label>
           {candidateName ? (
              <div className="candidate-pill">
                <div className="candidate-avatar">{candidateName.slice(0,2).toUpperCase()}</div>
                <div style={{ flex:1 }}>
                   <p style={{ fontSize:14, fontWeight:600, color:dm?"#34d399":"#059669", marginBottom:1 }}>{candidateName}</p>
                   <p style={{ fontSize:11, color:"#94a3b8" }}>Ready for comparison</p>
                </div>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
           ) : (
              <input value={rid} onChange={e=>setRid(e.target.value)} placeholder="Paste Resume ID here" className="jin" style={{ padding:12 }}/>
           )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
          {jds.map((text, idx) => (
            <div key={idx} className="animate-fade-in">
              <label style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, color:C.sub, marginBottom:6 }}>
                <span>Job Description #{idx + 1}</span>
                {jds.length > 1 && <button onClick={()=>setJds(jds.filter((_,i)=>i!==idx))} style={{ color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700 }}>Remove</button>}
              </label>
              <textarea value={text} onChange={e=>handleJDChange(idx, e.target.value)} rows={4} placeholder="Paste job requirements here..." className="jin" style={{ padding:12, resize:"vertical" }}/>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
          <button className="mbtn-outline" onClick={handleAddJD} disabled={jds.length >= 5 || loading}>+ Add Job Description</button>
          <button className="mbtn2" onClick={handleMatch} disabled={loading}>
             {loading 
               ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ animation: "sp 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>{MATCH_MSGS[msgIdx]}</>
               : `Compare ${jds.filter(t=>t.trim().length > 10).length} Opportunities`
             }
          </button>
        </div>
      </div>

      {/* Results Header with Tabs */}
      {results.length > 0 && !loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display:"flex", gap:20, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
            <button className={`tab-btn${activeTab==="grid"?" on":""}`} onClick={()=>setActiveTab("grid")}>📊 Comparison</button>
            <button className={`tab-btn${activeTab==="rewrite"?" on":""}`} onClick={()=>setActiveTab("rewrite")}>✏️ Rewrite Tips</button>
            <button className={`tab-btn${activeTab==="roadmap"?" on":""}`} onClick={()=>setActiveTab("roadmap")}>🗺️ Skill Roadmap</button>
          </div>
          
          {(activeTab === "rewrite" || activeTab === "roadmap") && results.length > 1 && (
            <div style={{ marginBottom: 20, display:"flex", alignItems:"center", gap:12 }}>
               <span style={{ fontSize:12, fontWeight:600, color:C.sub }}>Select Opportunity:</span>
               <select 
                 value={selectedResultIdx} 
                 onChange={e=>setSelectedResultIdx(parseInt(e.target.value))}
                 style={{ padding:"6px 12px", borderRadius:8, background:C.card, color:C.text, border:`1px solid ${C.border}`, fontSize:13, outline:"none" }}
               >
                 {results.map((r, i) => <option key={i} value={i}>{r.job_title || `JD #${i+1}`}</option>)}
               </select>
            </div>
          )}
        </div>
      )}

      {/* Results Content */}
      {loading && (
         <div className="rc-card" style={{ textAlign:"center", padding:48 }}>
            <div style={{ height:4, background:dm?"#1f2937":"#f1f5f9", borderRadius:4, overflow:"hidden", marginBottom:20 }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#2563EB,#6366f1)", width:`${((msgIdx+1)/MATCH_MSGS.length)*100}%`, transition:"width 1.6s ease" }}/>
            </div>
            <p style={{ color:C.text, fontWeight:600, fontSize:15 }}>{MATCH_MSGS[msgIdx]}</p>
         </div>
      )}

      {!loading && activeTab === "grid" && results.length > 0 && (
        <div className="stagger comparison-grid">
          {results.map((res, i) => (
            <div key={i} className="comp-card">
               <div style={{ marginBottom:16 }}>
                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                   <p style={{ fontSize:10, color:C.sub, textTransform:"uppercase", fontWeight:800 }}>Analysis #{i+1}</p>
                   <div style={{ padding:"2px 8px", borderRadius:6, background:`${rc(res.overall_rating)}15`, color:rc(res.overall_rating), fontSize:10, fontWeight:800, textTransform:"uppercase" }}>
                      {res.overall_rating}
                   </div>
                 </div>
                 <h3 style={{ fontSize:16, fontWeight:800, color:C.text, marginTop:6, fontFamily:"Satoshi,Inter,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                   {res.job_title || "Job Opportunity"}
                 </h3>
                 <p style={{ fontSize:12, color:C.sub }}>{res.company_name || "Company Details Private"}</p>
               </div>
               
               <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                  <div style={{ flex:1, background:dm?"#1f2937":"#f8fafc", padding:12, borderRadius:12, textAlign:"center", border:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:9, color:C.sub, textTransform:"uppercase", fontWeight:700, marginBottom:2 }}>Match</p>
                    <p style={{ fontSize:20, fontWeight:800, color:"#2563EB" }}>{res.match_percentage}%</p>
                  </div>
                  <div style={{ flex:1, background:dm?"#1f2937":"#f8fafc", padding:12, borderRadius:12, textAlign:"center", border:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:9, color:C.sub, textTransform:"uppercase", fontWeight:700, marginBottom:2 }}>ATS</p>
                    <p style={{ fontSize:20, fontWeight:800, color:"#10b981" }}>{res.ats_score}%</p>
                  </div>
               </div>

               <button onClick={()=>navigate(`/dashboard/analysis/${res.analysis_id}`)} style={{ width:"100%", padding:12, borderRadius:12, border:"none", background:dm?"#1f2937":"#f1f5f9", color:C.text, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
                 View Full Report →
               </button>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === "rewrite" && (
        <div className="animate-fade-in">
          {loadingAI ? (
             <div className="rc-card" style={{ textAlign:"center", padding:40 }}>
                <svg className="sp" width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "sp 1s linear infinite", marginBottom:12 }}><circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,.2)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/></svg>
                <p style={{ color:C.sub, fontSize:14 }}>AI is crafting better bullet points for you...</p>
             </div>
          ) : (
            <div>
              {rewrites.map((s, idx) => (
                <div key={idx} className="rewrite-card">
                  <div className="rewrite-text original">{s.original}</div>
                  <div style={{ color:C.sub }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeJoin="round"/></svg>
                  </div>
                  <div className="rewrite-text improved">{s.improved}</div>
                  <div style={{ gridColumn: "1/-1", marginTop:8, fontSize:11, color:C.sub, fontStyle:"italic" }}>
                    <span style={{ fontWeight:700, color: "#2563EB", marginRight:6 }}>REASON:</span> {s.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === "roadmap" && (
        <div className="animate-fade-in">
          {loadingAI ? (
             <div className="rc-card" style={{ textAlign:"center", padding:40 }}>
                <svg className="sp" width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "sp 1s linear infinite", marginBottom:12 }}><circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,.2)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/></svg>
                <p style={{ color:C.sub, fontSize:14 }}>Building your 30-day mastery plan...</p>
             </div>
          ) : (
            <div className="rc-card">
              {roadmap.length === 0 && <p style={{ textAlign:"center", color:C.sub }}>No roadmap available or no skill gaps found.</p>}
              {roadmap.map((week, idx) => (
                <div key={idx} className="roadmap-week">
                   <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <h4 style={{ fontSize:16, fontWeight:800, color:C.text }}>Week {week.week}</h4>
                        <p style={{ fontSize:12, color:"#2563EB", fontWeight:700, marginTop:2 }}>{week.milestone}</p>
                      </div>
                      <div style={{ padding:"4px 10px", borderRadius:6, background:"rgba(37,99,235,0.1)", color:"#2563EB", fontSize:10, fontWeight:800 }}>
                        STEP {idx + 1}
                      </div>
                   </div>
                   
                   <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                      {week.skills.map((s, i) => (
                        <span key={i} style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:100, background:dm?"#1f2937":"#f1f5f9", color:C.text, border:`1px solid ${C.border}` }}>{s}</span>
                      ))}
                   </div>

                   <div style={{ display:"flex", flexWrap:"wrap" }}>
                      {week.resources.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noreferrer" className="resource-tag">
                           {res.type === "video" ? "🎥" : res.type === "course" ? "🎓" : "📄"} {res.title}
                        </a>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
