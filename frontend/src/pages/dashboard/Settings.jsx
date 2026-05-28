import { useState, useEffect } from "react"
import TopBar from "../../components/layout/TopBar"
import useAuthStore from "../../stores/authStore"
import { toast } from "react-hot-toast"
import api from "../../services/axiosInstance"

const PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID ?? "price_1TVzAH3fHxtbeM88UyD9L4vh"

export default function Settings() {
  const { user, darkMode, toggleDarkMode, clearAuth } = useAuthStore()
  const [notifications, setNotifications] = useState(true)
  const [autoMatch,     setAutoMatch]     = useState(false)
  const [weeklyReport,  setWeeklyReport]  = useState(false)
  const [profile,       setProfile]       = useState(null)
  const [loadingPlan,   setLoadingPlan]   = useState(true)
  const [upgrading,     setUpgrading]     = useState(false)
  const [isMobile,      setIsMobile]      = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  const dm = darkMode

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/payment/profile")
        setProfile(res.data.data)
        // Initialize toggles from profile
        setAutoMatch(res.data.data.auto_jd_match ?? false)
        setWeeklyReport(res.data.data.weekly_report ?? false)
      } catch (_) {
        setProfile({ subscription_status: "free" })
      } finally {
        setLoadingPlan(false)
      }
    }
    fetchProfile()

    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      toast.success("Welcome to Pro!")
      window.history.replaceState({}, "", "/dashboard/settings")
    }
    if (params.get("canceled") === "true") {
      toast.error("Payment canceled.")
      window.history.replaceState({}, "", "/dashboard/settings")
    }
  }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      console.log("Starting checkout with price:", PRO_PRICE_ID)
      const res = await api.post("/api/payment/create-checkout-session", { priceId: PRO_PRICE_ID })
      console.log("Stripe Session Response:", res.data)
      
      if (res.data.url) {
        window.location.href = res.data.url
      } else {
        throw new Error("No checkout URL received from server")
      }
    } catch (err) {
      console.error("Upgrade error:", err)
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to start checkout")
      setUpgrading(false)
    }
  }

  const isPro = profile?.subscription_status === "pro"

  const showUpgradePrompt = () => {
    toast((t) => (
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <p style={{ margin:0, fontSize:14, fontWeight:600 }}>⚡ Pro Feature</p>
        <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Upgrade to Pro to unlock this feature and more!</p>
        <button 
          onClick={() => { toast.dismiss(t.id); handleUpgrade(); }}
          style={{ background:"#2563EB", color:"white", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", alignSelf:"flex-end" }}
        >
          Upgrade Now
        </button>
      </div>
    ), { duration: 6000, position: "top-center" });
  }

  const handleTogglePreference = async (key, value) => {
    if (!isPro && (key === "auto_jd_match" || key === "weekly_report")) {
      showUpgradePrompt()
      return
    }
    try {
      if (key === "auto_jd_match") setAutoMatch(value)
      if (key === "weekly_report") setWeeklyReport(value)
      
      await api.patch("/api/payment/profile", { [key]: value })
      toast.success("Preference updated")
    } catch (err) {
      toast.error("Failed to update preference")
      // Revert local state on error
      if (key === "auto_jd_match") setAutoMatch(!value)
      if (key === "weekly_report") setWeeklyReport(!value)
    }
  }

  const Toggle = ({ value, onChange, isProFeature = false }) => (
    <div onClick={() => onChange(!value)}
      style={{ 
        width:44, height:24, borderRadius:12, 
        background:value?"#2563EB":dm?"#374151":"#e2e8f0", 
        cursor:"pointer", position:"relative", transition:"background 0.2s", 
        flexShrink:0, 
        opacity: (isProFeature && !isPro) ? 0.6 : 1 
      }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"white", position:"absolute", top:3, left:value?23:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}/>
    </div>
  )

  const SettingRow = ({ label, desc, value, onChange, isProFeature, badge }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0", borderBottom:`1px solid ${dm?"#1f2937":"#f8fafc"}` }}>
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <p style={{ fontSize:14, fontWeight:500, color:dm?"#f9fafb":"#0f172a" }}>{label}</p>
          {badge && <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:100, background:"#eff6ff", color:"#2563EB", border:"1px solid #bfdbfe" }}>{badge}</span>}
        </div>
        <p style={{ fontSize:13, color:"#94a3b8" }}>{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} isProFeature={isProFeature} />
    </div>
  )

  return (
    <div>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      <div style={{ maxWidth:640, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Profile Card */}
        <div style={{ background:dm?"#111827":"white", border:`1px solid ${dm?"#1f2937":"#f1f5f9"}`, borderRadius:16, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:20 }}>Profile</p>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg,#2563EB,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:20, fontWeight:700 }}>
              {user?.email?.slice(0,2).toUpperCase()??"RC"}
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:600, color:dm?"#f9fafb":"#0f172a", marginBottom:4 }}>{user?.email??"User"}</p>
              <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:100, background:isPro?"rgba(16,185,129,.12)":"#eff6ff", color:isPro?"#059669":"#2563EB", border:`1px solid ${isPro?"#bbf7d0":"#bfdbfe"}` }}>
                {loadingPlan?"...":isPro?"✓ Pro Plan":"Free Plan"}
              </span>
            </div>
          </div>

          <div style={{ background:dm?"#0d1117":"#f8fafc", borderRadius:12, padding:"16px 20px" }}>
            {isPro ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:13, color:"#94a3b8", marginBottom:4 }}>Current Plan</p>
                  <p style={{ fontSize:15, fontWeight:600, color:"#059669" }}>✓ RemCheck Pro</p>
                  <p style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Unlimited analyses, priority AI</p>
                </div>
                <span style={{ fontSize:12, padding:"6px 14px", borderRadius:8, background:"#f0fdf4", color:"#059669", border:"1px solid #bbf7d0", fontWeight:600 }}>Active</span>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div>
                    <p style={{ fontSize:13, color:"#94a3b8", marginBottom:2 }}>Current Plan</p>
                    <p style={{ fontSize:14, fontWeight:600, color:dm?"#f9fafb":"#0f172a" }}>Free — {profile?.usage_count ?? 0}/{profile?.monthly_limit ?? 5} analyses used</p>
                    <div style={{ width:160, height:4, background:dm?"#1f2937":"#e2e8f0", borderRadius:2, marginTop:6, overflow:"hidden" }}>
                      <div style={{ width:`${((profile?.usage_count??0)/(profile?.monthly_limit??5))*100}%`, height:"100%", background:"#2563EB" }}/>
                    </div>
                  </div>
                  <button onClick={handleUpgrade} disabled={upgrading}
                    style={{ padding:"9px 20px", borderRadius:10, border:"none", background:upgrading?"#94a3b8":"linear-gradient(135deg,#2563EB,#6366f1)", color:"white", fontSize:13, fontWeight:600, cursor:upgrading?"not-allowed":"pointer", fontFamily:"'Exo 2',sans-serif", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 14px rgba(37,99,235,.3)" }}>
                    {upgrading?"Redirecting...":"⚡ Upgrade to Pro"}
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    {f:"5 analyses/month",pro:false},{f:"Unlimited analyses",pro:true},
                    {f:"Basic interview prep",pro:false},{f:"Advanced AI insights",pro:true},
                    {f:"Manual JD matching",pro:false},{f:"Priority processing",pro:true},
                  ].map(item=>(
                    <div key={item.f} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:item.pro?"#059669":"#94a3b8" }}>{item.pro?"✓":"–"}</span>
                      <span style={{ fontSize:12, color:item.pro?(dm?"#d1d5db":"#374151"):"#94a3b8" }}>{item.f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div style={{ background:dm?"#111827":"white", border:`1px solid ${dm?"#1f2937":"#f1f5f9"}`, borderRadius:16, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Preferences</p>
          <SettingRow label="Dark Mode" desc="Switch to dark theme" value={darkMode} onChange={toggleDarkMode}/>
          <SettingRow label="Email Notifications" desc="Receive analysis results via email" value={notifications} onChange={setNotifications}/>
          <SettingRow label="Auto JD Match" desc="Automatically match resume after upload" value={autoMatch} onChange={(v) => handleTogglePreference("auto_jd_match", v)} badge="Pro" isProFeature/>
          <SettingRow label="Weekly Report" desc="Weekly summary of your analyses" value={weeklyReport} onChange={(v) => handleTogglePreference("weekly_report", v)} badge="Pro" isProFeature/>
        </div>

        {/* Danger Zone */}
        <div style={{ background:"#fff5f5", border:"1px solid #fecaca", borderRadius:16, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:600, color:"#dc2626", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>Danger Zone</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontSize:14, fontWeight:500, color:"#0f172a", marginBottom:2 }}>Sign Out</p>
              <p style={{ fontSize:13, color:"#94a3b8" }}>Sign out from your account</p>
            </div>
            <button onClick={()=>{clearAuth();window.location.href="/login"}}
              style={{ padding:"8px 18px", borderRadius:8, border:"1px solid #fecaca", background:"white", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
