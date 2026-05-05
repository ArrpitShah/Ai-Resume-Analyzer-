import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "../../stores/authStore"
import { logout } from "../../services/authService"
import { toast } from "react-hot-toast"

const TopBar = ({ title, subtitle, candidateName }) => {
  const navigate       = useNavigate()
  const { user, darkMode, toggleDarkMode, clearAuth } = useAuthStore()
  const [scrolled, setScrolled]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const profileRef = useRef(null)
  const notifRef   = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    clearAuth()
    toast.success("Logged out")
    navigate("/login")
  }

  const initials = user?.email?.slice(0,2).toUpperCase() ?? "RC"

  return (
    <>
      <style>{`
        .topbar { position:sticky; top:0; z-index:40; padding:14px 0; margin-bottom:24px; transition:all 0.3s; }
        .topbar.scrolled { background:rgba(248,250,252,0.88); backdrop-filter:blur(14px); border-bottom:1px solid #f1f5f9; }
        .dark .topbar.scrolled { background:rgba(10,15,30,0.9); border-bottom-color:#1f2937; }
        .tb-icon { width:36px; height:36px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748b; transition:all 0.15s; position:relative; }
        .dark .tb-icon { background:#111827; border-color:#1f2937; color:#94a3b8; }
        .tb-icon:hover { background:#f8fafc; color:#0f172a; transform:scale(1.04); }
        .dark .tb-icon:hover { background:#1f2937; color:#f1f5f9; }
        .avatar-btn { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#2563EB,#6366f1); display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:transform 0.15s; }
        .avatar-btn:hover { transform:scale(1.05); }
        .dropdown { position:absolute; top:calc(100% + 10px); right:0; background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:6px; min-width:200px; box-shadow:0 8px 28px rgba(0,0,0,0.1); z-index:100; animation:scaleIn 0.15s ease; }
        .dark .dropdown { background:#111827; border-color:#1f2937; box-shadow:0 8px 28px rgba(0,0,0,0.4); }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .dd-item { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:9px; font-size:13px; color:#374151; cursor:pointer; transition:background 0.15s; white-space:nowrap; font-family:'Inter',sans-serif; background:none; border:none; width:100%; text-align:left; }
        .dark .dd-item { color:#d1d5db; }
        .dd-item:hover { background:#f8fafc; }
        .dark .dd-item:hover { background:#1f2937; }
        .dd-item.danger { color:#ef4444; }
        .dd-item.danger:hover { background:#fef2f2; }
        .dark .dd-item.danger:hover { background:rgba(239,68,68,0.08); }
        .dd-sep { height:1px; background:#f1f5f9; margin:4px 0; }
        .dark .dd-sep { background:#1f2937; }
        .analyzing-pill { display:inline-flex; align-items:center; gap:7px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:100px; padding:5px 14px; font-size:12px; font-weight:500; color:#2563EB; }
        .dark .analyzing-pill { background:rgba(37,99,235,0.1); border-color:rgba(37,99,235,0.25); color:#60a5fa; }
        .pulse-dot { width:7px; height:7px; border-radius:50%; background:#2563EB; animation:pulse 1.5s infinite; }
        .dark .pulse-dot { background:#60a5fa; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
      `}</style>

      <div className={`topbar${scrolled ? " scrolled" : ""}`}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {}
          <div className="animate-fade-up">
            {scrolled && candidateName ? (
              <div className="analyzing-pill">
                <div className="pulse-dot"/>
                Analyzing: <strong>{candidateName}</strong>
              </div>
            ) : (
              <>
                <h1 style={{ fontSize:20, fontWeight:700, color:darkMode?"#f9fafb":"#0f172a", fontFamily:"Satoshi,Inter,sans-serif", letterSpacing:"-0.3px", lineHeight:1.2 }}>
                  {title}
                </h1>
                {subtitle && <p style={{ fontSize:13, color:darkMode?"#94a3b8":"#64748b", marginTop:2 }}>{subtitle}</p>}
              </>
            )}
          </div>

          {}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>

            {}
            <button className="tb-icon" onClick={toggleDarkMode} title="Toggle theme">
              {darkMode
                ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 3v1M12 20v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              }
            </button>

            {}
            <div style={{ position:"relative" }} ref={notifRef}>
              <button className="tb-icon" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                <div style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:"#ef4444", border:darkMode?"2px solid #111827":"2px solid white" }}/>
              </button>
              {notifOpen && (
                <div className="dropdown" style={{ minWidth:260 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"#94a3b8", padding:"6px 12px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Notifications</p>
                  <div className="dd-sep"/>
                  {[
                    { msg: "Resume analysis complete", time: "2 min ago", icon: "✓" },
                    { msg: "JD match score ready", time: "10 min ago", icon: "📊" },
                    { msg: "New feature: PDF export", time: "1 hr ago", icon: "🆕" },
                  ].map((n, i) => (
                    <div key={i} className="dd-item">
                      <span style={{ fontSize:16 }}>{n.icon}</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:500, color:darkMode?"#f9fafb":"#0f172a" }}>{n.msg}</p>
                        <p style={{ fontSize:11, color:"#94a3b8" }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {}
            <div style={{ position:"relative" }} ref={profileRef}>
              <button className="avatar-btn" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}>
                {initials}
              </button>
              {profileOpen && (
                <div className="dropdown">
                  <div style={{ padding:"8px 12px 10px" }}>
                    <p style={{ fontSize:13, fontWeight:600, color:darkMode?"#f9fafb":"#0f172a" }}>{user?.email ?? "User"}</p>
                    <p style={{ fontSize:11, color:"#94a3b8" }}>Free Plan</p>
                  </div>
                  <div className="dd-sep"/>
                  <button className="dd-item" onClick={() => { navigate("/dashboard/settings"); setProfileOpen(false) }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>
                    Settings
                  </button>
                  <button className="dd-item" onClick={toggleDarkMode}>
                    {darkMode
                      ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 3v1M12 20v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                      : <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    }
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                  <div className="dd-sep"/>
                  <button className="dd-item danger" onClick={handleLogout}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TopBar