import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import api from "../../services/axiosInstance"

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [focus,   setFocus]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return toast.error("Please enter your email")
    setLoading(true)
    try {
      await api.post("/api/auth/forgot-password", { email })
      setSent(true)
      toast.success("Reset email sent! 📧")
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 60%,#F0F9FF 100%)", fontFamily:"'Exo 2','Inter',sans-serif", padding:"24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Lilita+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu .45s cubic-bezier(.16,1,.3,1) forwards;}
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} .lf{animation:fl 3s ease-in-out infinite;}
        @keyframes cp{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}} .cp{animation:cp .4s cubic-bezier(.16,1,.3,1) forwards;}
      `}</style>

      <div className="fu" style={{ width:"100%", maxWidth:420 }}>

        {}
        <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:36 }}>
          <div className="lf" style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(37,99,235,.35)" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:22, fontWeight:400, fontFamily:"'Lilita One',sans-serif" }}>
            <span style={{ color:"#0f172a" }}>Rem</span><span style={{ color:"#2563EB" }}>Check</span>
          </span>
        </Link>

        <div style={{ background:"#fff", borderRadius:20, padding:36, boxShadow:"0 4px 32px rgba(0,0,0,.07)", border:"1px solid #f1f5f9" }}>
          {!sent ? (
            <>
              <div style={{ width:56, height:56, borderRadius:16, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="#2563EB" strokeWidth="1.8"/><path d="M2 8l10 7 10-7" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <h1 style={{ fontSize:24, fontFamily:"'Lilita One',sans-serif", color:"#0f172a", marginBottom:8 }}>Forgot password?</h1>
              <p style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>
                No worries! Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Email address</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type="email" placeholder="you@example.com" value={email}
                      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
                      onChange={e=>setEmail(e.target.value)}
                      style={{ width:"100%", padding:"11px 14px 11px 40px", fontSize:14, borderRadius:12, outline:"none", border:`1px solid ${focus?"#2563EB":"#e2e8f0"}`, boxShadow:focus?"0 0 0 3px rgba(37,99,235,.1)":"none", background:"#fff", color:"#0f172a", transition:"all .2s", fontFamily:"'Exo 2','Inter',sans-serif" }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#2563EB", color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'Exo 2','Inter',sans-serif", cursor:loading?"not-allowed":"pointer", opacity:loading?.6:1, transition:"all .2s", boxShadow:"0 4px 16px rgba(37,99,235,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {loading
                    ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>Sending...</>
                    : "Send Reset Link →"
                  }
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign:"center" }}>
              <div className="cp" style={{ width:64, height:64, borderRadius:20, background:"#f0fdf4", border:"2px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <h2 style={{ fontSize:22, fontFamily:"'Lilita One',sans-serif", color:"#0f172a", marginBottom:10 }}>Check your email!</h2>
              <p style={{ fontSize:14, color:"#64748b", lineHeight:1.7, marginBottom:8 }}>We've sent a reset link to</p>
              <p style={{ fontSize:15, fontWeight:600, color:"#2563EB", marginBottom:24 }}>{email}</p>
              <p style={{ fontSize:13, color:"#94a3b8", marginBottom:24, lineHeight:1.6 }}>Didn't receive it? Check your spam folder or try again.</p>
              <button onClick={()=>{setSent(false);setEmail("")}}
                style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", color:"#374151", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Exo 2','Inter',sans-serif" }}>
                Try again
              </button>
            </div>
          )}
          <p style={{ textAlign:"center", fontSize:14, color:"#64748b", marginTop:24 }}>
            Remember your password?{" "}
            <Link to="/login" style={{ color:"#2563EB", fontWeight:600, textDecoration:"none" }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}