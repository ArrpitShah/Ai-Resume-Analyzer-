import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import api from "../../services/axiosInstance"

export default function CoverLetter() {
  const darkMode = useAuthStore(s => s.darkMode)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState("")
  const [jdText, setJdText] = useState("")
  const [tone, setTone] = useState("professional")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

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
    const fetchResumes = async () => {
      try {
        const res = await api.get("/api/resume/my-resumes")
        setResumes(res.data.data)
        if (res.data.data.length > 0) setSelectedResume(res.data.data[0].id)
      } catch (e) { toast.error("Failed to load resumes") }
    }
    fetchResumes()
  }, [])

  const handleGenerate = async () => {
    if (!selectedResume) return toast.error("Please select a resume")
    if (jdText.length < 50) return toast.error("Please provide a more detailed job description")

    setLoading(true)
    try {
      // 1. Upload JD first to get jd_id
      const jdRes = await api.post("/api/jd/upload", { text: jdText })
      const jdId = jdRes.data.jd_id

      // 2. Generate Cover Letter
      const clRes = await api.post("/api/cover-letter/generate", {
        resume_id: selectedResume,
        jd_id: jdId,
        tone
      })
      setResult(clRes.data)
      toast.success("Cover letter generated! 📝")
    } catch (e) {
      toast.error(e.response?.data?.error ?? "Generation failed")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!result?.cover_letter) return
    navigator.clipboard.writeText(result.cover_letter)
    toast.success("Copied to clipboard! 📋")
  }

  return (
    <div className="container-px">
      <style>{`
        .cl-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:24px;}
        .jin{width:100%;border-radius:12px;outline:none;border:1px solid ${C.border};background:${C.card};color:${C.text};font-size:14px;transition:all .2s;}
        .tone-btn{padding:8px 16px;border-radius:8px;border:1px solid ${C.border};background:${C.card};color:${C.sub};font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
        .tone-btn.on{background:#2563EB;color:#fff;border-color:#2563EB;}
        .gen-btn{padding:12px 24px;border-radius:12px;border:none;background:#2563EB;color:#fff;font-size:14px;font-weight:700;cursor:pointer;width:100%;box-shadow:0 4px 12px rgba(37,99,235,0.2);}
        .cl-output{width:100%;min-height:400px;background:${C.muted};border:1px solid ${C.border};border-radius:12px;padding:20px;font-size:14px;line-height:1.6;color: ${C.body};font-family:'Inter',sans-serif;resize:vertical;outline:none;}
      `}</style>

      <TopBar title="Cover Letter AI" subtitle="Generate tailored, high-impact cover letters in seconds" />

      <div style={{ display:"grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
        <div className="cl-card">
           <div style={{ marginBottom: 20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.sub, marginBottom:8, textTransform:"uppercase" }}>1. Select Resume</label>
              <select value={selectedResume} onChange={e=>setSelectedResume(e.target.value)} className="jin" style={{ padding:10 }}>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.candidate_name || "Untitled Resume"}</option>)}
              </select>
           </div>

           <div style={{ marginBottom: 20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.sub, marginBottom:8, textTransform:"uppercase" }}>2. Paste Job Description</label>
              <textarea 
                value={jdText} onChange={e=>setJdText(e.target.value)} 
                placeholder="Paste the job requirements here..." 
                className="jin" style={{ padding:12, height:180, resize:"none" }}
              />
           </div>

           <div style={{ marginBottom: 24 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.sub, marginBottom:8, textTransform:"uppercase" }}>3. Choose Tone</label>
              <div style={{ display:"flex", gap:8 }}>
                 {["professional", "casual", "creative"].map(t => (
                   <button key={t} className={`tone-btn${tone===t?" on":""}`} onClick={()=>setTone(t)}>
                     {t.charAt(0).toUpperCase() + t.slice(1)}
                   </button>
                 ))}
              </div>
           </div>

           <button className="gen-btn" onClick={handleGenerate} disabled={loading}>
             {loading ? "Generating..." : "✨ Generate Cover Letter"}
           </button>
        </div>

        <div className="cl-card">
           <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.sub, textTransform:"uppercase" }}>Generated Result</label>
              {result && (
                <button onClick={copyToClipboard} style={{ background:"none", border:"none", color:"#2563EB", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h4a2 2 0 002-2M8 5a2 2 0 012-2h4a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-9 7h3m-3 4h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeJoin="round"/></svg>
                  Copy to Clipboard
                </button>
              )}
           </div>

           {result ? (
             <div className="animate-fade-in">
                <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Subject: {result.subject_line}</p>
                <textarea 
                  className="cl-output" 
                  value={result.cover_letter} 
                  onChange={e=>setResult({...result, cover_letter: e.target.value})}
                />
                <p style={{ textAlign:"right", fontSize:11, color:C.sub, marginTop:8 }}>
                  Character count: {result.cover_letter.length}
                </p>
             </div>
           ) : (
             <div style={{ height:400, display:"flex", alignItems:"center", justifyContent:"center", color:C.sub, border:`2px dashed ${C.border}`, borderRadius:12 }}>
                <p style={{ fontSize:14 }}>Generate a cover letter to see it here</p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
