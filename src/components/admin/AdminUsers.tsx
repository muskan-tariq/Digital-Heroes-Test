import { useEffect, useState } from 'react'
import { supabase, type Profile, type Score } from '../../lib/supabase'
import { Search, Loader, Edit3, Shield, X, Save, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editScores, setEditScores] = useState<Score[]>([])
  const [saving, setSaving] = useState(false)
  const [newScore, setNewScore] = useState({ date: format(new Date(), 'yyyy-MM-dd'), score: '' })
  const [msg, setMsg] = useState('')

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) console.error('AdminUsers fetch error:', error.message)
      setUsers(data ?? [])
    } catch (e) {
      console.error('AdminUsers error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    fetchUsers()
  }

  const openEdit = async (u: Profile) => {
    setEditUser({ ...u })
    const { data } = await supabase.from('scores').select('*').eq('user_id', u.id).order('date', { ascending: false })
    setEditScores(data ?? [])
    setMsg('')
  }

  const saveUserEdit = async () => {
    if (!editUser) return
    setSaving(true)
    await supabase.from('profiles').update({
      sub_status: editUser.sub_status,
      sub_renewal_date: editUser.sub_renewal_date,
      charity_percentage: editUser.charity_percentage,
    }).eq('id', editUser.id)
    setSaving(false)
    setMsg('User saved!')
    fetchUsers()
    setTimeout(() => setMsg(''), 3000)
  }

  const deleteScore = async (scoreId: string) => {
    if (!editUser) return
    await supabase.from('scores').delete().eq('id', scoreId)
    const { data } = await supabase.from('scores').select('*').eq('user_id', editUser.id).order('date', { ascending: false })
    setEditScores(data ?? [])
  }

  const addScore = async () => {
    if (!editUser || !newScore.score) return
    const scoreNum = parseInt(newScore.score)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) return
    const dup = editScores.find(s => s.date === newScore.date)
    if (dup) { setMsg('Score already exists for this date'); return }
    await supabase.from('scores').insert({ user_id: editUser.id, date: newScore.date, score: scoreNum })
    if (editScores.length >= 5) {
      const oldest = [...editScores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
      await supabase.from('scores').delete().eq('id', oldest.id)
    }
    const { data } = await supabase.from('scores').select('*').eq('user_id', editUser.id).order('date', { ascending: false })
    setEditScores(data ?? [])
    setNewScore({ date: format(new Date(), 'yyyy-MM-dd'), score: '' })
  }

  const SUB_STATUSES = ['active', 'inactive', 'past_due', 'canceled']

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>View, edit subscriptions, and manage scores for all registered users.</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: '2.5rem' }}
            placeholder="Search users by email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Subscription</th>
                <th>Charity %</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><Loader className="animate-spin" size={24} style={{ margin: 'auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>No users found.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: u.role === 'admin' ? 'var(--gradient-gold)' : 'var(--gradient-primary)' }}>
                          {u.email[0].toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.email}</div>
                      </div>
                    </td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.sub_status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.sub_status}</span></td>
                    <td>{u.charity_percentage}%</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" title="Toggle Role" onClick={() => toggleRole(u.id, u.role)}><Shield size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Edit User" onClick={() => openEdit(u)}><Edit3 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600, width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 className="heading-sm">Edit User: {editUser.email}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(null); setMsg('') }}><X size={18} /></button>
            </div>

            {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>{msg}</div>}

            {/* Subscription Management */}
            <div style={{ marginBottom: 'var(--space-lg)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>Subscription</h3>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={editUser.sub_status}
                    onChange={e => setEditUser({ ...editUser, sub_status: e.target.value as any })}>
                    {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Renewal Date</label>
                  <input className="form-input" type="date"
                    value={editUser.sub_renewal_date ? editUser.sub_renewal_date.split('T')[0] : ''}
                    onChange={e => setEditUser({ ...editUser, sub_renewal_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Charity %</label>
                  <input className="form-input" type="number" min={10} max={100}
                    value={editUser.charity_percentage}
                    onChange={e => setEditUser({ ...editUser, charity_percentage: parseInt(e.target.value) || 10 })} />
                </div>
              </div>
              <button onClick={saveUserEdit} disabled={saving} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                {saving ? <><Loader size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>

            {/* Score Management */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Golf Scores ({editScores.length}/5)
                </h3>
              </div>

              {/* Add Score */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Date</label>
                  <input className="form-input" type="date" style={{ padding: '8px 10px' }}
                    value={newScore.date} onChange={e => setNewScore({ ...newScore, date: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Score (1-45)</label>
                  <input className="form-input" type="number" min={1} max={45} placeholder="e.g. 32" style={{ padding: '8px 10px' }}
                    value={newScore.score} onChange={e => setNewScore({ ...newScore, score: e.target.value })} />
                </div>
                <button onClick={addScore} className="btn btn-primary btn-sm" style={{ height: 40 }}><Plus size={14} /></button>
              </div>

              {/* Score List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editScores.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No scores yet</p>
                ) : (
                  editScores.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                      <div className="number-ball number-ball-primary" style={{ width: 34, height: 34, fontSize: '0.85rem', flexShrink: 0 }}>{s.score}</div>
                      <div style={{ flex: '1 1 100px', fontSize: '0.8rem', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{format(new Date(s.date + 'T00:00:00'), 'd MMM yyyy')}</div>
                      <button onClick={() => deleteScore(s.id)} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><Trash2 size={13} color="var(--color-accent)" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
