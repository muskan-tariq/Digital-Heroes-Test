import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase, type Score } from '../../lib/supabase'
import { Plus, Trash2, Edit3, Loader, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { format } from 'date-fns'

const MAX_SCORES = 5

export default function ScoreEntry() {
  const { profile } = useAuthStore()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [score, setScore] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const fetchScores = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
    setScores(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchScores()
  }, [profile])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    const scoreNum = parseInt(score)

    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      showMsg('error', 'Score must be between 1 and 45.')
      return
    }

    setSaving(true)
    try {
      if (editId) {
        // Edit existing
        const { error } = await supabase.from('scores').update({ score: scoreNum }).eq('id', editId)
        if (error) throw error
        showMsg('success', 'Score updated!')
        setEditId(null)
      } else {
        // Check for duplicate date
        const dup = scores.find(s => s.date === date)
        if (dup) {
          showMsg('error', 'You already have a score for this date. Edit or delete it first.')
          setSaving(false)
          return
        }

        // Insert new
        const { error } = await supabase.from('scores').insert({
          user_id: profile.id,
          date,
          score: scoreNum,
        })
        if (error) throw error

        // Enforce rolling 5: if > MAX, delete oldest
        const allScores = [...scores]
        allScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        if (allScores.length >= MAX_SCORES) {
          const oldest = allScores[allScores.length - 1]
          await supabase.from('scores').delete().eq('id', oldest.id)
        }

        showMsg('success', 'Score added!')
      }

      setScore('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      await fetchScores()
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to save score.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this score entry?')) return
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (!error) {
      showMsg('success', 'Score deleted.')
      fetchScores()
    }
  }

  const handleEdit = (s: Score) => {
    setEditId(s.id)
    setDate(s.date)
    setScore(String(s.score))
  }

  const cancelEdit = () => {
    setEditId(null)
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setScore('')
  }

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {/* Access Control Overlay */}
      {profile?.sub_status !== 'active' && (
        <div style={{ 
          position: 'absolute', inset: -20, background: 'rgba(5, 8, 17, 0.7)', 
          backdropFilter: 'blur(8px)', zIndex: 10, borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)'
        }}>
          <div className="card" style={{ maxWidth: 400, textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Zap size={30} color="var(--color-gold)" />
            </div>
            <h2 className="heading-sm">Subscription Required</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 8, marginBottom: 24 }}>
              You need an active subscription to log scores and enter monthly prize draws.
            </p>
            <Link to="/subscribe" className="btn btn-primary" style={{ width: '100%' }}>Subscribe Now</Link>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>My Golf Scores</h1>
        <p>Enter your Stableford scores (1–45). Only your latest 5 are kept.</p>
      </div>

      {/* Form */}
      <div className="card" style={{ maxWidth: 560, marginBottom: 'var(--space-2xl)', background: 'rgba(101,88,245,0.06)', borderColor: 'rgba(101,88,245,0.2)' }}>
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>
          {editId ? '✏️ Edit Score' : '➕ Add New Score'}
        </h2>

        {msg && (
          <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 'var(--space-md)' }}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input id="score-date" className="form-input" type="date"
                value={date} onChange={e => setDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                disabled={!!editId} required />
            </div>
            <div className="form-group">
              <label className="form-label">Stableford Score (1–45)</label>
              <input id="score-value" className="form-input" type="number"
                min={1} max={45} placeholder="e.g. 32"
                value={score} onChange={e => setScore(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button id="save-score-btn" type="submit" className="btn btn-primary" disabled={saving || profile?.sub_status !== 'active'}>
              {saving ? <><Loader size={16} className="animate-spin" /> Saving…</> : <><Plus size={16} /> {editId ? 'Update Score' : 'Add Score'}</>}
            </button>
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
          {profile?.sub_status !== 'active' && (
            <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>⚠️ Active subscription required to log scores.</div>
          )}
        </form>
      </div>

      {/* Scores List */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="heading-sm">Your Score History</h2>
          <div className="badge badge-primary">
            {scores.length}/{MAX_SCORES} slots used
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${(scores.length / MAX_SCORES) * 100}%` }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
            {MAX_SCORES - scores.length} slot{MAX_SCORES - scores.length !== 1 ? 's' : ''} remaining · New score replaces oldest when full
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <Loader className="animate-spin" size={32} style={{ color: 'var(--color-primary)', margin: 'auto' }} />
          </div>
        ) : scores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <p>No scores logged yet. Add your first Stableford score above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scores.map((s, i) => (
              <div key={s.id} className="score-item" style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                padding: '12px 14px',
                background: editId === s.id ? 'rgba(101,88,245,0.08)' : 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                border: editId === s.id ? '1px solid rgba(101,88,245,0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                flexWrap: 'wrap'
              }}>
                <div className="number-ball number-ball-primary" style={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}>{s.score}</div>
                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {format(new Date(s.date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Stableford · Entry #{scores.length - i}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  {i === 0 && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Latest</span>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(s)} className="btn btn-ghost btn-sm" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule Reminder */}
      <div className="alert alert-info" style={{ marginTop: 'var(--space-lg)', fontSize: '0.85rem' }}>
        ℹ️ <strong>Rules:</strong> Only 1 score per date. Maximum 5 scores stored at any time. Adding a 6th replaces your oldest entry. Scores range: 1–45 (Stableford format).
      </div>
    </div>
  )
}
