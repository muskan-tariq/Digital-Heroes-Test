import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase, type Score, type Charity, type Draw, type UserDraw } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { Target, Heart, Trophy, ArrowRight, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function UserOverview() {
  const { profile } = useAuthStore()
  const [scores, setScores] = useState<Score[]>([])
  const [charity, setCharity] = useState<Charity | null>(null)
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)
  const [myEntry, setMyEntry] = useState<UserDraw | null>(null)
  const [totalWon, setTotalWon] = useState(0)

  useEffect(() => {
    if (!profile) return

    // Fetch scores
    supabase.from('scores').select('*').eq('user_id', profile.id)
      .order('date', { ascending: false }).limit(5)
      .then(({ data }) => setScores(data ?? []))

    // Fetch charity
    if (profile.charity_id) {
      supabase.from('charities').select('*').eq('id', profile.charity_id).single()
        .then(({ data }) => {
          if (data) {
            setCharity(data)
          } else {
            // Fallback for placeholders
            const PLACEHOLDER_CHARITIES: Charity[] = [
              { id: '70868f63-0490-4824-b152-7a0914440c24', name: 'Cancer Research UK', description: '', image_url: null, website_url: null, created_at: '' },
              { id: 'b2d3e91b-6902-45d2-a7d1-e6e73f9154a1', name: 'Mind', description: '', image_url: null, website_url: null, created_at: '' },
              { id: 'c5e3f1a2-b9d8-4f7c-a6e1-d5b2c9a8f3e4', name: 'St Giles Hospice', description: '', image_url: null, website_url: null, created_at: '' },
              { id: 'a1b2c3d4-e5f6-4a5b-b6c7-d8e9f0a1b2c3', name: 'Age UK', description: '', image_url: null, website_url: null, created_at: '' },
            ]
            const placeholder = PLACEHOLDER_CHARITIES.find(c => c.id === profile.charity_id)
            if (placeholder) setCharity(placeholder)
          }
        })
    }

    // Fetch latest published draw
    supabase.from('draws').select('*').eq('status', 'published')
      .order('executed_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setLatestDraw(data[0])
          supabase.from('user_draws').select('*').eq('draw_id', data[0].id).eq('user_id', profile.id).single()
            .then(({ data: entry }) => setMyEntry(entry))
        }
      })

    // Total winnings
    supabase.from('user_draws').select('winnings').eq('user_id', profile.id)
      .then(({ data }) => {
        const total = (data ?? []).reduce((sum, d) => sum + (d.winnings || 0), 0)
        setTotalWon(total)
      })
  }, [profile])

  const renewalDate = profile?.sub_renewal_date
    ? format(new Date(profile.sub_renewal_date), 'd MMM yyyy') : '—'
  const charityContrib = profile && profile.sub_status === 'active'
    ? ((9.99 * (profile.charity_percentage / 100))).toFixed(2) : '0.00'

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You will lose access at the end of your billing cycle.')) return
    const { error } = await supabase.from('profiles').update({ sub_status: 'inactive' }).eq('id', profile?.id)
    if (!error) window.location.reload()
  }

  const handleRenew = () => {
    window.location.href = '/subscribe'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Welcome back 👋</h1>
        <p>{profile?.email}</p>
      </div>

      {/* Subscription Management Banner */}
      {profile?.sub_status !== 'active' ? (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-2xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={24} />
            <div>
              <div style={{ fontWeight: 700 }}>Subscription Lapsed</div>
              <div style={{ fontSize: '0.85rem' }}>Your access is restricted. Renew to continue playing.</div>
            </div>
          </div>
          <button onClick={handleRenew} className="btn btn-primary btn-sm">Renew Now</button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 'var(--space-2xl)', background: 'var(--gradient-primary)', color: 'white', padding: '16px 24px' }}>
          <div className="flex-between">
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Active Membership</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Renews on {renewalDate}</div>
            </div>
            <button onClick={handleCancel} className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Cancel Plan</button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="card-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,229,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} color="var(--color-secondary)" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scores Logged</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{scores.length}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/5</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Latest 5 active</div>
        </div>

        <div className="card-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={16} color="var(--color-gold)" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Winnings</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }} className="text-gold">£{totalWon.toFixed(2)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>All time</div>
        </div>

        <div className="card-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,229,160,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} color="var(--color-secondary)" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Charity Given</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)' }}>£{charityContrib}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{profile?.charity_percentage ?? 10}% this month</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-xl)' }}>
        {/* Recent Scores */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <h2 className="heading-sm">Recent Scores</h2>
            <Link to="/dashboard/scores" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          {scores.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <div className="empty-state-icon">🎯</div>
              <p style={{ marginBottom: 12, fontSize: '0.9rem' }}>No scores yet</p>
              <Link to="/dashboard/scores" className="btn btn-primary btn-sm">Add First Score</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scores.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div className="number-ball number-ball-primary" style={{ width: 38, height: 38, fontSize: '0.9rem' }}>{s.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{format(new Date(s.date + 'T00:00:00'), 'd MMM yyyy')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Stableford score</div>
                  </div>
                  {i === 0 && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Latest</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charity & Draw */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Charity */}
          <div className="card" style={{ background: 'rgba(0,229,160,0.05)', borderColor: 'rgba(0,229,160,0.2)' }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h2 className="heading-sm">Your Charity</h2>
              <Link to="/dashboard/charity" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link>
            </div>
            {charity ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={20} color="var(--color-secondary)" fill="var(--color-secondary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{charity.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', marginTop: 2 }}>
                    {profile?.charity_percentage}% of your sub
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 12 }}>No charity selected yet</p>
                <Link to="/dashboard/charity" className="btn btn-green btn-sm">Choose a Charity</Link>
              </div>
            )}
          </div>

          {/* Latest Draw */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h2 className="heading-sm">Latest Draw</h2>
              <Link to="/dashboard/draws" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link>
            </div>
            {latestDraw ? (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                  {latestDraw.month} · Winning Numbers
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {latestDraw.winning_numbers.map((n, i) => (
                    <div key={i} className="number-ball number-ball-gold">{n}</div>
                  ))}
                </div>
                {myEntry && myEntry.matches > 0 && (
                  <div className="badge badge-gold">🎉 You matched {myEntry.matches} numbers!</div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No published draws yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
