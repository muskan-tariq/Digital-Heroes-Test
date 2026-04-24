import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase, type UserDraw, type Draw, type Verification } from '../../lib/supabase'
import { Trophy, Upload, Loader, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'

export default function UserWinnings() {
  const { profile } = useAuthStore()
  const [winnings, setWinnings] = useState<(UserDraw & { draw?: Draw; verification?: Verification })[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchWinnings = async () => {
    if (!profile) return
    const { data: entries } = await supabase
      .from('user_draws').select('*').eq('user_id', profile.id).gt('matches', 2).order('created_at', { ascending: false })

    if (!entries) { setLoading(false); return }

    const seenDraws = new Set<string>()
    const uniqueEntries = entries.filter(e => {
      if (seenDraws.has(e.draw_id)) return false
      seenDraws.add(e.draw_id)
      return true
    })

    const enriched = await Promise.all(uniqueEntries.map(async (e) => {
      const { data: draw } = await supabase.from('draws').select('*').eq('id', e.draw_id).maybeSingle()
      const { data: ver } = await supabase.from('verifications').select('*').eq('user_id', profile.id).eq('draw_id', e.draw_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return { ...e, draw: draw ?? undefined, verification: ver ?? undefined }
    }))
    setWinnings(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchWinnings() }, [profile])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, drawId: string) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setSubmitting(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('payout-proofs')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        if (uploadError.message.includes('row-level security')) {
          throw new Error('RLS Policy Error: Please ensure your "payout-proofs" bucket has a policy allowing "authenticated" users to "Insert" files.')
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payout-proofs')
        .getPublicUrl(data.path)

      // Insert into verifications
      const { error: insertError } = await supabase.from('verifications').insert({
        user_id: profile.id,
        draw_id: drawId,
        proof_url: publicUrl,
        status: 'pending',
      })

      if (insertError) throw insertError

      setMsg({ type: 'success', text: 'Proof uploaded and submitted!' })
      await fetchWinnings()
    } catch (error: any) {
      setMsg({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
      setUploadId(null)
    }
    setTimeout(() => setMsg(null), 4000)
  }

  const submitVerification = async (drawId: string) => {
    if (!profile || !proofUrl.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('verifications').insert({
      user_id: profile.id,
      draw_id: drawId,
      proof_url: proofUrl.trim(),
      status: 'pending',
    })
    if (!error) {
      setMsg({ type: 'success', text: 'Verification submitted! Admin will review shortly.' })
      setUploadId(null)
      setProofUrl('')
      await fetchWinnings()
    } else {
      setMsg({ type: 'error', text: error.message })
    }
    setTimeout(() => setMsg(null), 4000)
    setSubmitting(false)
  }

  const totalWon = winnings.reduce((sum, w) => sum + (w.winnings || 0), 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Winnings</h1>
        <p>Track your draw wins and submit verification to receive payouts.</p>
      </div>

      {/* Summary */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-2xl)', maxWidth: 500 }}>
        <div className="card-stat card-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Trophy size={18} color="var(--color-gold)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Won</span>
          </div>
          <div className="text-gold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>£{totalWon.toFixed(2)}</div>
        </div>
        <div className="card-stat">
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Winning Draws</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{winnings.length}</div>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 'var(--space-xl)' }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <Loader className="animate-spin" size={36} style={{ color: 'var(--color-primary)', margin: 'auto' }} />
        </div>
      ) : winnings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🏆</div>
          <p>No winnings yet. Keep entering scores for your chance to win!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {winnings.map(w => {
            const verStatus = w.verification?.status
            return (
              <div key={w.id} className="card animate-fade-in">
                <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
                  <div>
                    <h3 className="heading-sm">Draw: {w.draw?.month}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {w.draw ? format(new Date(w.draw.executed_at), 'd MMM yyyy') : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {w.matches >= 5 && <span className="badge tier-badge-5">🏆 Jackpot!</span>}
                    {w.matches === 4 && <span className="badge tier-badge-4">🥈 4 Match</span>}
                    {w.matches === 3 && <span className="badge tier-badge-3">🥉 3 Match</span>}
                  </div>
                </div>

                <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Prize Amount</span>
                  <span className="text-gold" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>£{w.winnings.toFixed(2)}</span>
                </div>

                {/* Verification */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                  <div className="flex-between">
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Verification Status</div>
                    {!verStatus && <span className="badge badge-gray">Not Submitted</span>}
                    {verStatus === 'pending' && <span className="badge badge-primary">⏳ Pending Review</span>}
                    {verStatus === 'approved' && <span className="badge badge-green">✅ Approved</span>}
                    {verStatus === 'rejected' && <span className="badge badge-red">❌ Rejected</span>}
                    {verStatus === 'paid' && <span className="badge badge-gold">💰 Paid Out</span>}
                  </div>

                  {!verStatus && uploadId !== w.id && (
                    <button onClick={() => setUploadId(w.id)} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                      <Upload size={14} /> Submit Score Proof
                    </button>
                  )}

                  {uploadId === w.id && (
                    <div style={{ marginTop: 12 }}>
                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ImageIcon size={14} /> Upload Screenshot
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, w.draw_id)}
                          disabled={submitting}
                          style={{ fontSize: '0.8rem' }}
                        />
                      </div>
                      
                      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 16 }}>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
                        <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-surface)', padding: '0 8px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>OR USE URL</span>
                      </div>

                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label className="form-label">Screenshot URL</label>
                        <input className="form-input" type="url"
                          placeholder="https://your-golf-platform/score-screenshot.png"
                          value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => submitVerification(w.draw_id)} disabled={submitting || !proofUrl.trim()}
                          className="btn btn-primary btn-sm">
                          {submitting ? <Loader size={14} className="animate-spin" /> : <><Upload size={14} /> Submit URL</>}
                        </button>
                        <button onClick={() => { setUploadId(null); setProofUrl('') }} className="btn btn-ghost btn-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
