import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Login          from "./pages/auth/Login"
import Signup         from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword  from "./pages/auth/ResetPassword"
import Dashboard      from "./pages/dashboard/Dashboard"
import Overview       from "./pages/dashboard/Overview"
import ResumeUpload   from "./pages/dashboard/ResumeUpload"
import JDMatch        from "./pages/dashboard/JDMatch"
import AllAnalyses    from "./pages/dashboard/AllAnalyses"
import AnalysisDetail from "./pages/dashboard/AnalysisDetail"
import Settings       from "./pages/dashboard/Settings"
import useAuthStore   from "./stores/authStore"
import { supabase }   from "./lib/supabaseClient"


const Guard = ({ children }) => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { setAuth, isAuth } = useAuthStore()

  useEffect(() => {
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isAuth) {
        setAuth(
          { user_id: session.user.id, email: session.user.email },
          session.access_token
        )
      }
    })

   
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          setAuth(
            { user_id: session.user.id, email: session.user.email },
            session.access_token
          )
        }
        if (event === "SIGNED_OUT") {
          useAuthStore.getState().clearAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "white",
            color: "#0f172a",
            border: "1px solid #f1f5f9",
            borderRadius: 12,
            fontSize: 14,
            fontFamily: "'Exo 2', 'Inter', sans-serif",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary:"#10b981", secondary:"white" } },
          error:   { iconTheme: { primary:"#ef4444", secondary:"white" } },
        }}
      />
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>}>
          <Route index               element={<Overview />} />
          <Route path="upload"       element={<ResumeUpload />} />
          <Route path="jd-match"     element={<JDMatch />} />
          <Route path="analyses"     element={<AllAnalyses />} />
          <Route path="analysis/:id" element={<AnalysisDetail />} />
          <Route path="settings"     element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}