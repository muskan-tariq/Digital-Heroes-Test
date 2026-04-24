import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Heart, LayoutDashboard, Target, Users, Menu, X, LogOut, ChevronRight } from 'lucide-react'
import NotificationBell from '../components/common/NotificationBell'

// Sub-pages
import UserOverview from '../components/dashboard/UserOverview'
import ScoreEntry from '../components/dashboard/ScoreEntry'
import DrawResults from '../components/dashboard/DrawResults'
import UserCharityPanel from '../components/dashboard/UserCharityPanel'
import UserWinnings from '../components/dashboard/UserWinnings'

interface DashboardPageProps {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/dashboard/scores', label: 'My Scores', icon: <Target size={18} /> },
  { path: '/dashboard/draws', label: 'Draw Results', icon: <span style={{ fontSize: '1rem' }}>🎲</span> },
  { path: '/dashboard/charity', label: 'My Charity', icon: <Heart size={18} /> },
  { path: '/dashboard/winnings', label: 'Winnings', icon: <span style={{ fontSize: '1rem' }}>🏆</span> },
]

export default function DashboardPage({ sidebarOpen, setSidebarOpen }: DashboardPageProps) {
  const { profile, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = profile?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <div className="app-layout">
      {/* Sidebar Overlay Mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            <span style={{ background: 'var(--gradient-primary)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} color="white" fill="white" />
            </span>
            Digital Heroes
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Player Menu</div>
          {NAV_ITEMS.map(item => {
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

        </nav>

        <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-sm)' }}>
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span className={`badge ${profile?.sub_status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {profile?.sub_status ?? 'inactive'}
                </span>
              </div>
            </div>
            <button onClick={handleSignOut} title="Sign out"
              style={{ background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="hide-mobile" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {profile?.sub_status !== 'active' && (
              <span className="badge badge-red" style={{ marginRight: 12 }}>⚠️ Subscription Inactive</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <div className="avatar">{initials}</div>
          </div>
        </header>

        <main className="page-content" style={{ background: 'var(--gradient-hero)' }}>
          {profile?.sub_status !== 'active' && (
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-xl)' }}>
              ⚠️ Your subscription is not active. &nbsp;
              <Link to="/subscribe" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Subscribe now</Link> to unlock all features.
            </div>
          )}
          <Routes>
            <Route path="/" element={<UserOverview />} />
            <Route path="/scores" element={<ScoreEntry />} />
            <Route path="/draws" element={<DrawResults />} />
            <Route path="/charity" element={<UserCharityPanel />} />
            <Route path="/winnings" element={<UserWinnings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
