import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { login } from "../../services/authService"
import useAuthStore from "../../stores/authStore"
import { supabase } from "../../lib/supabaseClient"  

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, darkMode } = useAuthStore()
  const [form, setForm]         = useState({ email:"", password:"" })
  const [err, setErr]           = useState({})
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [focus, setFocus]       = useState("")
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [darkMode])

  const validate = () => {
    const e = {}
    if (!form.email.trim())    e.email    = "Email required"
    if (!form.password.trim()) e.password = "Password required"
    setErr(e); return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault(); if (!validate()) return
    setLoading(true)
    try {
      const res = await login(form)
      // Explicitly check if essential data and token are present
      if (res.data && res.data.access_token) {
        setAuth(res.data, res.data.access_token)
        toast.success("Welcome back! 👋")
        navigate("/dashboard")
      } else {
        // If response is okay but lacks token/data, treat as login failure
        toast.error("Login failed: Missing token or user data.")
      }
    } catch (e) {
      // If network error or backend error response
      const errorMessage = e.response?.data?.error || e.message || "Login failed";
      toast.error(errorMessage);
    } finally { setLoading(false) }
  }

  
  const handleGoogle = async () => {
    setGLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) throw error
    } catch (err) {
      toast.error(err.message ?? "Google login failed")
      setGLoading(false)
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Exo 2','Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Exo+2:ital,wght@0,100..900&family=Josefin+Sans:ital,wght@0,100..700&family=Lilita+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .lbg{background:linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 60%,#F0F9FF 100%);}
        .dark .lbg{background:#0A0F1E;}
        .ai{width:100%;padding:11px 16px 11px 40px;font-size:14px;border-radius:12px;outline:none;border:1px solid #e2e8f0;background:#fff;color:#0f172a;transition:all .2s;font-family:'Exo 2','Inter',sans-serif;}
        .dark .ai{background:#111827;border-color:#1f2937;color:#f1f5f9;}
        .ai::placeholder{color:#9ca3af;}
        .ai:hover{border-color:#cbd5e1;}
        .ai.foc{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1);}
        .ai.er{border-color:#f87171;}
        .abtn{width:100%;padding:12px;border-radius:12px;border:none;background:#2563EB;color:#fff;font-size:14px;font-weight:600;font-family:'Exo 2','Inter',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;gap:8px;}
        .abtn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);}
        .abtn:disabled{opacity:.55;cursor:not-allowed;}
        .gbtn{width:100%;padding:11px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;color:#374151;font-size:14px;font-weight:500;font-family:'Exo 2','Inter',sans-serif;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;}
        .dark .gbtn{background:#111827;border-color:#1f2937;color:#d1d5db;}
        .gbtn:hover:not(:disabled){background:#f8fafc;transform:translateY(-1px);}
        .dark .gbtn:hover:not(:disabled){background:#1f2937;}
        .gbtn:disabled{opacity:.6;cursor:not-allowed;}
        .gbtn-loading{position:absolute;inset:0;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:500;color:#374151;}
        .dark .gbtn-loading{background:rgba(17,24,39,.92);color:#d1d5db;}
        .lbl{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px;}
        .dark .lbl{color:#d1d5db;}
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} .logo-float{animation:fl 3s ease-in-out infinite;}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu .45s cubic-bezier(.16,1,.3,1) forwards;}
        .divider-line{flex:1;height:1px;background:#e2e8f0;}
        .dark .divider-line{background:#1f2937;}
        .h1-login{font-size:28px;font-weight:400;font-family:'Lilita One',sans-serif;letter-spacing:-0.4px;margin-bottom:6px;color:#0f172a;}
        .dark .h1-login{color:#f9fafb;}
        .sub-login{font-size:14px;color:#64748b;}
        .dark .sub-login{color:#94a3b8;}
        .logo-rem{color:#0f172a;}
        .dark .logo-rem{color:#f8fafc;}
        `}</style>

        {/* Form Side */}
        <div className="lbg" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 24px" }}>
        <div className="fu" style={{ width:"100%", maxWidth:400 }}>

          {/* Logo */}
          <div style={{ marginBottom:36 }}>
            <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none" }}>
              <div className="logo-float" style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(37,99,235,.35)" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontSize:22, fontWeight:400, fontFamily:"'Lilita One',sans-serif", letterSpacing:"-0.3px" }}>
                <span className="logo-rem">Rem</span><span style={{ color:"#2563EB" }}>Check</span>
              </span>
            </Link>
          </div>
          <div style={{ marginBottom:28 }}>
            <h1 className="h1-login">Welcome back</h1>
            <p className="sub-login">Sign in to your RemCheck account</p>
          </div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div>
              <label className="lbl">Email address</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </span>
                <input type="email" placeholder="you@example.com" value={form.email}
                  onFocus={()=>setFocus("em")} onBlur={()=>setFocus("")}
                  onChange={e=>setForm({...form,email:e.target.value})}
                  className={`ai${focus==="em"?" foc":""}${err.email?" er":""}`}/>
              </div>
              {err.email && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ {err.email}</p>}
            </div>

            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label className="lbl" style={{ marginBottom:0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize:12, color:"#2563EB", textDecoration:"none", fontWeight:500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </span>
                <input type={showPw?"text":"password"} placeholder="••••••••" value={form.password}
                  onFocus={()=>setFocus("pw")} onBlur={()=>setFocus("")}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  className={`ai${focus==="pw"?" foc":""}${err.password?" er":""}`}
                  style={{ paddingRight:44 }}/>
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af" }}>
                  {showPw
                    ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    : <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                  }
                </button>
              </div>
              {err.password && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ {err.password}</p>}
            </div>

            <button type="submit" className="abtn" disabled={loading||gLoading}>
              {loading
                ? <><svg className="sp" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>Signing in...</>
                : "Sign in →"
              }
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div className="divider-line"/><span style={{ fontSize:12, color:"#94a3b8" }}>or</span><div className="divider-line"/>
            </div>

            <button type="button" className="gbtn" onClick={handleGoogle} disabled={gLoading||loading}>
              {gLoading ? (
                <div className="gbtn-loading">
                  <svg className="sp" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/></svg>
                  Redirecting to Google...
                </div>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:14, color:"#64748b", marginTop:24 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color:"#2563EB", fontWeight:600, textDecoration:"none" }}>Create one →</Link>
          </p>
        </div>
      </div>

      {/* Visual Side */}
      {!isMobile && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#1e3a8a 0%,#2563EB 45%,#6366f1 100%)" }}>
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,.25),transparent)", top:"-8%", right:"-8%" }}/>
          <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.3),transparent)", bottom:"5%", left:"5%" }}/>
          <div style={{ position:"relative", zIndex:1, maxWidth:380, padding:"0 40px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:28 }}>
              <div style={{ width:44, height:44, borderRadius:13, background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontSize:24, fontWeight:400, fontFamily:"'Lilita One',sans-serif" }}>
                <span style={{ color:"#ffffff" }}>Rem</span><span style={{ color:"#93c5fd" }}>Check</span>
              </span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.2)", borderRadius:100, padding:"7px 16px", fontSize:13, fontWeight:500, marginBottom:22, color:"#fff" }}>✨ AI-Powered Resume Platform</div>
            <h2 style={{ fontSize:34, fontWeight:400, fontFamily:"'Lilita One',sans-serif", lineHeight:1.2, marginBottom:14, color:"#fff" }}>Analyze. Match.<br/>Get Hired.</h2>
            <p style={{ fontSize:15, color:"rgba(219,234,254,.9)", lineHeight:1.75, marginBottom:32 }}>Upload your resume, match it with job descriptions, and get AI-powered insights.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[{v:"98%",l:"ATS Score"},{v:"3x",l:"Interview Rate"},{v:"10k+",l:"Users"}].map(s=>(
                <div key={s.l} style={{ background:"rgba(255,255,255,.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.15)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
                  <p style={{ fontSize:22, fontWeight:400, fontFamily:"'Lilita One',sans-serif", color:"#fff" }}>{s.v}</p>
                  <p style={{ fontSize:11, color:"rgba(191,219,254,.8)", marginTop:3 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}