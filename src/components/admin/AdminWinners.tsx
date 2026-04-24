import { useEffect, useState } from 'react'
import { supabase, type Verification, type Profile, type Draw } from '../../lib/supabase'
import { Loader, CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminWinners() {
  const [verifications, setVerifications] = useState<(Verification & { profile?: Profile; draw?: Draw })[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase.from('verifications')
        .select('*, profiles(*), draws(*)')
        .order('created_at', { ascending: false })
      if (error) console.error('AdminWinners fetch error:', error.message)
      setVerifications(data as any ?? [])
    } catch (e) {
      console.error('AdminWinners error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const { error } = await supabase.from('verifications').update({ status }).eq('id', id)
    if (!error) {
      await fetchVerifications()
    }
    setUpdating(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this verification record?')) return
    setUpdating(id)
    const { error } = await supabase.from('verifications').delete().eq('id', id)
    if (!error) {
      await fetchVerifications()
    }
    setUpdating(null)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Winner Verifications</h1>
        <p>Review submitted proof of winnings and manage payout states.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User / Draw</th>
                <th>Proof</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <Loader className="animate-spin" size={24} style={{ margin: 'auto' }} />
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                    No winner submissions yet.
                  </td>
                </tr>
              ) : (
                verifications.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{(v as any).profiles?.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)' }}>
                          Draw: {(v as any).draws?.month}
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={v.proof_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                        <ImageIcon size={14} /> View Proof <ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{format(new Date(v.created_at), 'd MMM yyyy')}</td>
                    <td>
                      <span className={`badge ${
                        v.status === 'approved' ? 'badge-green' : 
                        v.status === 'pending' ? 'badge-primary' : 
                        v.status === 'paid' ? 'badge-gold' : 'badge-red'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {v.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(v.id, 'approved')} 
                              disabled={!!updating}
                              className="btn btn-green btn-sm" title="Approve">
                                {updating === v.id ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                            </button>
                            <button 
                              onClick={() => updateStatus(v.id, 'rejected')} 
                              disabled={!!updating}
                              className="btn btn-danger btn-sm" title="Reject">
                                <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {v.status === 'approved' && (
                          <button 
                            onClick={() => updateStatus(v.id, 'paid')} 
                            disabled={!!updating}
                            className="btn btn-primary btn-sm" style={{ background: 'var(--gradient-gold)', borderColor: 'var(--color-gold)' }}>
                              Mark as Paid
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(v.id)}
                          disabled={!!updating}
                          className="btn btn-ghost btn-sm" title="Delete Record">
                          <Trash2 size={14} color="var(--color-accent)" />
                        </button>
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
