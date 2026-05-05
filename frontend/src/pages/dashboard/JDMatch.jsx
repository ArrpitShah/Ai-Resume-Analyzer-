import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import axios from "axios"

const MATCH_MSGS = [
  "Uploading job description...",
  "Tokenizing requirements...",
  "Running vector similarity model...",
  "Optimizing keyword matching...",
  "Analyzing skill gaps...",
  "Generating interview questions...",
  "Computing ATS score...",
  "Finalizing insights...",
]

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
          <p style={{ fontSize:size>100?26:20, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", color:dm?"#f9fafb":"#0f172a", lineHeight:1 }}>{score??0}</p>
          <p style={{ fontSize:10, color:"#94a3b8" }}>/100</p>
        </div>
      </div>
      <p style={{ fontSize:12, color:dm?"#94a3b8":"#64748b", marginTop:8, fontWeight:500 }}>{label}</p>
    </div>
  )
}

export default function JDMatch() {
  const lastResumeId   = useAuthStore((s) => s.lastResumeId)
  const lastResumeData = useAuthStore((s) => s.lastResumeData)  
  const darkMode       = useAuthStore((s) => s.darkMode)

 
  const candidateName = lastResumeData?.data?.basic_info?.name ?? null

  const [jdText, setJd] = useState("")
  const [rid, setRid]   = useState(lastResumeId ?? "")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [tab, setTab]         = useState("overview")
  const [iTab, setITab]       = useState("technical")
  const [msgIdx, setMsgIdx]   = useState(0)
  const timer = useRef(null)
  const token = localStorage.getItem("access_token")

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

  const handleMatch = async () => {
    if (!jdText.trim()) return toast.error("Please enter job description")
    if (!rid.trim())    return toast.error("Please enter Resume ID")
    setLoading(true); setResult(null); setMsgIdx(0)
    try {
      const jdRes = await axios.post("http://localhost:5000/api/jd/upload",{text:jdText},{headers:{Authorization:`Bearer ${token}`}})
      const mRes  = await axios.post("http://localhost:5000/api/match/analyze",{resume_id:rid,jd_id:jdRes.data.jd_id},{headers:{Authorization:`Bearer ${token}`}})
      setResult(mRes.data.data); setTab("overview"); setITab("technical")
      toast.success("Analysis complete! 🎉")
    } catch(e){ toast.error(e.response?.data?.error ?? "Match failed") }
    finally{ setLoading(false) }
  }

  const rc = (r="")=>{
    r = r.toLowerCase()
    if(r.includes("excellent")) return "#10b981"
    if(r.includes("good"))      return "#2563EB"
    if(r.includes("average"))   return "#f59e0b"
    return "#ef4444"
  }

  const technicalQs = result?.interview_questions?.filter(q => q.category==="Technical" || q.category==="Situational") ?? []
  const hrQs        = result?.interview_questions?.filter(q => q.category==="Behavioral" || q.category==="HR") ?? []

  return (
    <div>
      <style>{`
        .rc-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;}
        .jin{width:100%;border-radius:12px;outline:none;border:1px solid ${C.border};background:${C.card};color:${C.text};font-size:14px;font-family:'Inter',sans-serif;transition:all .2s;}
        .jin::placeholder{color:#94a3b8;}
        .jin:hover{border-color:#cbd5e1;} .jin:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1);}
        .mbtn2{padding:13px 28px;border-radius:12px;border:none;background:#2563EB;color:#fff;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(37,99,235,.3);display:inline-flex;align-items:center;gap:8px;}
        .mbtn2:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);} .mbtn2:disabled{opacity:.5;cursor:not-allowed;}
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
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        @keyframes msgFade{0%{opacity:0;transform:translateY(5px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-5px)}} .mf{animation:msgFade 1.6s ease forwards;}

     
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
      `}</style>

      <TopBar title="JD Match" subtitle="Match your resume against job descriptions for deep AI analysis" candidateName={result?.candidate_name}/>

      {/* Input */}
      <div className="rc-card" style={{ padding:28, marginBottom:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>

          {}
          <div>
            <label style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:500, color:C.body, marginBottom:7 }}>
              <span>Resume</span>
              {lastResumeId && !candidateName && <span style={{ color:"#10b981", fontSize:12 }}>✓ ID Auto-filled</span>}
            </label>

            {candidateName ? (
              
              <div>
                <div className="candidate-pill">
                  <div className="candidate-avatar">
                    {candidateName.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:dm?"#34d399":"#059669", marginBottom:1 }}>{candidateName}</p>
                    <p style={{ fontSize:11, color:"#94a3b8" }}>Resume loaded & ready to match</p>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                {}
                <input type="hidden" value={rid}/>
              </div>
            ) : (
              
              <input
                value={rid}
                onChange={e=>setRid(e.target.value)}
                placeholder="Paste resume ID here"
                className="jin"
                style={{ padding:"11px 14px", borderColor: lastResumeId ? "#bbf7d0" : undefined }}
              />
            )}
          </div>

          <div>
            <label style={{ fontSize:13, fontWeight:500, color:C.body, marginBottom:7, display:"block" }}>Quick Tip</label>
            <div style={{ background:C.muted, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:13, color:C.sub }}>
              💡 {candidateName
                ? `${candidateName}'s resume is ready — just paste JD below!`
                : "Upload a resume first to auto-fill candidate details"
              }
            </div>
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:13, fontWeight:500, color:C.body, marginBottom:7, display:"flex", justifyContent:"space-between" }}>
            <span>Job Description</span>
            <span style={{ color:"#94a3b8", fontWeight:400 }}>{jdText.length} chars</span>
          </label>
          <textarea value={jdText} onChange={e=>setJd(e.target.value)} rows={7} placeholder="Paste the complete job description here for best results..." className="jin" style={{ padding:"13px 14px", resize:"vertical" }}/>
        </div>

        <button className="mbtn2" onClick={handleMatch} disabled={loading}>
          {loading
            ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg><span className="mf" key={msgIdx}>{MATCH_MSGS[msgIdx]}</span></>
            : <><svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>Analyze Match</>
          }
        </button>
      </div>

      {/* Loading progress */}
      {loading && (
        <div className="rc-card animate-fade-in" style={{ padding:"20px 24px", marginBottom:20 }}>
          <div style={{ height:4, background:dm?"#1f2937":"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#2563EB,#6366f1,#06b6d4)", backgroundSize:"200% 100%", borderRadius:4, width:`${((msgIdx+1)/MATCH_MSGS.length)*100}%`, transition:"width 1.6s ease" }}/>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in">
          <div className="rc-card" style={{ padding:28, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", color:C.text, letterSpacing:"-0.3px" }}>{result.candidate_name}</h2>
                <p style={{ fontSize:14, color:C.sub, marginTop:2 }}>{result.job_title}{result.company_name ? ` @ ${result.company_name}` : ""}</p>
              </div>
              <div style={{ padding:"8px 22px", borderRadius:100, background:`${rc(result.overall_rating)}15`, border:`1px solid ${rc(result.overall_rating)}30`, color:rc(result.overall_rating), fontSize:15, fontWeight:700 }}>
                {result.overall_rating}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={result.similarity_score} color="#2563EB" label="Similarity" dm={dm}/>
              </div>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={result.ats_score} color="#10b981" label="ATS Score" dm={dm}/>
              </div>
              <div style={{ background:C.muted, borderRadius:16, padding:"18px 12px", textAlign:"center" }}>
                <ScoreRing score={result.match_percentage} color="#6366f1" label="Match %" dm={dm}/>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", gap:4, marginBottom:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:13, padding:5, width:"fit-content" }}>
            {[["overview","📊 Overview"],["strengths","✓ Strengths"],["suggestions","⚡ Suggestions"],["interview","? Interview"]].map(([k,l])=>(
              <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {tab==="overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="rc-card" style={{ padding:22 }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Improvement Summary</p>
                <p style={{ fontSize:14, color:dm?"#9ca3af":"#374151", lineHeight:1.75 }}>{result.improvement_summary}</p>
              </div>
              <div className="rc-card" style={{ padding:22 }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Missing Skills</p>
                {result.skill_gap?.missing_required?.length
                  ? <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{result.skill_gap.missing_required.map((s,i)=><span key={i} className="miss-tag">{s}</span>)}</div>
                  : <p style={{ fontSize:14, color:"#10b981", fontWeight:500 }}>✓ No critical skills missing!</p>
                }
                {result.skill_gap?.extra_skills?.length > 0 && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontSize:11, color:"#94a3b8", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>Bonus Skills</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {result.skill_gap.extra_skills.map((s,i)=><span key={i} style={{ padding:"5px 14px", borderRadius:100, background:dm?"rgba(16,185,129,.1)":"#f0fdf4", color:dm?"#34d399":"#059669", fontSize:12, fontWeight:500, border:dm?"1px solid rgba(16,185,129,.2)":"#bbf7d0" }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab==="strengths" && (
            <div className="rc-card" style={{ padding:24 }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:16 }}>Key Strengths</p>
              {result.strengths?.map((s,i)=>(
                <div key={i} className="str-item">
                  <div style={{ width:22, height:22, borderRadius:7, background:dm?"rgba(16,185,129,.15)":"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </div>
                  <p style={{ fontSize:14, color:C.body, lineHeight:1.65 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {tab==="suggestions" && (
            <div>
              {result.improvement_suggestions?.map((item,i)=>(
                <div key={i} className="sug-card">
                  <p style={{ fontSize:13, fontWeight:600, color:dm?"#60a5fa":"#2563EB", marginBottom:5 }}>{item.area}</p>
                  <p style={{ fontSize:14, color:C.body, lineHeight:1.65 }}>{item.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {tab==="interview" && (
            <div>
              <div style={{ display:"flex", gap:4, marginBottom:16, background:dm?"#111827":"#0f172a", border:dm?`1px solid ${C.border}`:"none", borderRadius:10, padding:4, width:"fit-content" }}>
                <button className={`itab${iTab==="technical"?" on":""}`} onClick={()=>setITab("technical")}>💻 Technical</button>
                <button className={`itab${iTab==="hr"?" on":""}`}        onClick={()=>setITab("hr")}>🤝 HR / Behavioral</button>
              </div>
              {(iTab==="technical" ? technicalQs : hrQs).map((q,i)=>(
                <div key={i} className="iq-card">
                  <span className="cat-badge" style={{
                    background: q.category==="Technical"?(dm?"rgba(37,99,235,.15)":"#eff6ff"):q.category==="Behavioral"?(dm?"rgba(147,51,234,.15)":"#fdf4ff"):(dm?"rgba(234,88,12,.15)":"#fff7ed"),
                    color:      q.category==="Technical"?(dm?"#60a5fa":"#2563EB"):q.category==="Behavioral"?(dm?"#c084fc":"#9333ea"):(dm?"#fb923c":"#ea580c"),
                  }}>{q.category}</span>
                  <p style={{ fontSize:14, fontWeight:500, color:C.text, lineHeight:1.65, marginBottom:8 }}>{q.question}</p>
                  <div style={{ fontSize:12, color:C.sub }}>
                    <strong style={{ color:"#f59e0b" }}>Why asked:</strong> This question tests your hands-on experience and depth of knowledge.
                  </div>
                  <div className="tip-box">
                    <span style={{ fontSize:14 }}>💡</span>
                    <p style={{ fontSize:13, color:dm?"#fbbf24":"#92400e" }}>{q.tip}</p>
                  </div>
                </div>
              ))}
              {(iTab==="technical" ? technicalQs : hrQs).length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 0", color:"#94a3b8" }}>No {iTab} questions available.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}