import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase, type Draw, type UserDraw } from '../../lib/supabase'
import { Loader } from 'lucide-react'
import { format } from 'date-fns'

export default function DrawResults() {
  const { profile } = useAuthStore()
  const [draws, setDraws] = useState<(Draw & { myEntry?: UserDraw })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const { data: drawsData } = await supabase
        .from('draws').select('*').eq('status', 'published')
        .order('executed_at', { ascending: false })

      if (!drawsData) { setLoading(false); return }

      const enriched = await Promise.all(
        drawsData.map(async (d) => {
          const { data: entry } = await supabase
            .from('user_draws').select('*').eq('draw_id', d.id).eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
          return { ...d, myEntry: entry ?? undefined }
        })
      )
      setDraws(enriched)
      setLoading(false)
    }
    load()
  }, [profile])

  const getMatchBadge = (m: number) => {
    if (m >= 5) return <span className="badge tier-badge-5">🏆 5 Match!</span>
    if (m === 4) return <span className="badge tier-badge-4">🥈 4 Match</span>
    if (m === 3) return <span className="badge tier-badge-3">🥉 3 Match</span>
    return <span className="badge badge-gray">No Match</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Draw Results</h1>
        <p>View all published monthly draws and your match history.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <Loader className="animate-spin" size={36} style={{ color: 'var(--color-primary)', margin: 'auto' }} />
        </div>
      ) : draws.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🎲</div>
          <p>No draw results published yet. Check back after the monthly draw!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {draws.map((draw, i) => (
            <div key={draw.id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
                <div>
                  <h3 className="heading-sm">Draw — {draw.month}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Executed {format(new Date(draw.executed_at), 'd MMM yyyy')}
                  </div>
                </div>
                <span className="badge badge-green">Published</span>
              </div>

              {/* Winning Numbers */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Winning Numbers</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {draw.winning_numbers.map((n, j) => (
                    <div key={j} className="number-ball number-ball-gold">{n}</div>
                  ))}
                </div>
              </div>

              {/* Prize Pools */}
              <div className="grid-3" style={{ marginBottom: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,215,0,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>5-MATCH (40%)</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} className="text-gold">£{draw.match_5_pool.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(192,192,192,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(192,192,192,0.1)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>4-MATCH (35%)</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>£{draw.match_4_pool.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(205,127,50,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(205,127,50,0.1)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>3-MATCH (25%)</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>£{draw.match_3_pool.toFixed(2)}</div>
                </div>
              </div>

              {/* My Entry */}
              {draw.myEntry ? (
                <div style={{ background: 'rgba(101,88,245,0.08)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid rgba(101,88,245,0.2)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>My Entry</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {draw.myEntry.user_scores.map((n, j) => {
                      const isMatch = draw.winning_numbers.includes(n)
                      return (
                        <div key={j} className={`number-ball ${isMatch ? 'number-ball-primary' : 'number-ball-outline'}`}>{n}</div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getMatchBadge(draw.myEntry.matches)}
                    {draw.myEntry.winnings > 0 && (
                      <span style={{ color: 'var(--color-gold)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        £{draw.myEntry.winnings.toFixed(2)} won
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                  You did not have an active entry in this draw.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
