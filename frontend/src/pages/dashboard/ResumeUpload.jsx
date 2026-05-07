import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

const PROCESS_MSGS = [
  "Extracting text from resume...",
  "Identifying key skills...",
  "Analyzing work experience...",
  "Parsing education details...",
  "Running AI extraction...",
  "Generating candidate profile...",
  "Finalizing analysis...",
]

const GREETINGS = [
  "Ready to analyze your resume?",
  "Let's find your perfect job match.",
  "Upload your resume, unlock insights.",
  "Your next opportunity starts here.",
  "AI-powered analysis in seconds.",
]

const KEYWORDS = ["React","Node.js","Python","JavaScript","AWS","Docker","MongoDB","TypeScript","SQL","Machine Learning","REST API","Git"]

function highlightKeywords(text) {
  if (!text) return text
  let out = text
  KEYWORDS.forEach(kw => {
    out = out.replace(new RegExp(`\\b${kw}\\b`, "gi"), `<mark class="kw-highlight">${kw}</mark>`)
  })
  return out
}

const generateDisplayName = (name, id) => {
  if (!name) return `Candidate_${id?.slice(-4) ?? "????"}`
  const num = id ? parseInt(id.replace(/-/g,"").slice(-4),16) % 9000 + 1000 : Math.floor(Math.random()*9000)+1000
  return `${name.replace(/\s+/g,"_")}_${num}`
}

const getFirstName = (user) => {
  if (!user) return "there"
  if (user.displayName) return user.displayName.split(" ")[0]
  const email = user.email ?? ""
  return email.split("@")[0] || "there"
}

export default function ResumeUpload() {
  const navigate           = useNavigate()
  const user               = useAuthStore((s) => s.user)
  const darkMode           = useAuthStore((s) => s.darkMode)
  const setLastResumeId    = useAuthStore((s) => s.setLastResumeId)
  const setLastResumeData  = useAuthStore((s) => s.setLastResumeData)  

  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [msgIdx, setMsgIdx]     = useState(0)
  const [success, setSuccess]   = useState(false)
  const [greeting]              = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const timerRef = useRef(null)

  const dm = darkMode
  const C = {
    card:   dm ? "#111827" : "#fff",
    border: dm ? "#1f2937" : "#f1f5f9",
    text:   dm ? "#f9fafb" : "#0f172a",
    body:   dm ? "#d1d5db" : "#374151",
    muted:  "#94a3b8",
  }

  const firstName = getFirstName(user)

  useEffect(() => {
    if (loading) {
      timerRef.current = setInterval(() => setMsgIdx(i => (i + 1) % PROCESS_MSGS.length), 1800)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [loading])

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first")
    setLoading(true); setResult(null); setMsgIdx(0)
    try {
      const fd = new FormData(); fd.append("resume", file)
      const token = localStorage.getItem("access_token")
      const res = await api.post("/api/resume/upload", fd, {
        headers: { "Content-Type":"multipart/form-color", Authorization:`Bearer ${token}` }
      })
      
      setLastResumeId(res.data.resume_id)
      setLastResumeData(res.data)
      setResult(res.data); setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      toast.success("Resume analyzed! 🎉")
    } catch (e) { toast.error(e.response?.data?.error ?? "Upload failed") }
    finally { setLoading(false) }
  }

  const displayName = result ? generateDisplayName(result.data?.basic_info?.name, result.resume_id) : ""

  return (
    <div>
      <style>{`
        .rc-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .welcome-anim { animation:fadeSlideUp 0.5s cubic-bezier(.16,1,.3,1) forwards; }
        .greeting-text {
          background:linear-gradient(135deg,#2563EB,#6366f1,#06b6d4);
          background-size:200% 200%; -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; background-clip:text;
          animation:gradientShift 4s ease infinite;
        }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .suggestion-chip {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:100px;
          border:1px solid ${dm?"#374151":"#e2e8f0"};
          background:${dm?"#1f2937":"#f8fafc"};
          color:${dm?"#d1d5db":"#64748b"};
          font-size:12px; font-weight:500; cursor:pointer; transition:all .15s;
          font-family:'Inter',sans-serif;
        }
        .suggestion-chip:hover { border-color:#2563EB; background:${dm?"rgba(37,99,235,.1)":"#eff6ff"}; color:#2563EB; }
        @keyframes borderSpin{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .upload-wrap { position:relative; border-radius:20px; padding:2px; }
        .upload-wrap.active::before { content:''; position:absolute; inset:0; border-radius:20px; background:linear-gradient(90deg,#2563EB,#6366f1,#06b6d4,#2563EB); background-size:300% 300%; animation:borderSpin 2.5s ease infinite; z-index:0; }
        .upload-zone { border-radius:18px; padding:52px 24px; text-align:center; cursor:pointer; transition:all .2s; position:relative; z-index:1; background:${C.card}; }
        .upload-zone.plain { border:2px dashed ${dm?"#374151":"#e2e8f0"}; }
        .upload-zone.plain:hover,.upload-zone.plain.drag { border-color:#2563EB; background:${dm?"rgba(37,99,235,.06)":"#eff6ff"}; }
        .upload-zone.hasfile { background:${dm?"rgba(16,185,129,.05)":"#f0fdf4"}; }
        .upload-icon { width:68px; height:68px; border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
        @keyframes iconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} .icon-anim{animation:iconFloat 2.5s ease-in-out infinite;}
        .ubtn { padding:13px 36px; border-radius:12px; border:none; background:#2563EB; color:#fff; font-size:15px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(37,99,235,.3); display:inline-flex; align-items:center; gap:8px; }
        .ubtn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);}
        .ubtn:disabled{opacity:.5;cursor:not-allowed;}
        .mbtn { padding:12px 24px; border-radius:12px; border:1px solid ${dm?"rgba(16,185,129,.2)":"#bbf7d0"}; background:${dm?"rgba(16,185,129,.1)":"#f0fdf4"}; color:${dm?"#34d399":"#059669"}; font-size:14px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; }
        .mbtn:hover{background:${dm?"rgba(16,185,129,.15)":"#dcfce7"};}
        @keyframes msgFade{0%{opacity:0;transform:translateY(6px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}
        .proc-msg{animation:msgFade 1.8s ease forwards;}
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        .skill-tag{padding:5px 14px;border-radius:100px;background:${dm?"rgba(37,99,235,.1)":"#eff6ff"};color:${dm?"#60a5fa":"#2563EB"};font-size:12px;font-weight:500;border:1px solid ${dm?"rgba(37,99,235,.2)":"#bfdbfe"};display:inline-flex;}
        .copy-btn{padding:6px 14px;border-radius:8px;border:1px solid ${dm?"#1f2937":"#bfdbfe"};background:${dm?"#111827":"#fff"};color:${dm?"#60a5fa":"#2563EB"};font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;}
        .copy-btn:hover{background:${dm?"#1f2937":"#eff6ff"};}
        mark.kw-highlight{background:rgba(37,99,235,.15);color:${dm?"#60a5fa":"#2563EB"};border-radius:4px;padding:1px 5px;font-weight:500;}
        .info-label{font-size:11px;color:#94a3b8;margin-bottom:2px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;}
        .info-val{font-size:13px;color:${C.text};font-weight:500;}
        .sec-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;}
      `}</style>

      <TopBar title="" subtitle="" />

      {/* Welcome Header */}
      {!result && (
        <div className="welcome-anim" style={{ textAlign:"center", marginBottom:40, paddingTop:8 }}>
          <p style={{ fontSize:13, fontWeight:500, color:C.muted, marginBottom:10 }}>
            {new Date().getHours() < 12 ? "☀️ Good morning" : new Date().getHours() < 17 ? "👋 Good afternoon" : "🌙 Good evening"},{" "}
            <span style={{ color:C.text, fontWeight:600 }}>{firstName}</span>
          </p>
          <h1 style={{ fontSize:32, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", letterSpacing:"-0.5px", lineHeight:1.2, marginBottom:10, color:C.text }}>
            <span className="greeting-text">{greeting}</span>
          </h1>
          <p style={{ fontSize:15, color:C.muted, maxWidth:480, margin:"0 auto 24px", lineHeight:1.6 }}>
            Drop your resume below and let AI extract your skills, experience, and insights — in seconds.
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
            {["📄 PDF supported","📝 DOCX supported","⚡ AI powered","🔒 Secure & private"].map(c=>(
              <span key={c} className="suggestion-chip">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div className={`upload-wrap${file || dragging ? " active" : ""}`} style={{ marginBottom:20 }}>
          <div
            className={`upload-zone${file ? " hasfile" : dragging ? " plain drag" : " plain"}`}
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop}
            onClick={()=>document.getElementById("fi").click()}
          >
            <input id="fi" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display:"none" }} onChange={e=>setFile(e.target.files[0])}/>
            {file ? (
              <div className="animate-fade-in">
                <div className="upload-icon icon-anim" style={{ background:"#dcfce7" }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 2v6h6M9 13l2 2 4-4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontSize:17, fontWeight:600, color:"#059669", marginBottom:4, fontFamily:"Satoshi,Inter,sans-serif" }}>{file.name}</p>
                <p style={{ fontSize:13, color:C.muted }}>{(file.size/1024).toFixed(1)} KB — Click to change</p>
              </div>
            ) : (
              <div>
                <div className="upload-icon icon-anim" style={{ background:dm?"rgba(37,99,235,.15)":"#eff6ff" }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontSize:17, fontWeight:600, color:C.text, marginBottom:6, fontFamily:"Satoshi,Inter,sans-serif" }}>
                  Drop your resume here
                </p>
                <p style={{ fontSize:13, color:C.muted }}>or click to browse &nbsp;•&nbsp; PDF, DOCX, DOC, TXT &nbsp;•&nbsp; Max 5MB</p>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="rc-card animate-fade-in" style={{ padding:"24px", marginBottom:20, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:14 }}>
              <svg className="sp" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={dm?"#374151":"#e2e8f0"} strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/></svg>
              <span key={msgIdx} className="proc-msg gradient-text" style={{ fontSize:15, fontWeight:600, fontFamily:"Satoshi,Inter,sans-serif" }}>
                {PROCESS_MSGS[msgIdx]}
              </span>
            </div>
            <div style={{ height:4, background:dm?"#1f2937":"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#2563EB,#6366f1)", borderRadius:4, width:`${((msgIdx+1)/PROCESS_MSGS.length)*100}%`, transition:"width 1.8s ease" }}/>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:32 }}>
          <button className="ubtn" onClick={handleUpload} disabled={!file||loading}>
            {loading
              ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>Analyzing...</>
              : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>Upload & Analyze</>
            }
          </button>
          {result && (
            <button className="mbtn animate-fade-in" onClick={()=>navigate("/dashboard/jd-match")}>
              ✓ Match with JD →
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="animate-fade-in stagger" style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:900, margin:"0 auto" }}>
          {success && (
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:"#059669" }}>Resume analyzed successfully!</p>
                <p style={{ fontSize:12, color:"#6b7280" }}>All data saved. Ready to match with job descriptions.</p>
              </div>
            </div>
          )}

          <div style={{ background:dm?"rgba(37,99,235,.1)":"#eff6ff", border:"1px solid #bfdbfe", borderRadius:14, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontSize:11, color:"#3b82f6", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Candidate ID</p>
              <p style={{ fontSize:14, color:dm?"#93c5fd":"#1d4ed8", fontWeight:600, fontFamily:"Satoshi,Inter,sans-serif" }}>{displayName}</p>
            </div>
            <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(result.resume_id);toast.success("Resume ID copied!")}}>
              Copy Raw ID
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            <div className="rc-card" style={{ padding:20 }}>
              <p className="sec-label">Candidate Overview</p>
              {[
                { l:"Name",       v:result.data?.basic_info?.name },
                { l:"Email",      v:result.data?.basic_info?.email },
                { l:"Phone",      v:result.data?.basic_info?.phone },
                { l:"Experience", v:`${result.data?._meta?.total_experience_years ?? 0} yrs` },
                { l:"Location",   v:result.data?.basic_info?.location },
              ].filter(x=>x.v).map(item=>(
                <div key={item.l} style={{ marginBottom:12 }}>
                  <p className="info-label">{item.l}</p>
                  <p className="info-val">{item.v}</p>
                </div>
              ))}
            </div>
            <div className="rc-card" style={{ padding:20 }}>
              <p className="sec-label">Technical Skills</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {(result.data?.skills?.technical ?? []).slice(0,12).map(s=>(
                  <span key={s} className="skill-tag">{s}</span>
                ))}
                {(result.data?.skills?.tools ?? []).slice(0,6).map(s=>(
                  <span key={s} style={{ padding:"5px 14px", borderRadius:100, background:"#f0fdf4", color:"#059669", fontSize:12, fontWeight:500, border:"1px solid #bbf7d0", display:"inline-flex" }}>{s}</span>
                ))}
              </div>
            </div>
            <div className="rc-card" style={{ padding:20 }}>
              <p className="sec-label">Summary</p>
              {result.data?.summary
                ? <p style={{ fontSize:13, color:C.body, lineHeight:1.75 }} dangerouslySetInnerHTML={{ __html: highlightKeywords(result.data.summary) }}/>
                : <p style={{ fontSize:13, color:C.muted }}>No summary available.</p>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}