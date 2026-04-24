import { useNotificationStore } from '../../store/notificationStore'
import { Mail, User, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminEmails() {
  const { notifications } = useNotificationStore()
  const emails = notifications.filter(n => n.channels.includes('email'))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Email Distribution Log</h1>
        <p>Monitor all outgoing system emails, draw results, and winner alerts.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={18} color="var(--color-primary)" />
          <span style={{ fontWeight: 700 }}>Sent Emails Sandbox</span>
          <div className="badge badge-primary" style={{ marginLeft: 'auto' }}>{emails.length} Total Sent</div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Recipient / Date</th>
                <th>Subject</th>
                <th>Content Preview</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No emails sent yet.</div>
                  </td>
                </tr>
              ) : (
                emails.map(email => (
                  <tr key={email.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          <User size={14} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>System User</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {format(new Date(email.createdAt), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{email.title}</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ 
                        fontSize: '0.78rem', color: 'var(--color-text-secondary)', 
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                      }}>
                        {email.message}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-green" style={{ gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        Delivered
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
