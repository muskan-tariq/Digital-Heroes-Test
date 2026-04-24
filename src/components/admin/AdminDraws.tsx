import { useState, useEffect } from 'react'
import { supabase, type Draw, type Profile } from '../../lib/supabase'
import { Zap, Play, Send, Loader, Info, RefreshCcw } from 'lucide-react'
import { format } from 'date-fns'
import { useNotificationStore } from '../../store/notificationStore'

export default function AdminDraws() {
  const { addNotification } = useNotificationStore()
  const [activeSubscribers, setActiveSubscribers] = useState<Profile[]>([])
  const [userScores, setUserScores] = useState<Record<string, number[]>>({})
  const [draws, setDraws] = useState<Draw[]>([])
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  // Simulation State
  const [drawMode, setDrawMode] = useState<'random' | 'algorithmic'>('random')
  const [currentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [simResults, setSimResults] = useState<{
    winningNumbers: number[]
    matches: { tier: number; count: number; totalPrize: number; perPerson: number; winners: string[] }[]
    totalPool: number
    jackpotRollover: number
  } | null>(null)

  const fetchData = async () => {
    try {
      // Get active subscribers
      const { data: subs, error: subsErr } = await supabase.from('profiles').select('*').eq('sub_status', 'active')
      if (subsErr) console.error('AdminDraws profiles error:', subsErr.message)
      setActiveSubscribers(subs ?? [])

      // Get scores for all active users
      if (subs && subs.length > 0) {
        const allScores: Record<string, number[]> = {}
        for (const sub of subs) {
          const { data: scores } = await supabase
            .from('scores')
            .select('score')
            .eq('user_id', sub.id)
            .order('date', { ascending: false })
            .limit(5)
          allScores[sub.id] = (scores ?? []).map(s => s.score)
        }
        setUserScores(allScores)
      }

      // Get existing draws
      const { data: drawList, error: drawErr } = await supabase.from('draws').select('*').order('executed_at', { ascending: false })
      if (drawErr) console.error('AdminDraws draws error:', drawErr.message)
      setDraws(drawList ?? [])
    } catch (e) {
      console.error('AdminDraws fetchData error:', e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const runSimulation = async () => {
    setSimulating(true)
    await fetchData() // Always get fresh scores before simulating
    
    // 1. Generate Winning Numbers
    let winningNumbers: number[] = []
    if (drawMode === 'random') {
      while (winningNumbers.length < 5) {
        const num = Math.floor(Math.random() * 45) + 1
        if (!winningNumbers.includes(num)) winningNumbers.push(num)
      }
    } else {
      // Algorithmic: Guaranteed Winner Method
      // To ensure "some player must win", we pick a random active user 
      // and use their current scores as the winning set.
      const userIds = Object.keys(userScores).filter(id => userScores[id].length > 0)
      
      if (userIds.length > 0) {
        const luckyUserId = userIds[Math.floor(Math.random() * userIds.length)]
        const userNumbers = [...userScores[luckyUserId]]
        
        // Take up to 5 unique numbers from this user
        const uniqueUserNumbers = [...new Set(userNumbers)]
        winningNumbers = uniqueUserNumbers.slice(0, 5)
        
        // If they have fewer than 5 unique scores, pad with random ones
        while (winningNumbers.length < 5) {
          const num = Math.floor(Math.random() * 45) + 1
          if (!winningNumbers.includes(num)) winningNumbers.push(num)
        }
        
        // Shuffle for randomness
        winningNumbers.sort(() => Math.random() - 0.5)
      } else {
        // Fallback to random if no users have scores
        while (winningNumbers.length < 5) {
          const num = Math.floor(Math.random() * 45) + 1
          if (!winningNumbers.includes(num)) winningNumbers.push(num)
        }
      }
    }

    // 2. Calculate Pool (Mock: £5 per subscriber goes to pool)
    const totalPool = activeSubscribers.length * 5
    const pools = {
      5: totalPool * 0.40,
      4: totalPool * 0.35,
      3: totalPool * 0.25
    }

    // 3. Find Winners
    const tiers: Record<number, string[]> = { 3: [], 4: [], 5: [] }
    Object.entries(userScores).forEach(([userId, scores]) => {
      const matches = scores.filter(s => winningNumbers.includes(s)).length
      if (matches >= 3) tiers[matches].push(userId)
    })

    // 4. Distribution
    const results = [5, 4, 3].map(tier => {
      const winnerCount = tiers[tier].length
      const perPerson = winnerCount > 0 ? (pools[tier as 3|4|5] / winnerCount) : 0
      return {
        tier,
        count: winnerCount,
        totalPrize: pools[tier as 3|4|5],
        perPerson,
        winners: tiers[tier]
      }
    })

    // Jackpot Rollover Check
    const jackpotRollover = tiers[5].length === 0 ? pools[5] : 0

    setSimResults({
      winningNumbers,
      matches: results,
      totalPool,
      jackpotRollover
    })
    setSimulating(false)
  }

  const publishDraw = async () => {
    if (!simResults) return
    setPublishing(true)
    await fetchData() // Final refresh before permanent record
    
    try {
      // Check if draw for this month already exists
      const { data: existing } = await supabase.from('draws').select('*').eq('month', currentMonth).single()
      
      let drawId: string
      if (existing) {
        const { error } = await supabase.from('draws').update({
          status: 'published',
          winning_numbers: simResults.winningNumbers,
          total_pool: simResults.totalPool,
          match_5_pool: simResults.matches.find(m => m.tier === 5)?.totalPrize,
          match_4_pool: simResults.matches.find(m => m.tier === 4)?.totalPrize,
          match_3_pool: simResults.matches.find(m => m.tier === 3)?.totalPrize,
          jackpot_rollover: simResults.jackpotRollover,
          executed_at: new Date().toISOString()
        }).eq('id', existing.id)
        if (error) throw error
        drawId = existing.id
      } else {
        const { data, error } = await supabase.from('draws').insert({
          month: currentMonth,
          status: 'published',
          winning_numbers: simResults.winningNumbers,
          total_pool: simResults.totalPool,
          match_5_pool: simResults.matches.find(m => m.tier === 5)?.totalPrize,
          match_4_pool: simResults.matches.find(m => m.tier === 4)?.totalPrize,
          match_3_pool: simResults.matches.find(m => m.tier === 3)?.totalPrize,
          jackpot_rollover: simResults.jackpotRollover
        }).select().single()
        if (error) throw error
        drawId = data.id
      }

      // 1.5. Clean up existing entries for this draw to prevent duplicates
      await supabase.from('user_draws').delete().eq('draw_id', drawId)

      // Record user entries/winners
      for (const [userId, scores] of Object.entries(userScores)) {
        const matches = scores.filter(s => simResults.winningNumbers.includes(s)).length
        let winnings = 0
        if (matches >= 3) {
            const tierData = simResults.matches.find(t => t.tier === matches)
            winnings = tierData ? tierData.perPerson : 0
        }
        
        await supabase.from('user_draws').insert({
          draw_id: drawId,
          user_id: userId,
          user_scores: scores,
          matches: matches,
          winnings: winnings
        })
      }

      setSimResults(null)
      fetchData()
      addNotification('draw', 'Draw Results Published!', `The ${currentMonth} draw has been published. Players can now check their results.`, ['app', 'email'])
      alert('Draw results published successfully!')
    } catch (err: any) {
      alert('Error publishing draw: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Monthly Draw Engine</h1>
        <p>Configure logic, simulate results, and publish official monthly draws.</p>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-xl)' }}>
        {/* Configuration */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <h2 className="heading-sm">Configuration</h2>
            <button onClick={fetchData} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCcw size={14} /> Refresh Data
            </button>
          </div>
          
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Draw Period</label>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentMonth}</div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">Algorithm Type</label>
            <div className="grid-2" style={{ gap: 10 }}>
              <button 
                onClick={() => setDrawMode('random')}
                className={`btn ${drawMode === 'random' ? 'btn-primary' : 'btn-secondary'}`} style={{ gap: 8 }}>
                <RefreshCcw size={16} /> Random
              </button>
              <button 
                onClick={() => setDrawMode('algorithmic')}
                className={`btn ${drawMode === 'algorithmic' ? 'btn-primary' : 'btn-secondary'}`} style={{ gap: 8 }}>
                <Zap size={16} /> Weighted
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              {drawMode === 'random' ? 'Pure random number generation (Standard Lottery).' : 'Weighted by most frequent user scores this month.'}
            </p>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
            <Info size={20} />
            <div>
                <strong>Subscriber Pool:</strong> {activeSubscribers.length} active players.
            </div>
          </div>

          <button 
            onClick={runSimulation}
            disabled={simulating || activeSubscribers.length === 0}
            className="btn btn-primary btn-lg" style={{ width: '100%', gap: 10 }}>
            {simulating ? <Loader className="animate-spin" size={18} /> : <><Play size={18} fill="currentColor" /> Run Simulation</>}
          </button>
        </div>

        {/* Simulation Results */}
        <div className="card" style={{ borderColor: simResults ? 'var(--color-primary)' : 'var(--color-border)' }}>
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>
            {simResults ? '📊 Simulation Results' : 'Waiting for Simulation...'}
          </h2>

          {!simResults ? (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <div className="empty-state-icon">🎲</div>
              <p>Configure and run simulation to preview results.</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>WINNING NUMBERS</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {simResults.winningNumbers.map(n => (
                    <div key={n} className="number-ball number-ball-gold">{n}</div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-lg)' }}>
                {simResults.matches.map(m => (
                  <div key={m.tier} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.tier}-Match</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.count} winners</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }} className="text-gradient">£{m.totalPrize.toFixed(2)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>£{m.perPerson.toFixed(2)} each</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
                {simResults.jackpotRollover > 0 ? (
                  <>🔥 No 5-match winners. <strong>£{simResults.jackpotRollover.toFixed(2)}</strong> will rollover to next month.</>
                ) : (
                  <>✅ Jackpot won! £{simResults.matches[0].totalPrize.toFixed(2)} distributed.</>
                )}
              </div>

              <button 
                onClick={publishDraw}
                disabled={publishing}
                id="publish-draw-btn"
                className="btn btn-green btn-lg" style={{ width: '100%', gap: 10 }}>
                {publishing ? <Loader className="animate-spin" size={18} /> : <><Send size={18} /> Publish Results Officially</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Draw History */}
      <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Past Draws</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Numbers</th>
                <th>Total Pool</th>
                <th>Jackpot Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {draws.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.month}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d.winning_numbers.map((n, i) => <span key={i} className="badge badge-gray">{n}</span>)}
                    </div>
                  </td>
                  <td>£{d.total_pool.toFixed(2)}</td>
                  <td>
                    {d.jackpot_rollover > 0 ? (
                      <span className="badge badge-red">Rollover £{d.jackpot_rollover.toFixed(2)}</span>
                    ) : (
                      <span className="badge badge-green">Won</span>
                    )}
                  </td>
                  <td><span className="badge badge-primary">{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
