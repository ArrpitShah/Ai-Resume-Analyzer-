import { useEffect } from "react"
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Login          from "./pages/auth/Login"
import Signup         from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword  from "./pages/auth/ResetPassword"
import Dashboard      from "./pages/dashboard/Dashboard"
import Overview       from "./pages/dashboard/Overview"
import ResumeUpload   from "./pages/dashboard/ResumeUpload"
import JDMatch        from "./pages/dashboard/JDMatch"
import CoverLetter    from "./pages/dashboard/CoverLetter"
import AllAnalyses    from "./pages/dashboard/AllAnalyses"
import AnalysisDetail from "./pages/dashboard/AnalysisDetail"
import Settings       from "./pages/dashboard/Settings"
import AdminDashboard   from "./pages/admin/AdminDashboard"
import NotFound       from "./pages/NotFound"
import ErrorBoundary  from "./components/ui/ErrorBoundary"
import useAuthStore   from "./stores/authStore"
import { supabase }   from "./lib/supabaseClient"


const Guard = () => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  { path: "/",                element: <Navigate to="/dashboard" replace /> },
  { path: "/login",           element: <Login /> },
  { path: "/signup",          element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password",  element: <ResetPassword /> },
  {
    path: "/dashboard",
    element: <Guard />,
    children: [
      {
        element: <Dashboard />,
        children: [
          { index: true,          element: <Overview /> },
          { path: "upload",       element: <ResumeUpload /> },
          { path: "jd-match",     element: <JDMatch /> },
          { path: "cover-letter", element: <CoverLetter /> },
          { path: "analyses",     element: <AllAnalyses /> },
          { path: "analysis/:id", element: <AnalysisDetail /> },
          { path: "settings",     element: <Settings /> },
          { path: "admin",        element: <AdminDashboard /> },
        ]
      }
    ]
  },
  { path: "*", element: <NotFound /> }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
})

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
    <ErrorBoundary>
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
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}