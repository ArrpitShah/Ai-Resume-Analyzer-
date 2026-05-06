import { useState, useEffect } from "react"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import { toast } from "react-hot-toast"

const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width:44, height:24, borderRadius:12,
    background: value ? "#2563EB" : "#94a3b8",
    cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0,
  }}>
    <div style={{
      width:18, height:18, borderRadius:"50%", background:"white",
      position:"absolute", top:3, left: value ? 23 : 3,
      transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)",
    }}/>
  </div>
)

export default function Settings() {
  const { user, darkMode, toggleDarkMode, updateProfile } = useAuthStore()
  const dm = darkMode

  const C = {
    card:    dm ? "#111827" : "#fff",
    border:  dm ? "#1f2937" : "#f1f5f9",
    text:    dm ? "#f9fafb" : "#0f172a",
    body:    dm ? "#d1d5db" : "#374151",
    muted:   "#94a3b8",
    subcard: dm ? "#1f2937" : "#f8fafc",
    rowBdr:  dm ? "#1f2937" : "#f8fafc",
    inputBg: dm ? "#1f2937" : "#f8fafc",
    inputBorder: dm ? "#374151" : "#e2e8f0",
  }

  const [notif,    setNotif]   = useState(true)
  const [autoMatch,setAM]      = useState(false)
  const [weeklyRep,setWR]      = useState(false)
  const [editOpen, setEditOpen]= useState(false)
  const [editName, setEditName]= useState(user?.name ?? "")
  const [editPhoto,setEditPhoto]= useState(user?.photo ?? "")
  const [saving,   setSaving]  = useState(false)

  // Effect to manage body scroll when modal opens/closes
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (editOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalStyle;
    }
    // Cleanup function to restore original style when component unmounts or editOpen changes
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [editOpen]); // Dependency array: re-run effect when editOpen changes

  const plans = [
    { name:"Free",       price:"$0",  features:["5 resumes/mo","Basic JD Match","Email support"],                   current:true  },
    { name:"Pro",        price:"$19", features:["Unlimited resumes","Advanced AI","Priority support","PDF export"],  current:false },
    { name:"Enterprise", price:"$49", features:["Team features","API access","Custom integrations","SLA"],           current:false },
  ]

  const handleSaveProfile = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    updateProfile({ name: editName.trim() || null, photo: editPhoto.trim() || null })
    toast.success("Profile updated!")
    setSaving(false)
    setEditOpen(false)
  }

  const initials = (user?.name ?? user?.email ?? "RC").slice(0,2).toUpperCase()

  const Row = ({ label, desc, value, onChange, disabled }) => (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"16px 0", borderBottom:`1px solid ${C.rowBdr}`,
    }}>
      <div>
        <p style={{ fontSize:14, fontWeight:500, color:C.text, marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:13, color:C.muted }}>{desc}</p>
      </div>
      <Toggle value={value} onChange={disabled ? () => toast("Coming soon!") : onChange}/>
    </div>
  )

  return (
    <div style={{ color:C.text }}>
      <style>{`
        .s-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; }
        .s-plan { border:2px solid ${C.border}; border-radius:16px; padding:22px; transition:all .2s; cursor:pointer; background:${C.card}; }
        .s-plan.active { border-color:#2563EB; background:${dm?"rgba(37,99,235,.08)":"#eff6ff"}; }
        .s-plan:hover:not(.active) { border-color:${dm?"#374151":"#cbd5e1"}; box-shadow:0 4px 16px rgba(0,0,0,.06); }
        .up-btn { padding:9px 20px; border-radius:10px; border:none; background:#2563EB; color:#fff; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:all .2s; }
        .up-btn:hover { background:#1d4ed8; transform:translateY(-1px); }
        .sec-title { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; margin-bottom:20px; }
        .edit-input {
          width:100%; padding:10px 14px; border-radius:10px;
          border:1px solid ${C.inputBorder}; background:${C.inputBg};
          color:${C.text}; font-size:14px; font-family:'Inter',sans-serif;
          outline:none; transition:border .2s;
        }
        .edit-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
        .edit-input::placeholder { color:#94a3b8; }
        .modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,.5);
          display:flex; align-items:center; justify-content:center;
          z-index:100; /* Padding removed from here */
        }
        .modal-box {
          background:${C.card}; border:1px solid ${C.border};
          border-radius:20px; padding:28px; width:100%; max-width:440px;
          max-height: calc(100vh - 48px); /* Added to set max height */
          overflow-y: auto; /* Added to enable vertical scrolling */
          box-shadow:0 20px 60px rgba(0,0,0,.2);
          animation:modalIn .2s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        .save-btn {
          padding:11px 24px; border-radius:11px; border:none;
          background:#2563EB; color:#fff; font-size:14px; font-weight:600;
          font-family:'Inter',sans-serif; cursor:pointer; transition:all .2s;
          display:inline-flex; align-items:center; gap:8px;
        }
        .save-btn:disabled { opacity:.55; cursor:not-allowed; }
        .save-btn:hover:not(:disabled) { background:#1d4ed8; }
        .cancel-btn {
          padding:11px 20px; border-radius:11px;
          border:1px solid ${C.border}; background:transparent;
          color:${C.body}; font-size:14px; font-weight:500;
          font-family:'Inter',sans-serif; cursor:pointer; transition:all .2s;
        }
        .cancel-btn:hover { background:${C.subcard}; }
        @keyframes sp{to{transform:rotate(360deg)}} .sp{animation:sp 1s linear infinite;}
        .avatar-ring {
          width:72px; height:72px; border-radius:20px;
          background:linear-gradient(135deg,#2563EB,#6366f1);
          display:flex; align-items:center; justify-content:center;
          font-size:24px; font-weight:700; color:#fff;
          font-family:'Satoshi,sans-serif'; overflow:hidden;
          flex-shrink:0;
        }
        .plan-name { font-size:15px; font-weight:700; color:${C.text}; font-family:'Satoshi,sans-serif'; }
        .plan-price { font-size:22px; font-weight:700; color:${C.text}; font-family:'Satoshi,sans-serif'; margin-bottom:12px; }
        .plan-feat { font-size:12px; color:${C.muted}; margin-bottom:5px; display:flex; align-items:center; gap:6px; }
        .danger-title { font-size:11px; font-weight:700; color:#dc2626; text-transform:uppercase; letter-spacing:.08em; margin-bottom:16px; }
        .danger-name { font-size:14px; font-weight:500; color:${C.text}; margin-bottom:2px; }
        .danger-desc { font-size:13px; color:#94a3b8; }
      `}</style>

      <TopBar title="Settings" subtitle="Manage your account, preferences, and billing"/>

      <div style={{ maxWidth:700, display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── Profile Card ── */}
        <div className="s-card" style={{ padding:24 }}>
          <p className="sec-title">Profile</p>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
            <div className="avatar-ring">
              {user?.photo
                ? <img src={user.photo} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : initials
              }
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:4 }}>
                {user?.name ?? user?.email?.split("@")[0] ?? "User"}
              </p>
              <p style={{ fontSize:13, color:C.muted, marginBottom:8 }}>{user?.email}</p>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:dm?"rgba(37,99,235,.15)":"#eff6ff", border:"1px solid #bfdbfe" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#2563EB" }}>FREE PLAN</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setEditName(user?.name ?? ""); setEditPhoto(user?.photo ?? ""); setEditOpen(true) }}
            style={{ padding:"9px 18px", borderRadius:10, border:`1px solid ${C.border}`, background:C.subcard, color:C.body, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"Inter,sans-serif", transition:"all .15s" }}>
            ✏️ Edit Profile
          </button>
        </div>

        {/* ── Billing ── */}
        <div className="s-card" style={{ padding:24 }}>
          <p className="sec-title">Billing & Plans</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {plans.map((p) => (
              <div key={p.name} className={`s-plan${p.current?" active":""}`}
                onClick={() => !p.current && toast(`${p.name} plan coming soon! 🚀`)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <p className="plan-name">{p.name}</p>
                  {p.current && (
                    <span style={{ fontSize:10, fontWeight:700, color:"#2563EB", background:dm?"rgba(37,99,235,.2)":"#eff6ff", border:"1px solid #bfdbfe", borderRadius:100, padding:"2px 8px" }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="plan-price">
                  {p.price}<span style={{ fontSize:13, color:C.muted, fontWeight:400 }}>/mo</span>
                </p>
                {p.features.map((f,i) => (
                  <p key={i} className="plan-feat">
                    <span style={{ color:"#10b981" }}>✓</span>{f}
                  </p>
                ))}
                {!p.current && (
                  <button className="up-btn" style={{ marginTop:14, width:"100%", padding:"9px" }}
                    onClick={(e) => { e.stopPropagation(); toast(`Upgrade to ${p.name} — coming soon!`) }}>
                    Upgrade
                  </button>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:C.muted }}>💳 Secure payments via Stripe — coming soon</p>
        </div>

        {/* ── Preferences ── */}
        <div className="s-card" style={{ padding:24 }}>
          <p className="sec-title">Preferences</p>
          <Row label="Dark Mode"           desc="Enable dark theme across the app"    value={darkMode}  onChange={toggleDarkMode}/>
          <Row label="Email Notifications" desc="Receive analysis results via email"  value={notif}     onChange={setNotif}/>
          <Row label="Auto JD Match"       desc="Auto-match after resume upload"       value={autoMatch} onChange={setAM} disabled/>
          <Row label="Weekly Report"       desc="Get weekly analysis summary email"   value={weeklyRep} onChange={setWR} disabled/>
        </div>

        {/* ── Danger Zone ── */}
        <div style={{ background: dm?"rgba(239,68,68,.05)":"#fff5f5", border:"1px solid #fecaca", borderRadius:16, padding:24 }}>
          <p className="danger-title">Danger Zone</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p className="danger-name">Delete Account</p>
              <p className="danger-desc">Permanently delete your account and all data</p>
            </div>
            <button
              style={{ padding:"8px 18px", borderRadius:9, border:"1px solid #fecaca", background: dm?"rgba(239,68,68,.1)":"white", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}
              onClick={() => toast.error("Account deletion — coming soon")}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h3 style={{ fontSize:18, fontWeight:700, fontFamily:"Satoshi,Inter,sans-serif", color:C.text }}>
                Edit Profile
              </h3>
              <button onClick={() => setEditOpen(false)}
                style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.subcard, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Avatar preview */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
              <div className="avatar-ring">
                {editPhoto
                  ? <img src={editPhoto} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"}/>
                  : (editName || user?.email || "RC").slice(0,2).toUpperCase()
                }
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>
                  {editName || user?.email?.split("@")[0] || "Your Name"}
                </p>
                <p style={{ fontSize:12, color:C.muted }}>Preview of your profile</p>
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:C.body, marginBottom:6 }}>
                Display Name
              </label>
              <input
                className="edit-input"
                placeholder="Enter your full name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>

            {/* Photo URL */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:C.body, marginBottom:6 }}>
                Profile Photo URL
              </label>
              <input
                className="edit-input"
                placeholder="https://example.com/photo.jpg"
                value={editPhoto}
                onChange={e => setEditPhoto(e.target.value)}
              />
              <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                Paste any image URL — Google profile photo, LinkedIn photo, etc.
              </p>
            </div>

            {/* Email (readonly) */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:C.body, marginBottom:6 }}>
                Email Address <span style={{ color:C.muted, fontWeight:400 }}>(cannot change)</span>
              </label>
              <input
                className="edit-input"
                value={user?.email ?? ""}
                disabled
                style={{ opacity:.6, cursor:"not-allowed" }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="cancel-btn" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                {saving
                  ? <><svg className="sp" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="4" strokeLinecap="round"/></svg>Saving...</>
                  : "Save Changes"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}