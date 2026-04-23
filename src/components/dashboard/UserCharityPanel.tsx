import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase, type Charity } from '../../lib/supabase'
import { Heart, Search, Loader, CheckCircle } from 'lucide-react'

export default function UserCharityPanel() {
  const { profile, fetchProfile, user } = useAuthStore()
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [percentage, setPercentage] = useState(10)
  const [msg, setMsg] = useState('')
  const [donationAmount, setDonationAmount] = useState('')
  const [donating, setDonating] = useState(false)
  const [donationMsg, setDonationMsg] = useState('')

  useEffect(() => {
    setSelected(profile?.charity_id ?? null)
    setPercentage(profile?.charity_percentage ?? 10)
    supabase.from('charities').select('*').order('name').then(({ data }) => {
      setCharities(data ?? [])
      setLoading(false)
    })
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      charity_id: selected,
      charity_percentage: percentage,
    }).eq('id', profile.id)

    if (!error) {
      if (user) await fetchProfile(user.id)
      setMsg('Charity preferences saved!')
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  const filtered = charities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const selectedCharity = charities.find(c => c.id === selected)

  const handleDonate = async () => {
    if (!profile || !selected || !donationAmount) return
    setDonating(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1200))
    // Update mock balance (deduct donation)
    const amount = parseFloat(donationAmount)
    await supabase.from('profiles').update({
      mock_balance: Math.max(0, (profile.mock_balance || 0) - amount)
    }).eq('id', profile.id)
    setDonationMsg(`Thank you! £${amount.toFixed(2)} donated to ${selectedCharity?.name ?? 'charity'}. 🎉`)
    setDonationAmount('')
    setDonating(false)
    setTimeout(() => setDonationMsg(''), 5000)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Charity</h1>
        <p>Choose who benefits from your subscription — and how much.</p>
      </div>

      {/* Current Selection */}
      {selectedCharity && (
        <div className="card" style={{ background: 'rgba(0,229,160,0.06)', borderColor: 'rgba(0,229,160,0.25)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={24} color="var(--color-secondary)" fill="var(--color-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{selectedCharity.name}</div>
              <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginTop: 2 }}>Currently selected — {percentage}% of your subscription</div>
            </div>
            <CheckCircle size={22} color="var(--color-secondary)" />
          </div>
        </div>
      )}

      {/* Contribution Slider */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-md)' }}>Charity Contribution</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', minWidth: 50 }}>10% min</span>
          <input type="range" min={10} max={100} step={5}
            value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-secondary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-secondary)', minWidth: 50, textAlign: 'right' }}>{percentage}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <span>Monthly contribution to charity:</span>
          <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
            £{(9.99 * percentage / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Charity List */}
      <div className="card">
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-md)' }}>Choose Your Charity</h2>
        <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: '2.5rem' }}
            placeholder="Search charities…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <Loader className="animate-spin" size={28} style={{ color: 'var(--color-primary)', margin: 'auto' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {filtered.map(c => (
              <div key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: selected === c.id ? 'rgba(0,229,160,0.08)' : 'rgba(255,255,255,0.03)',
                  border: selected === c.id ? '1px solid rgba(0,229,160,0.35)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}>
                <Heart size={20} color={selected === c.id ? 'var(--color-secondary)' : 'var(--color-text-muted)'}
                  fill={selected === c.id ? 'var(--color-secondary)' : 'none'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </div>
                </div>
                {selected === c.id && <CheckCircle size={18} color="var(--color-secondary)" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && <div className="alert alert-success" style={{ marginTop: 'var(--space-md)' }}><CheckCircle size={16} /> {msg}</div>}

      <button id="save-charity-btn" onClick={handleSave} disabled={saving || !selected}
        className="btn btn-green btn-lg" style={{ marginTop: 'var(--space-lg)' }}>
        {saving ? <><Loader size={16} className="animate-spin" /> Saving…</> : <><Heart size={16} /> Save Preferences</>}
      </button>

      {/* Independent Donation — PRD §08 */}
      <div className="card" style={{ marginTop: 'var(--space-2xl)', borderColor: 'rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.04)' }}>
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-md)' }}>💛 Make an Independent Donation</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.7 }}>
          Want to give more? Make a one-time donation to your selected charity, independent of your subscription.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Donation Amount (£)</label>
            <input className="form-input" type="number" min={1} step={1} placeholder="e.g. 25"
              value={donationAmount} onChange={e => setDonationAmount(e.target.value)} />
          </div>
          <button onClick={handleDonate} disabled={donating || !donationAmount || !selected}
            className="btn btn-primary" style={{ height: 48, whiteSpace: 'nowrap' }}>
            {donating ? <Loader size={16} className="animate-spin" /> : <>Donate Now</>}
          </button>
        </div>
        {donationMsg && <div className="alert alert-success" style={{ marginTop: 'var(--space-md)' }}><CheckCircle size={16} /> {donationMsg}</div>}
      </div>
    </div>
  )
}
