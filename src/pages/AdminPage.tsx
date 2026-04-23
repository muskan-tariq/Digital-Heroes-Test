import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Heart, Users, ShieldCheck, LayoutDashboard, Menu, X, LogOut, ChevronRight, BarChart2 } from 'lucide-react'
import NotificationBell from '../components/common/NotificationBell'

// Admin Sub-pages
import AdminUsers from '../components/admin/AdminUsers'
import AdminDraws from '../components/admin/AdminDraws'
import AdminCharities from '../components/admin/AdminCharities'
import AdminWinners from '../components/admin/AdminWinners'
import AdminAnalytics from '../components/admin/AdminAnalytics'

interface AdminPageProps {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

const ADMIN_NAV = [
  { path: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { path: '/admin/draws', label: 'Draw Engine', icon: <span style={{ fontSize: '1rem' }}>🎲</span> },
  { path: '/admin/charities', label: 'Charities', icon: <Heart size={18} /> },
  { path: '/admin/winners', label: 'Winners', icon: <ShieldCheck size={18} /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
]

export default function AdminPage({ sidebarOpen, setSidebarOpen }: AdminPageProps) {
  const { profile, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = profile?.email?.slice(0, 2).toUpperCase() ?? 'AD'

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffd700)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="white" />
            </span>
            Admin Panel
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Management</div>
          {ADMIN_NAV.map(item => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                {item.icon}
                {item.label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </Link>
            )
          })}
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-lg)' }}>Player View</div>
          <Link to="/dashboard" className="sidebar-nav-item" onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} /> My Dashboard
          </Link>
        </nav>

        <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-sm)' }}>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffd700)' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: 2 }}>Admin</span>
            </div>
            <button onClick={handleSignOut} title="Sign out"
              style={{ background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-gold">🛡 Admin Mode</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffd700)' }}>{initials}</div>
          </div>
        </header>

        <main className="page-content" style={{ background: 'var(--gradient-hero)' }}>
          <Routes>
            <Route path="/" element={<AdminUsers />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/draws" element={<AdminDraws />} />
            <Route path="/charities" element={<AdminCharities />} />
            <Route path="/winners" element={<AdminWinners />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
