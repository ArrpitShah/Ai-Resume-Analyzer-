import { NavLink, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { logout } from "../../services/authService"
import useAuthStore from "../../stores/authStore"

const NAV = [
  { to:"/dashboard",          end:true,  label:"Overview",      icon:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { to:"/dashboard/upload",   end:false, label:"Upload Resume", icon:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { to:"/dashboard/jd-match", end:false, label:"JD Match",      icon:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { to:"/dashboard/analyses", end:false, label:"All Analyses",  icon:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { to:"/dashboard/settings", end:false, label:"Settings",      icon:<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> },
]

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate  = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user      = useAuthStore((s) => s.user)
  const darkMode  = useAuthStore((s) => s.darkMode)
  const w = collapsed ? 72 : 256

  const dm = darkMode
  const bg     = dm ? "#111827" : "#ffffff"
  const border = dm ? "#1f2937" : "#f1f5f9"
  const text   = dm ? "#f9fafb" : "#0f172a"  

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    clearAuth()
    toast.success("Logged out")
    navigate("/login")
  }

  return (
    <>
      <style>{`
        .sb {
          width:${w}px; min-height:100vh;
          background:${bg};
          border-right:1px solid ${border};
          display:flex; flex-direction:column;
          padding:18px 10px; position:fixed;
          top:0; left:0; z-index:50;
          transition:width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow:hidden;
        }
        .ni {
          display:flex; align-items:center; gap:11px;
          padding:9px 12px; border-radius:10px;
          color:${dm?"#94a3b8":"#64748b"};
          text-decoration:none; font-size:13.5px; font-weight:500;
          transition:all 0.15s; margin-bottom:2px;
          white-space:nowrap; position:relative;
        }
        .ni:hover {
          background:${dm?"#1f2937":"#f8fafc"};
          color:${dm?"#f1f5f9":"#0f172a"};
        }
        .ni.on {
          background:${dm?"rgba(37,99,235,.15)":"#eff6ff"};
          color:${dm?"#60a5fa":"#2563EB"};
        }
        .ni.on::before {
          content:''; position:absolute; left:0; top:22%; bottom:22%;
          width:3px;
          background:${dm?"#60a5fa":"#2563EB"};
          border-radius:0 3px 3px 0;
        }
        .nl {
          opacity:${collapsed?0:1};
          transition:opacity 0.2s;
          pointer-events:${collapsed?"none":"auto"};
        }
        .tip {
          position:absolute; left:calc(100% + 10px); top:50%;
          transform:translateY(-50%);
          background:${dm?"#1f2937":"#0f172a"};
          color:#fff; padding:5px 10px; border-radius:8px;
          font-size:12px; white-space:nowrap;
          pointer-events:none; opacity:0;
          transition:opacity 0.15s; z-index:100;
          border:${dm?"1px solid #374151":"none"};
        }
        .ni:hover .tip { opacity:${collapsed?1:0}; }
        .cb {
          width:30px; height:30px; border-radius:8px;
          background:${dm?"#1f2937":"#f8fafc"};
          border:1px solid ${dm?"#374151":"#e2e8f0"};
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:${dm?"#94a3b8":"#64748b"}; transition:all 0.15s; flex-shrink:0;
        }
        .cb:hover {
          background:${dm?"#374151":"#f1f5f9"};
          color:${dm?"#f1f5f9":"#0f172a"};
        }
        .lb {
          display:flex; align-items:center; gap:11px;
          padding:9px 12px; border-radius:10px;
          color:#ef4444; background:none; border:none;
          cursor:pointer; font-size:13.5px; font-weight:500;
          font-family:'Inter',sans-serif; width:100%;
          transition:all 0.15s; white-space:nowrap;
        }
        .lb:hover {
          background:${dm?"rgba(239,68,68,.08)":"#fef2f2"};
        }
        .sb-divider {
          height:1px;
          background:${dm?"#1f2937":"#f1f5f9"};
          margin-bottom:14px; padding-top:14px;
          border:none;
        }
        .sb-email {
          font-size:13px; font-weight:500;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          max-width:180px;
          color:${dm?"#d1d5db":"#374151"};
        }
        .sb-signed {
          font-size:11px; color:#94a3b8; margin-bottom:2px;
        }
    
        .brand-rem   { color:${dm?"#f9fafb":"#0f172a"}; }
        .brand-check { color:#2563EB; }
      `}</style>

      <aside className="sb">

        {}
        <div style={{ display:"flex", alignItems:"center", justifyContent:collapsed?"center":"space-between", marginBottom:24, paddingLeft:collapsed?0:2 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#2563EB,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              {}
              <span style={{ fontSize:17, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", letterSpacing:"-0.3px" }}>
                <span className="brand-rem">Rem</span><span className="brand-check">Check</span>
              </span>
            </div>
          )}
          <button className="cb" onClick={()=>setCollapsed(!collapsed)}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
              style={{ transform:collapsed?"rotate(180deg)":"none", transition:"transform 0.3s" }}>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {}
        <nav style={{ flex:1 }}>
          {!collapsed && (
            <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, paddingLeft:12 }}>
              Main Menu
            </p>
          )}
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({isActive})=>`ni${isActive?" on":""}`}>
              <span style={{ flexShrink:0 }}>{n.icon}</span>
              <span className="nl">{n.label}</span>
              {collapsed && <span className="tip">{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {}
        <div>
          <div className="sb-divider"/>
          {!collapsed && (
            <div style={{ padding:"0 12px", marginBottom:10 }}>
              <p className="sb-signed">Signed in as</p>
              <p className="sb-email">{user?.email ?? "User"}</p>
            </div>
          )}
          <button className="lb" onClick={handleLogout}
            style={{ justifyContent:collapsed?"center":"flex-start" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="nl">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar