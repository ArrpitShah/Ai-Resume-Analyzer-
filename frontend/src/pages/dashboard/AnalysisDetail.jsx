import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton"

const ScoreRing = ({ score, size=85, color="#2563EB", label, dm }) => {
  const r = (size-12)/2
  const circ = 2*Math.PI*r
  const fill = ((score??0)/100)*circ
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ position:"relative", width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
          <circle cx={size/2} cy={size/2} r={r} stroke={dm?"#1f2937":"#f1f5f9"} strokeWidth="9" fill="none"/>
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="9" fill="none"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1s ease-out" }}/>
        </svg>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:18, fontWeight:800, fontFamily:"Satoshi,Inter,sans-serif", color:dm?"#f9fafb":"#0f172a", lineHeight:1 }}>{score??0}</p>
          <p style={{ fontSize:8, color:"#94a3b8", fontWeight:600 }}>/100</p>
        </div>
      </div>
      <p style={{ fontSize:10, color:dm?"#94a3b8":"#64748b", marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.02em" }}>{label}</p>
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

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/api/export/analysis/${id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `remcheck-analysis-${id.slice(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      toast.error("Failed to generate PDF report")
    }
  }

  const technicalQs = data?.interview_questions?.filter(q => q.category==="Technical" || q.category==="Situational") ?? []
  const hrQs        = data?.interview_questions?.filter(q => q.category==="Behavioral" || q.category==="HR") ?? []

  return (
    <div>
      <style>{`
        .rc-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;}
        .tab{padding:8px 16px;border-radius:8px;border:none;font-size:12px;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:${C.sub};}
        .tab.on{background:#eff6ff;color:#2563EB;} .dark .tab.on{background:rgba(37,99,235,.12);color:#60a5fa;}
        .itab{padding:6px 14px;border-radius:6px;border:none;font-size:12px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:${C.sub};}
        .itab.on{background:#0f172a;color:#fff;} .dark .itab.on{background:#f1f5f9;color:#0f172a;}
        
        @media print {
          .sb, .topbar, .back-btn, .tab-bar, .itab, .pdf-btn { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .rc-card { border: 1px solid #eee !important; box-shadow: none !important; margin-bottom: 20px !important; break-inside: avoid; }
          .overview-grid { grid-template-columns: 1fr !important; }
          .animate-fade-in { animation: none !important; opacity: 1 !important; }
          .ring-row svg circle:first-child { stroke: #eee !important; }
        }

        .pdf-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px;
          background: #10b981; color: #fff; font-size: 12px; font-weight: 700; border: none;
          cursor: pointer; transition: all 0.2s; margin-left: 8px;
          box-shadow: 0 4px 12px rgba(16,185,129,0.2);
        }
        .pdf-btn:hover { background: #059669; transform: translateY(-1px); }

        .str-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid ${dm?"#1f2937":"#f8fafc"};}
        .str-item:last-child{border:none;}
        .miss-tag{padding:4px 12px;border-radius:100px;background:${dm?"rgba(239,68,68,.08)":"#fef2f2"};color:#ef4444;font-size:11px;font-weight:600;border:1px solid ${dm?"rgba(239,68,68,.25)":"#fecaca"};}
        .sug-card{border-left:3px solid #2563EB;background:${dm?"rgba(37,99,235,.04)":"#f8fafc"};border-radius:0 10px 10px 0;padding:12px 14px;margin-bottom:10px;}
        .iq-card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px;margin-bottom:10px;transition:all .2s;}
        .iq-card:hover{border-color:#bfdbfe;box-shadow:0 4px 12px rgba(37,99,235,.06);}
        .cat-badge{display:inline-flex;padding:2px 10px;border-radius:100px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;}
        .tip-box{display:flex;gap:6px;align-items:flex-start;background:${dm?"rgba(245,158,11,.05)":"#fffbeb"};border-radius:6px;padding:8px 10px;border:1px solid ${dm?"rgba(245,158,11,.25)":"#fde68a"};margin-top:8px;}
        .back-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid ${C.border};background:${C.card};color:${C.body};font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;margin-bottom:16px;}
        .back-btn:hover{background:${dm?"#1f2937":"#f8fafc"};border-color:#cbd5e1;}
        .ring-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
        }
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .tab-bar {
          display: flex;
          gap: 2px;
          margin-bottom: 14px;
          background: ${C.card};
          border: 1px solid ${C.border};
          borderRadius: 10px;
          padding: 4px;
          width: fit-content;
        }
        @media (max-width: 640px) {
          .ring-row {
            justify-content: space-between;
          }
          .overview-grid {
            grid-template-columns: 1fr;
          }
          .tab-bar {
            width: 100%;
            justify-content: space-between;
          }
          .tab { padding: 8px 10px; font-size: 11px; }
        }
        `}</style>

        <TopBar title="Analysis Result" subtitle="Visual matching breakdown" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="back-btn" style={{ marginBottom: 0 }} onClick={() => navigate("/dashboard/analyses")}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Back
          </button>
          
          {data && (
            <button className="pdf-btn" onClick={handleDownloadPDF}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeJoin="round"/></svg>
              Download PDF Report
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="animate-fade-in">
            <div className="rc-card" style={{ padding:18, marginBottom:16 }}>
               <Skeleton width="120px" height="12px" style={{ marginBottom:14 }} />
               <div className="ring-row">
                  {[1,2,3].map(i => <div key={i} style={{ textAlign:"center" }}><Skeleton width="85px" height="85px" borderRadius="50%" /><Skeleton width="40px" height="10px" style={{ marginTop:10, marginInline:"auto" }} /></div>)}
               </div>
            </div>
            <div style={{ display:"flex", gap:4, marginBottom:14 }}>
               {[1,2,3,4].map(i => <Skeleton key={i} width="100px" height="32px" borderRadius="10px" />)}
            </div>
            <div className="overview-grid">
               <div className="rc-card" style={{ padding:16 }}><Skeleton width="80px" height="10px" style={{ marginBottom:12 }} /><SkeletonText lines={4} /></div>
               <div className="rc-card" style={{ padding:16 }}><Skeleton width="80px" height="10px" style={{ marginBottom:12 }} /><div style={{ display:"flex", gap:6 }}><Skeleton width="60px" height="24px" borderRadius="100px" /><Skeleton width="80px" height="24px" borderRadius="100px" /></div></div>
            </div>
          </div>
        ) : error ? (
           <div className="rc-card" style={{ padding:40, textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>😕</div>
              <p style={{ color:C.text, fontWeight:700 }}>{error}</p>
              <button className="mbtn-outline" style={{ marginTop:20 }} onClick={()=>navigate("/dashboard/analyses")}>Back to Analyses</button>
           </div>
        ) : data && (
        <div className="animate-fade-in">

          {/* Score Section */}
          <div className="rc-card" style={{ padding:18, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", fontWeight:800, marginBottom:2 }}>Score Breakdown</p>
                <h2 style={{ fontSize:17, fontWeight:800, fontFamily:"Satoshi,Inter,sans-serif", color:C.text, letterSpacing:"-0.2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  Match Summary
                </h2>
              </div>
              <div style={{
                padding:"4px 14px", borderRadius:100,
                background:`${getRatingColor(data.overall_rating)}15`,
                border:`1px solid ${getRatingColor(data.overall_rating)}30`,
                color:getRatingColor(data.overall_rating),
                fontSize:12, fontWeight:800, textTransform:"uppercase"
              }}>
                {data.overall_rating}
              </div>
            </div>

            {/* Unified Score Rings */}
            <div className="ring-row">
                <ScoreRing score={data.match_percentage} color="#2563EB" label="Match" dm={dm}/>
                <ScoreRing score={data.ats_score} color="#10b981" label="ATS" dm={dm}/>
                <ScoreRing score={Math.round((data.match_percentage + data.ats_score) / 2)} color="#6366f1" label="Overall" dm={dm}/>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="tab-bar">
            {[["overview","📊 Overview"],["strengths","✓ Strengths"],["suggestions","⚡ Suggestions"],["interview","? Q&A"]].map(([k,l])=>(
              <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab==="overview" && (
            <div className="overview-grid">
              <div className="rc-card" style={{ padding:16 }}>
                <p style={{ fontSize:10, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Analysis</p>
                <p style={{ fontSize:13, color:dm?"#9ca3af":"#4b5563", lineHeight:1.6, fontWeight:500 }}>{data.improvement_summary}</p>
              </div>
              <div className="rc-card" style={{ padding:16 }}>
                <p style={{ fontSize:10, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Skills Check</p>
                {data.skill_gap?.missing_required?.length
                  ? <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {data.skill_gap.missing_required.map((s,i)=><span key={i} className="miss-tag">{s}</span>)}
                    </div>
                  : <p style={{ fontSize:13, color:"#10b981", fontWeight:700 }}>✓ All required skills matched!</p>
                }
              </div>

              {data.missing_keywords?.length > 0 && (
                <div className="rc-card" style={{ padding:16, gridColumn:"1/-1" }}>
                  <p style={{ fontSize:10, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Missing Keywords</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {data.missing_keywords.map((kw,i)=>(
                      <span key={i} style={{ padding:"4px 12px", borderRadius:100, background:dm?"rgba(245,158,11,.1)":"#fffbeb", color:dm?"#fbbf24":"#d97706", fontSize:11, fontWeight:600, border:dm?"1px solid rgba(245,158,11,.2)":"1px solid #fde68a" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths Tab */}
          {tab==="strengths" && (
            <div className="rc-card" style={{ padding:18 }}>
              <p style={{ fontSize:10, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>Top Strengths</p>
              {data.strengths?.map((s,i)=>(
                <div key={i} className="str-item">
                  <div style={{ width:20, height:20, borderRadius:6, background:dm?"rgba(16,185,129,.15)":"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/></svg>
                  </div>
                  <p style={{ fontSize:13, color:C.body, lineHeight:1.5, fontWeight:500 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions Tab */}
          {tab==="suggestions" && (
            <div>
              {data.improvement_suggestions?.map((item,i)=>(
                <div key={i} className="sug-card">
                  <p style={{ fontSize:12, fontWeight:700, color:dm?"#60a5fa":"#2563EB", marginBottom:4 }}>{item.area}</p>
                  <p style={{ fontSize:13, color:C.body, lineHeight:1.5, fontWeight:500 }}>{item.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Interview Tab */}
          {tab==="interview" && (
            <div>
              <div style={{ display:"flex", gap:3, marginBottom:14, background:dm?"#111827":"#0f172a", borderRadius:8, padding:3, width:"fit-content" }}>
                <button className={`itab${iTab==="technical"?" on":""}`} onClick={()=>setITab("technical")}>Technical</button>
                <button className={`itab${iTab==="hr"?" on":""}`} onClick={()=>setITab("hr")}>HR</button>
              </div>

              {(iTab==="technical" ? technicalQs : hrQs).map((q,i)=>(
                <div key={i} className="iq-card">
                  <span className="cat-badge" style={{
                    background: q.category==="Technical"?(dm?"rgba(37,99,235,.15)":"#eff6ff"):q.category==="Behavioral"?(dm?"rgba(147,51,234,.15)":"#fdf4ff"):(dm?"rgba(234,88,12,.15)":"#fff7ed"),
                    color:      q.category==="Technical"?(dm?"#60a5fa":"#2563EB"):q.category==="Behavioral"?(dm?"#c084fc":"#9333ea"):(dm?"#fb923c":"#ea580c"),
                  }}>{q.category}</span>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, lineHeight:1.5, marginBottom:6 }}>{q.question}</p>
                  <div className="tip-box">
                    <span style={{ fontSize:12 }}>💡</span>
                    <p style={{ fontSize:12, color:dm?"#fbbf24":"#92400e", fontWeight:500 }}>{q.tip}</p>
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
