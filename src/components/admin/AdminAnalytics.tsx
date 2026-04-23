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
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Users
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('sub_status', 'active')
      
      // Charity Ave
      const { data: profiles } = await supabase.from('profiles').select('charity_percentage')
      const avgPerc = profiles && profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + (p.charity_percentage || 0), 0) / profiles.length 
        : 0

      // Totals
      const { data: draws } = await supabase.from('draws').select('total_pool')
      const totalPool = (draws ?? []).reduce((sum, d) => sum + (d.total_pool || 0), 0)

      setStats({
        totalUsers: userCount || 0,
        activeSubs: activeCount || 0,
        totalPoolEver: totalPool,
        charityTotal: totalPool * 0.1, // Minimal assumption
        averageCharityPercentage: avgPerc
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
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Participation Rates</h2>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 20px' }}>
            {/* Mock Chart */}
            {[40, 70, 45, 90, 65, 80].map((h, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--gradient-primary)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
            ))}
          </div>
          <div className="flex-between" style={{ marginTop: 10, color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
            <span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
          </div>
        </div>

        <div className="card">
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Growth Indicators</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>Subscriber Retention</span>
              <span style={{ fontWeight: 700 }}>94%</span>
            </div>
            <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: '94%' }} /></div>
            
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>Score Entry Frequency</span>
              <span style={{ fontWeight: 700 }}>4.2 / week</span>
            </div>
            <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: '80%', background: 'var(--color-secondary)' }} /></div>

            <div className="flex-between">
              <span style={{ fontSize: '0.85rem' }}>Monthly Jackpot Growth</span>
              <span style={{ fontWeight: 700 }}>+12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
