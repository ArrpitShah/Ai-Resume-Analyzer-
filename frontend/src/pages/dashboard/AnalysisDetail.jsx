import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

const ScoreRing = ({ score, size=110, color="#2563EB", label, dm }) => {
  const r = (size-14)/2
  const circ = 2*Math.PI*r
  const fill = ((score??0)/100)*circ
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ position:"relative", width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
          <circle cx={size/2} cy={size/2} r={r} stroke={dm?"#1f2937":"#f1f5f9"} strokeWidth="11" fill="none"/>
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="11" fill="none"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 6px ${color}60)` }}/>
        </svg>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:24, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", color:dm?"#f9fafb":"#0f172a", lineHeight:1 }}>{score??0}</p>
          <p style={{ fontSize:10, color:"#94a3b8" }}>/100</p>
        </div>
      </div>
      <p style={{ fontSize:12, color:dm?"#94a3b8":"#64748b", marginTop:8, fontWeight:500 }}>{label}</p>
    </div>
  )
}

const getRatingColor = (r="") => {
  r = r.toLowerCase()
  if (r.includes("excellent")) return "#10b981"
  if (r.includes("good"))      return "#2563EB"
  if (r.includes("average"))   return "#f59e0b"
  return "#ef4444"
}

export default function AnalysisDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const darkMode  = useAuthStore(s => s.darkMode)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [tab, setTab]       = useState("overview")
  const [iTab, setITab]     = useState("technical")

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
    const fetch = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await api.get(
          `/api/match/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setData(res.data.data)
      } catch (e) {
        setError(e.response?.data?.error ?? "Failed to load analysis")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const technicalQs = data?.interview_questions?.filter(q => q.category==="Technical" || q.category==="Situational") ?? []
  const hrQs        = data?.interview_questions?.filter(q => q.category==="Behavioral" || q.category==="HR") ?? []

  return (
    <div>
      <style>{`
        .rc-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;}
        .tab{padding:8px 18px;border-radius:9px;border:none;font-size:13px;font-weight:500;font-family:'Inter',sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:${C.sub};}
        .tab.on{background:#eff6ff;color:#2563EB;} .dark .tab.on{background:rgba(37,99,235,.12);color:#60a5fa;}
        .itab{padding:7px 16px;border-radius:8px;border:none;font-size:13px;font-weight:500;font-family:'Inter',sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:${C.sub};}
        .itab.on{background:#0f172a;color:#fff;} .dark .itab.on{background:#f1f5f9;color:#0f172a;}
        .str-item{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid ${dm?"#1f2937":"#f8fafc"};}
        .str-item:last-child{border:none;}
        .miss-tag{padding:5px 14px;border-radius:100px;background:${dm?"rgba(239,68,68,.08)":"#fef2f2"};color:#ef4444;font-size:12px;font-weight:500;border:1px solid ${dm?"rgba(239,68,68,.25)":"#fecaca"};}
        .sug-card{border-left:3px solid #2563EB;background:${dm?"rgba(37,99,235,.04)":"#f8fafc"};border-radius:0 12px 12px 0;padding:14px 16px;margin-bottom:12px;}
        .iq-card{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:18px;margin-bottom:12px;transition:all .2s;}
        .iq-card:hover{border-color:#bfdbfe;box-shadow:0 4px 14px rgba(37,99,235,.08);}
        .cat-badge{display:inline-flex;padding:3px 12px;border-radius:100px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
        .tip-box{display:flex;gap:8px;align-items:flex-start;background:${dm?"rgba(245,158,11,.05)":"#fffbeb"};border-radius:8px;padding:9px 12px;border:1px solid ${dm?"rgba(245,158,11,.25)":"#fde68a"};margin-top:10px;}
        .back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;border:1px solid ${C.border};background:${C.card};color:${C.body};font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;margin-bottom:20px;}
        .back-btn:hover{background:${dm?"#1f2937":"#f8fafc"};border-color:#cbd5e1;}
      `}</style>

      <TopBar title="Analysis Detail" subtitle="Full breakdown of resume vs job description match" />

      {/* Back button */}
      <button className="back-btn" onClick={() => navigate("/dashboard/analyses")}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Back to All Analyses
      </button>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="rc-card" style={{ padding:28 }}>
            <div style={{ display:"flex", gap:16, marginBottom:24 }}>
              <div className="skeleton" style={{ flex:1, height:24 }}/>
              <div className="skeleton" style={{ width:80, height:28, borderRadius:100 }}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:140, borderRadius:16 }}/>)}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ textAlign:"center", padding:"48px 24px", background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontSize:32, marginBottom:12 }}>⚠️</p>
          <p style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4 }}>Failed to load analysis</p>
          <p style={{ fontSize:13, color:"#94a3b8", marginBottom:16 }}>{error}</p>
          <button onClick={() => navigate("/dashboard/analyses")}
            style={{ padding:"9px 20px", borderRadius:10, border:"none", background:"#2563EB", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
            Go Back
          </button>
        </div>
      )}

      {/* Content */}
      {data && !loading && (
        <div className="animate-fade-in">

          {/* Score Section */}
          <div className="rc-card" style={{ padding:28, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div>
                <p style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600, marginBottom:4 }}>Analysis Result</p>
                <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", color:C.text, letterSpacing:"-0.3px" }}>
                  Resume vs Job Description
                </h2>
                <p style={{ fontSize:13, color:C.sub, marginTop:2 }}>
                  {new Date(data.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                </p>
              </div>
              <div style={{
                padding:"8px 22px", borderRadius:100,
                background:`${getRatingColor(data.overall_rating)}15`,
                border:`1px solid ${getRatingColor(data.overall_rating)}30`,
                color:getRatingColor(data.overall_rating),
                fontSize:15, fontWeight:700,
              }}>
                {data.overall_rating}
              </div>
            </div>

            {/* Score Rings */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={data.match_percentage} color="#2563EB" label="Match %" dm={dm}/>
              </div>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={data.ats_score} color="#10b981" label="ATS Score" dm={dm}/>
              </div>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={Math.round((data.match_percentage + data.ats_score) / 2)} color="#6366f1" label="Overall Score" dm={dm}/>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div style={{ display:"flex", gap:4, marginBottom:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:13, padding:5, width:"fit-content" }}>
            {[["overview","📊 Overview"],["strengths","✓ Strengths"],["suggestions","⚡ Suggestions"],["interview","? Interview"]].map(([k,l])=>(
              <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab==="overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="rc-card" style={{ padding:22 }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Improvement Summary</p>
                <p style={{ fontSize:14, color:dm?"#9ca3af":"#95979a", lineHeight:1.75 }}>{data.improvement_summary}</p>
              </div>
              <div className="rc-card" style={{ padding:22 }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Missing Skills</p>
                {data.skill_gap?.missing_required?.length
                  ? <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {data.skill_gap.missing_required.map((s,i)=><span key={i} className="miss-tag">{s}</span>)}
                    </div>
                  : <p style={{ fontSize:14, color:"#10b981", fontWeight:500 }}>✓ No critical skills missing!</p>
                }
                {data.skill_gap?.extra_skills?.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <p style={{ fontSize:11, color:"#94a3b8", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Bonus Skills</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {data.skill_gap.extra_skills.map((s,i)=>(
                        <span key={i} style={{ padding:"5px 14px", borderRadius:100, background:dm?"rgba(16,185,129,.1)":"#f0fdf4", color:dm?"#34d399":"#059669", fontSize:12, fontWeight:500, border:dm?"1px solid rgba(16,185,129,.2)":"1px solid #bbf7d0" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Missing keywords */}
              {data.missing_keywords?.length > 0 && (
                <div className="rc-card" style={{ padding:22, gridColumn:"1/-1" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Missing Keywords</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {data.missing_keywords.map((kw,i)=>(
                      <span key={i} style={{ padding:"5px 14px", borderRadius:100, background:dm?"rgba(245,158,11,.1)":"#fffbeb", color:dm?"#fbbf24":"#d97706", fontSize:12, fontWeight:500, border:dm?"1px solid rgba(245,158,11,.2)":"1px solid #fde68a" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths Tab */}
          {tab==="strengths" && (
            <div className="rc-card" style={{ padding:24 }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:16 }}>Key Strengths</p>
              {data.strengths?.map((s,i)=>(
                <div key={i} className="str-item">
                  <div style={{ width:22, height:22, borderRadius:7, background:dm?"rgba(16,185,129,.15)":"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </div>
                  <p style={{ fontSize:14, color:C.body, lineHeight:1.65 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions Tab */}
          {tab==="suggestions" && (
            <div>
              {data.improvement_suggestions?.map((item,i)=>(
                <div key={i} className="sug-card">
                  <p style={{ fontSize:13, fontWeight:600, color:dm?"#60a5fa":"#2563EB", marginBottom:5 }}>{item.area}</p>
                  <p style={{ fontSize:14, color:C.body, lineHeight:1.65 }}>{item.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Interview Tab */}
          {tab==="interview" && (
            <div>
              {/* Sub tabs */}
              <div style={{ display:"flex", gap:4, marginBottom:16, background:dm?"#111827":"#0f172a", border:dm?`1px solid ${C.border}`:"none", borderRadius:10, padding:4, width:"fit-content" }}>
                <button className={`itab${iTab==="technical"?" on":""}`} onClick={()=>setITab("technical")}>💻 Technical</button>
                <button className={`itab${iTab==="hr"?" on":""}`} onClick={()=>setITab("hr")}>🤝 HR / Behavioral</button>
              </div>

              {(iTab==="technical" ? technicalQs : hrQs).map((q,i)=>(
                <div key={i} className="iq-card">
                  <span className="cat-badge" style={{
                    background: q.category==="Technical"?(dm?"rgba(37,99,235,.15)":"#eff6ff"):q.category==="Behavioral"?(dm?"rgba(147,51,234,.15)":"#fdf4ff"):(dm?"rgba(234,88,12,.15)":"#fff7ed"),
                    color:      q.category==="Technical"?(dm?"#60a5fa":"#2563EB"):q.category==="Behavioral"?(dm?"#c084fc":"#9333ea"):(dm?"#fb923c":"#ea580c"),
                  }}>{q.category}</span>
                  <p style={{ fontSize:14, fontWeight:500, color:C.text, lineHeight:1.65, marginBottom:8 }}>{q.question}</p>
                  <div className="tip-box">
                    <span style={{ fontSize:14 }}>💡</span>
                    <p style={{ fontSize:13, color:dm?"#fbbf24":"#92400e" }}>{q.tip}</p>
                  </div>
                </div>
              ))}

              {(iTab==="technical" ? technicalQs : hrQs).length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 0", color:"#94a3b8" }}>
                  No {iTab} questions available.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}        </div>
      )}
    </div>
  )
}