import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Heart, Trophy, TrendingUp, Loader } from 'lucide-react'

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubs: 0,
    totalPoolEver: 0,
    charityTotal: 0,
    averageCharityPercentage: 0,
    retentionRate: 0,
    jackpotGrowth: 0,
    scoreFrequency: 0,
    history: [] as { month: string, pool: number }[]
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 1. User Stats
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('sub_status', 'active')
      
      // 2. Charity Data
      const { data: profiles } = await supabase.from('profiles').select('charity_percentage')
      const avgPerc = profiles && profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + (p.charity_percentage || 0), 0) / profiles.length 
        : 0

      // 3. Draw Data & History
      const { data: draws } = await supabase.from('draws').select('*').order('executed_at', { ascending: false })
      const totalPool = (draws ?? []).reduce((sum, d) => sum + (d.total_pool || 0), 0)
      
      // 4. Growth Calculation
      let growth = 0
      if (draws && draws.length >= 2) {
        const last = draws[0].total_pool || 0
        const prev = draws[1].total_pool || 0
        growth = prev > 0 ? ((last - prev) / prev) * 100 : 0
      }

      // 5. Score Frequency (Total Scores / Total Users)
      const { count: totalScores } = await supabase.from('scores').select('*', { count: 'exact', head: true })
      const scoreFreq = (userCount && userCount > 0) ? (totalScores || 0) / userCount : 0

      // 6. Format History for Chart (Last 12 draws)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const history = (draws ?? []).slice(0, 12).reverse().map(d => {
        const monthNum = parseInt(d.month.split('-')[1])
        return {
          month: monthNames[monthNum - 1],
          pool: d.total_pool
        }
      })

      setStats({
        totalUsers: userCount || 0,
        activeSubs: activeCount || 0,
        totalPoolEver: totalPool,
        charityTotal: totalPool * 0.1, 
        averageCharityPercentage: avgPerc,
        retentionRate: userCount ? (activeCount || 0) / userCount * 100 : 0,
        jackpotGrowth: growth,
        scoreFrequency: scoreFreq,
        history
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <Loader className="animate-spin" size={40} style={{ margin: 'auto' }} />
    </div>
  )

  const maxPool = Math.max(...stats.history.map(h => h.pool), 10)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Comprehensive overview of growth, participation, and charitable impact.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="card-stat card-gradient">
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <Users size={18} color="var(--color-primary-light)" />
            <span className="badge badge-primary">Total</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Registered Users</div>
        </div>

        <div className="card-stat">
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <TrendingUp size={18} color="var(--color-secondary)" />
            <span className="badge badge-green">Active</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{stats.activeSubs}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Paying Subscribers</div>
        </div>

        <div className="card-stat">
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <Trophy size={18} color="var(--color-gold)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }} className="text-gold">£{stats.totalPoolEver.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Prize Distributed</div>
        </div>

        <div className="card-stat">
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <Heart size={18} color="var(--color-accent)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>{stats.averageCharityPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Avg. Donation Rate</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Participation (Pool Size)</h2>
          {stats.history.length === 0 ? (
            <div className="empty-state" style={{ height: 200 }}>
                <p style={{ fontSize: '0.8rem' }}>No draw history yet.</p>
            </div>
          ) : (
            <>
              <div style={{ 
                height: 200, display: 'flex', alignItems: 'flex-end', 
                gap: '8px', padding: '0 10px', 
                overflowX: 'auto', paddingBottom: '10px'
              }}>
                {stats.history.map((h, i) => (
                  <div key={i} title={`£${h.pool}`} style={{ 
                    flex: '1 0 30px', 
                    background: 'var(--gradient-primary)', 
                    height: `${(h.pool / maxPool) * 100}%`, 
                    borderRadius: '4px 4px 0 0', 
                    opacity: 0.8,
                    minHeight: 10
                  }} />
                ))}
              </div>
              <div className="flex-between" style={{ marginTop: 10, color: 'var(--color-text-muted)', fontSize: '0.65rem', overflowX: 'auto', gap: '8px', padding: '0 10px' }}>
                {stats.history.map((h, i) => <span key={i} style={{ flex: '1 0 30px', textAlign: 'center' }}>{h.month}</span>)}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Growth Indicators</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>User Retention</span>
              <span style={{ fontWeight: 700 }}>{stats.retentionRate.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${stats.retentionRate}%` }} /></div>
            
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>Avg. Scores Per User</span>
              <span style={{ fontWeight: 700 }}>{stats.scoreFrequency.toFixed(1)} total</span>
            </div>
            <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${Math.min(stats.scoreFrequency * 20, 100)}%`, background: 'var(--color-secondary)' }} /></div>

            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>Monthly Jackpot Growth</span>
              <span style={{ fontWeight: 700, color: stats.jackpotGrowth >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                {stats.jackpotGrowth >= 0 ? '+' : ''}{stats.jackpotGrowth.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Comparing last two published draws</div>
          </div>
        </div>
      </div>
    </div>
  )
}
