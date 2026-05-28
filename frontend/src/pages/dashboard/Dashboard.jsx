import { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import Sidebar from "../../components/layout/Sidebar"
import useAuthStore from "../../stores/authStore"

const Dashboard = () => {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const darkMode  = useAuthStore((s) => s.darkMode)
  const navigate  = useNavigate()

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark")
    else          document.documentElement.classList.remove("dark")
  }, [darkMode])

  useEffect(() => {
    const onResize = () => { 
      if (window.innerWidth < 768) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [navigate])

  return (
    <div style={{ background: darkMode ? "#0A0F1E" : "#F8FAFC", minHeight:"100vh", position:"relative", overflowX:"hidden" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap'); 
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); 
        *{box-sizing:border-box;}
        
        .main-content {
          margin-left: 0;
          padding: 0 16px 48px;
          transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
          min-height: 100vh;
        }

        @media (min-width: 768px) {
          .main-content {
            margin-left: ${collapsed ? "72px" : "256px"};
            padding: 0 32px 48px;
          }
        }

        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 45;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .mobile-overlay.show {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

      <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />

      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <main className="main-content">
        <div className="page-enter" style={{ maxWidth:1200, margin:"0 auto" }}>
          <Outlet context={{ setMobileOpen }} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard