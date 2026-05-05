import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { supabase } from "../../lib/supabaseClient"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [loading,   setLoading]   = useState(false)
  const [showPw,    setShowPw]    = useState(false)
  const [showCf,    setShowCf]    = useState(false)
  const [focusPw,   setFocusPw]   = useState(false)
  const [focusCf,   setFocusCf]   = useState(false)
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    const t = setTimeout(() => setReady(true), 2000)
    return () => { subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password.length < 6)   return toast.error("Min 6 characters required")
    if (password !== confirm)   return toast.error("Passwords do not match")
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success("Password updated! Please sign in ✓")
      setTimeout(() => navigate("/login"), 1500)
    } catch (err) {
      toast.error(err.message ?? "Failed to reset password")
    } finally { setLoading(false) }
  }

  const strength = !password.length ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3

  const sLabel = ["","Weak","Fair","Good","Strong"][strength]
  const sColor = ["","#ef4444","#f59e0b","#2563EB","#10b981"][strength]

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 60%,#F0F9FF 100%)", fontFamily:"'Exo 2','Inter',sans-serif", padding:"24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Lilita+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu .45s cubic-bezier(.16,1,.3,1) forwards;}
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} .lf{animation:fl 3s ease-in-out infinite;}
        .pi{width:100%;padding:11px 44px 11px 40px;font-size:14px;border-radius:12px;outline:none;background:#fff;color:#0f172a;transition:all .2s;font-family:'Exo 2','Inter',sans-serif;}
      `}</style>

      <div className="fu" style={{ width:"100%", maxWidth:420 }}>
        <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:36 }}>
          <div className="lf" style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(37,99,235,.35)" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:22, fontWeight:400, fontFamily:"'Lilita One',sans-serif" }}>
            <span style={{ color:"#0f172a" }}>Rem</span><span style={{ color:"#2563EB" }}>Check</span>
          </span>
        </Link>

        <div style={{ background:"#fff", borderRadius:20, padding:36, boxShadow:"0 4px 32px rgba(0,0,0,.07)", border:"1px solid #f1f5f9" }}>
          {!ready ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <svg className="sp" width="32" height="32" fill="none" viewBox="0 0 24 24" style={{ margin:"0 auto 16px", display:"block" }}>
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="4"/>
                <path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize:14, color:"#64748b" }}>Verifying reset link...</p>
            </div>
          ) : (
            <>
              <div style={{ width:56, height:56, borderRadius:16, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#2563EB" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <h1 style={{ fontSize:24, fontFamily:"'Lilita One',sans-serif", color:"#0f172a", marginBottom:8 }}>Set new password</h1>
              <p style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>Choose a strong password for your account.</p>

              <form onSubmit={handleReset} style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>New Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showPw?"text":"password"} placeholder="Min 6 characters" value={password}
                      onFocus={()=>setFocusPw(true)} onBlur={()=>setFocusPw(false)}
                      onChange={e=>setPassword(e.target.value)}
                      className="pi" style={{ border:`1px solid ${focusPw?"#2563EB":"#e2e8f0"}`, boxShadow:focusPw?"0 0 0 3px rgba(37,99,235,.1)":"none" }}/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af" }}>
                      {showPw ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ height:4, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:4, background:sColor, width:`${strength*25}%`, transition:"width .3s,background .3s" }}/>
                      </div>
                      <p style={{ fontSize:12, color:sColor, marginTop:4, fontWeight:500 }}>{sLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Confirm Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showCf?"text":"password"} placeholder="Repeat password" value={confirm}
                      onFocus={()=>setFocusCf(true)} onBlur={()=>setFocusCf(false)}
                      onChange={e=>setConfirm(e.target.value)}
                      className="pi" style={{ border:`1px solid ${confirm&&confirm!==password?"#f87171":focusCf?"#2563EB":"#e2e8f0"}`, boxShadow:focusCf?"0 0 0 3px rgba(37,99,235,.1)":"none" }}/>
                    <button type="button" onClick={()=>setShowCf(!showCf)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af" }}>
                      {showCf ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>
                  {confirm && confirm !== password && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ Passwords do not match</p>}
                  {confirm && confirm === password  && <p style={{ color:"#10b981", fontSize:12, marginTop:4 }}>✓ Passwords match</p>}
                </div>

                <button type="submit" disabled={loading||password!==confirm||password.length<6}
                  style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#2563EB", color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'Exo 2','Inter',sans-serif", cursor:"pointer", opacity:loading||password!==confirm||password.length<6?.55:1, transition:"all .2s", boxShadow:"0 4px 16px rgba(37,99,235,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {loading
                    ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>Updating...</>
                    : "Update Password →"
                  }
                </button>
              </form>
            </>
          )}
          <p style={{ textAlign:"center", fontSize:14, color:"#64748b", marginTop:24 }}>
            <Link to="/login" style={{ color:"#2563EB", fontWeight:600, textDecoration:"none" }}>← Back to Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}