import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Check, Loader, CreditCard, Shield, Zap, ArrowRight, Star } from 'lucide-react'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£9.99',
    period: '/month',
    savings: null,
    features: [
      '5 score entries per month',
      'Monthly prize draw entry',
      '10% to your chosen charity',
      'Real-time draw results',
      'Full dashboard access',
    ],
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£89.99',
    period: '/year',
    savings: 'Save £29.89',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority draw entry',
      'Annual charity report',
      'Early access to features',
    ],
    popular: true,
  },
]

export default function SubscribePage() {
  const { fetchProfile, user } = useAuthStore()
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' })
  const navigate = useNavigate()

  const handleSubscribe = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    const { addNotification } = useNotificationStore.getState()

    try {
      // Step 1: Show Stripe Simulation Overlay
      setShowCheckout(true)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Processing state

      // Step 2: Finalize in DB
      const renewalDate = new Date()
      if (selected === 'monthly') {
        renewalDate.setMonth(renewalDate.getMonth() + 1)
      } else {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          sub_status: 'active',
          sub_renewal_date: renewalDate.toISOString(),
          mock_balance: selected === 'monthly' ? 9.99 : 89.99,
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      await fetchProfile(user.id)
      addNotification('subscription', 'Subscription Activated!', `Your ${selected} plan is now active. You're entered into the next monthly draw!`, ['app', 'email'])
      setShowCheckout(false)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
      setShowCheckout(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)', padding: 'var(--space-4xl) 0', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-primary" style={{ width: 500, height: 500, top: -100, left: -100 }} />
      <div className="orb orb-secondary" style={{ width: 400, height: 400, bottom: 0, right: -100 }} />

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 17, 0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 400, background: '#fff', color: '#333' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--color-primary)' }}>
              <CreditCard size={24} />
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Stripe <span style={{ fontWeight: 400, color: '#666' }}>Checkout</span></div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>Pay Digital Heroes</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{selected === 'monthly' ? '£9.99' : '£89.99'}</div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ color: '#666' }}>Card Information</label>
              <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12, background: '#f9f9f9' }}>
                <input disabled style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', color: '#333' }} placeholder="4242 4242 4242 4242" />
                <div style={{ display: 'flex', gap: 10, marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
                  <input disabled style={{ width: '60%', border: 'none', background: 'transparent' }} placeholder="MM / YY" />
                  <input disabled style={{ width: '40%', border: 'none', background: 'transparent' }} placeholder="CVC" />
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', background: '#635bff', borderColor: '#635bff' }} disabled>
              <Loader size={18} className="animate-spin" />
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', marginTop: 12 }}>
              Securely processing via Stripe...
            </p>
          </div>
        </div>
      )}

      <div className="container-md" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
          <div className="badge badge-gold" style={{ margin: '0 auto 16px' }}><Star size={12} /> Choose Your Plan</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800 }}>
            Start Playing for <span className="text-gradient">Good</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Every plan includes full platform access, draw entry, and charitable giving.
          </p>
        </div>

        {/* Plans */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-2xl)', maxWidth: 680, margin: '0 auto var(--space-2xl)' }}>
          {PLANS.map(plan => (
            <div key={plan.id}
              onClick={() => setSelected(plan.id as 'monthly' | 'yearly')}
              className="card"
              style={{
                cursor: 'pointer', position: 'relative',
                border: selected === plan.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selected === plan.id ? 'rgba(101, 88, 245, 0.1)' : 'var(--color-bg-card)',
                transition: 'all 0.25s ease',
                transform: selected === plan.id ? 'translateY(-4px)' : 'none',
                boxShadow: selected === plan.id ? 'var(--shadow-glow-primary)' : 'none',
              }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span className="badge badge-primary">⚡ Best Value</span>
                </div>
              )}
              {plan.savings && (
                <div style={{ marginBottom: 12 }}>
                  <span className="badge badge-green">{plan.savings}</span>
                </div>
              )}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 'var(--space-lg)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900 }} className="text-gradient">{plan.price}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{plan.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <Check size={15} color="var(--color-secondary)" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Box */}
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', backdropFilter: 'blur(20px)', background: 'rgba(12, 18, 37, 0.85)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            Order Summary
          </h3>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Plan</span>
              <span style={{ fontWeight: 600 }}>{selected === 'monthly' ? 'Monthly' : 'Yearly'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Charity Contribution</span>
              <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
                Min. {selected === 'monthly' ? '£1.00' : '£9.00'} (10%)
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total Today</span>
              <span className="text-gradient" style={{ fontFamily: 'var(--font-display)' }}>{selected === 'monthly' ? '£9.99' : '£89.99'}</span>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CreditCard size={20} color="var(--color-text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Mock Payment Simulation</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No real charges — evaluation mode</div>
            </div>
            <div className="badge badge-green"><Shield size={10} /> Secure</div>
          </div>

          <button id="subscribe-btn" onClick={handleSubscribe} disabled={loading}
            className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
            {loading
              ? <><Loader size={18} className="animate-spin" /> Processing Payment…</>
              : <>Subscribe {selected === 'monthly' ? '£9.99/mo' : '£89.99/yr'} <ArrowRight size={18} /></>
            }
          </button>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 12 }}>
            Cancel anytime · Secure & encrypted · Charity contributions included
          </p>
        </div>

        {/* Trust Badges */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 'var(--space-2xl)', flexWrap: 'wrap' }}>
          {[
            { icon: <Shield size={16} />, label: 'Secure Payments' },
            { icon: <Zap size={16} />, label: 'Instant Access' },
            { icon: <Check size={16} />, label: 'Cancel Anytime' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
