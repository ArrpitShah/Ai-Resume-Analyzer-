import { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import Sidebar from "../../components/layout/Sidebar"
import useAuthStore from "../../stores/authStore"

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false)
  const darkMode  = useAuthStore((s) => s.darkMode)
  const navigate  = useNavigate()

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark")
    else          document.documentElement.classList.remove("dark")
  }, [darkMode])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 1024) setCollapsed(true) }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const ml = collapsed ? 72 : 256

  return (
    <div style={{ background: darkMode ? "#0A0F1E" : "#F8FAFC", minHeight:"100vh" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap'); @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{ marginLeft:ml, minHeight:"100vh", padding:"0 32px 48px", transition:"margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <div className="page-enter" style={{ maxWidth:1200 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Dashboard