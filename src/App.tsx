import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import './index.css'

// Pages
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import CharitiesPage from './pages/CharitiesPage'
import SubscribePage from './pages/SubscribePage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { setUser, setProfile, fetchProfile, setLoading, profile, user, loading } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Safety timeout: never stay stuck loading for more than 3 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          // Race fetchProfile against a 2-second timeout
          await Promise.race([
            fetchProfile(session.user.id),
            new Promise(resolve => setTimeout(resolve, 2000))
          ])
        }
      } catch (e) {
        console.error('Init error:', e)
      } finally {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser(session.user)
          await Promise.race([
            fetchProfile(session.user.id),
            new Promise(resolve => setTimeout(resolve, 2000))
          ])
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (e) {
        console.error('Auth change error:', e)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'
  const isActive = profile?.sub_status === 'active'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/auth" element={!user ? <AuthPage /> : (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)} />
        <Route path="/subscribe" element={
          user ? (isActive ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <SubscribePage />) : <Navigate to="/auth" />
        } />
        <Route path="/dashboard/*" element={
          user ? (isAdmin ? <Navigate to="/admin" /> : <DashboardPage sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />)
            : <Navigate to="/auth" />
        } />
        <Route path="/admin/*" element={
          isAdmin ? <AdminPage sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            : <Navigate to="/dashboard" />
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
