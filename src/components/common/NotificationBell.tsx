import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, Trophy, Zap, CreditCard, Info } from 'lucide-react'
import { useNotificationStore, type AppNotification } from '../../store/notificationStore'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICONS = {
  draw: <Zap size={14} color="var(--color-gold)" />,
  winner: <Trophy size={14} color="var(--color-secondary)" />,
  subscription: <CreditCard size={14} color="var(--color-primary-light)" />,
  system: <Info size={14} color="var(--color-text-muted)" />,
}

const TYPE_COLORS = {
  draw: 'rgba(255,215,0,0.08)',
  winner: 'rgba(0,229,160,0.08)',
  subscription: 'rgba(101,88,245,0.08)',
  system: 'rgba(255,255,255,0.03)',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore()
  const ref = useRef<HTMLDivElement>(null)
  const count = unreadCount()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-ghost btn-sm"
        style={{ position: 'relative', padding: '8px' }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--color-accent)',
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, maxHeight: 480, overflowY: 'auto',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 999,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications {count > 0 && <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: '0.65rem' }}>{count} new</span>}</div>
            {count > 0 && (
              <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', gap: 4 }}>
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n: AppNotification) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: n.read ? 'transparent' : TYPE_COLORS[n.type],
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {TYPE_ICONS[n.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.85rem', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
