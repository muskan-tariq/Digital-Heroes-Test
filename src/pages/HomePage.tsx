import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase, type Charity } from '../lib/supabase'
import { Heart, Zap, Trophy, ChevronRight, Star, Users, ArrowRight, Shield, TrendingUp } from 'lucide-react'

const STATS = [
  { value: '£12,400', label: 'Donated to Charities' },
  { value: '3,241', label: 'Active Players' },
  { value: '£48,200', label: 'Prize Pool Distributed' },
  { value: '47', label: 'Partner Charities' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Users size={22} />, 
    title: 'Subscribe & Choose Your Cause',
    desc: 'Pick a monthly or yearly plan and select a charity you care about. A portion of your subscription goes directly to them.',
  },
  {
    step: '02',
    icon: <Zap size={22} />,
    title: 'Enter Your Stableford Scores',
    desc: 'Log your latest 5 golf scores. Your scores become your lottery tickets — the system keeps them rolling so only your freshest 5 count.',
  },
  {
    step: '03',
    icon: <Trophy size={22} />,
    title: 'Win Monthly Prize Draws',
    desc: 'Each month our draw engine matches your numbers. Match 3, 4, or 5 for a share of the prize pool — jackpots rollover if unclaimed!',
  },
]

const PRIZES = [
  { match: '5-Number Match', share: '40%', type: 'Jackpot', rollover: true, icon: '🏆', tier: 'tier-badge-5' },
  { match: '4-Number Match', share: '35%', type: 'Major Prize', rollover: false, icon: '🥈', tier: 'tier-badge-4' },
  { match: '3-Number Match', share: '25%', type: 'Prize', rollover: false, icon: '🥉', tier: 'tier-badge-3' },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([])

  useEffect(() => {
    const fetchFeatured = async () => {
      // First try to get explicitly featured charities
      let { data } = await supabase.from('charities').select('*').eq('is_featured', true).limit(4)
      
      // Fallback: just get the first 4 if none are marked featured
      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase.from('charities').select('*').limit(4)
        data = fallbackData
      }
      
      if (data) setFeaturedCharities(data)
    }
    fetchFeatured()
  }, [])

  const COLOR_PALETTE = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-gold)']

  return (
    <div style={{ background: 'var(--gradient-hero)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5, 8, 17, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
            <span style={{ 
              background: 'var(--gradient-primary)', borderRadius: '10px', 
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Heart size={18} color="white" fill="white" />
            </span>
            Digital Heroes
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/charities" className="btn btn-ghost btn-sm hide-mobile">Charities</Link>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/auth" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/auth?signup=true" className="btn btn-primary btn-sm">Subscribe Now</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', padding: 'var(--space-4xl) 0', overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div className="orb orb-primary" style={{ width: 600, height: 600, top: -200, left: -200, opacity: 0.6 }} />
        <div className="orb orb-secondary" style={{ width: 500, height: 500, bottom: -150, right: -100, opacity: 0.5 }} />

        <div className="container-md" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="badge badge-primary" style={{ marginBottom: 24, margin: '0 auto 24px' }}>
            <Star size={12} /> Play. Give. Win.
          </div>
          <h1 className="heading-hero">
            Where Golf Scores{' '}
            <span className="text-gradient">Change Lives</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
            color: 'var(--color-text-secondary)',
            marginTop: 20, marginBottom: 40,
            maxWidth: 580, margin: '20px auto 40px'
          }}>
            Subscribe, enter your Stableford scores, win monthly prize draws — and make a real difference to charities you love.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/auth?signup=true'} className="btn btn-primary btn-xl" style={{ animation: 'pulse-glow 2s infinite' }}>
              {user ? 'Go to Dashboard' : 'Start Your Journey'} <ArrowRight size={20} />
            </Link>
            <Link to="/charities" className="btn btn-secondary btn-xl">
              <Heart size={20} /> Browse Charities
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section style={{ padding: 'var(--space-2xl) 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="container">
          <div className="grid-4" style={{ textAlign: 'center' }}>
            {STATS.map(stat => (
              <div key={stat.label} className="animate-fade-in">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900 }} className="text-gradient">
                  {stat.value}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
            <div className="badge badge-green" style={{ margin: '0 auto 16px' }}><Zap size={12} /> How It Works</div>
            <h2 className="heading-xl">Three Steps. Massive Impact.</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
              We've built the most rewarding way to play golf — where every score is a chance to win and give back.
            </p>
          </div>
          <div className="grid-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="card card-hover card-gradient animate-fade-in" style={{ animationDelay: `${i * 0.1}s`, position: 'relative' }}>
                <div style={{ 
                  fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 900,
                  color: 'rgba(101, 88, 245, 0.08)', position: 'absolute', top: 16, right: 20, lineHeight: 1
                }}>{item.step}</div>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white', marginBottom: 'var(--space-lg)'
                }}>
                  {item.icon}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: 8, fontSize: '1.05rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE POOL */}
      <section style={{ padding: 'var(--space-4xl) 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
            <div className="badge badge-gold" style={{ margin: '0 auto 16px' }}><Trophy size={12} /> Prize Pool</div>
            <h2 className="heading-xl">Win. Every. Month.</h2>
          </div>
          <div className="grid-3">
            {PRIZES.map((prize, i) => (
              <div key={prize.match} className="card card-hover" style={{
                textAlign: 'center',
                animationDelay: `${i * 0.1}s`,
                borderColor: i === 0 ? 'rgba(255, 215, 0, 0.3)' : 'var(--color-border)',
                background: i === 0 ? 'rgba(255, 215, 0, 0.05)' : 'var(--color-bg-card)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>{prize.icon}</div>
                <div className={`badge ${prize.tier}`} style={{ margin: '0 auto 16px' }}>{prize.type}</div>
                <h3 className="heading-xl text-gold">{prize.share}</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>of monthly pool</p>
                <p style={{ color: 'var(--color-text-primary)', marginTop: 16, fontWeight: 600 }}>{prize.match}</p>
                {prize.rollover && (
                  <div style={{ marginTop: 12 }}>
                    <span className="badge badge-gold">🔄 Jackpot Rollover</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY SECTION */}
      <section style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: 'var(--space-3xl)' }}>
            <div>
              <div className="badge badge-green" style={{ marginBottom: 20 }}><Heart size={12} /> Charitable Impact</div>
              <h2 className="heading-xl">Play For Something Bigger</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 16, lineHeight: 1.8 }}>
                Every subscription contributes at least 10% directly to your chosen charity. Choose from our curated directory and track your cumulative impact month after month.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
                {['10% minimum charity contribution', 'Voluntarily increase your giving percentage', 'Independent donation option available', 'Browse & support specific charity events'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0, 229, 160, 0.15)', border: '1px solid rgba(0, 229, 160, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={12} color="var(--color-secondary)" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/charities" className="btn btn-green btn-lg" style={{ marginTop: 32, display: 'inline-flex' }}>
                Browse All Charities <ChevronRight size={18} />
              </Link>
            </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {featuredCharities.length > 0 ? (
                  featuredCharities.map((charity, i) => (
                    <div key={charity.id} className="card card-hover" style={{ padding: 'var(--space-lg)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: COLOR_PALETTE[i % COLOR_PALETTE.length], opacity: 0.7, marginBottom: 10 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{charity.name}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }} className="text-gradient">£{(Math.random() * 5000 + 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>raised</div>
                    </div>
                  ))
                ) : (
                  [
                    { name: 'Cancer Research UK', amount: '£2,400', color: 'var(--color-primary)' },
                    { name: 'Mind', amount: '£1,800', color: 'var(--color-secondary)' },
                    { name: "St Giles Hospice", amount: '£3,100', color: 'var(--color-accent)' },
                    { name: 'Age UK', amount: '£1,200', color: 'var(--color-gold)' },
                  ].map((charity) => (
                    <div key={charity.name} className="card card-hover" style={{ padding: 'var(--space-lg)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: charity.color, opacity: 0.7, marginBottom: 10 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{charity.name}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }} className="text-gradient">{charity.amount}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>raised</div>
                    </div>
                  ))
                )}
              </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-4xl) 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-primary" style={{ width: 600, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        <div className="container-sm" style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge badge-primary" style={{ margin: '0 auto 20px' }}><TrendingUp size={12} /> Start Today</div>
          <h2 className="heading-xl">Ready to Play for Good?</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 12, marginBottom: 32 }}>
            Join thousands of players making their golf scores count for something bigger.
          </p>
          <Link to={user ? '/dashboard' : '/auth?signup=true'} className="btn btn-primary btn-xl" id="main-cta-btn">
            Subscribe from £9.99/mo <ArrowRight size={20} />
          </Link>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 16, fontSize: '0.85rem' }}>
            Cancel anytime · No commitment · PCI-compliant payments
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            <Heart size={18} color="var(--color-primary)" fill="var(--color-primary)" />
            Digital Heroes
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Home', 'Charities', 'How It Works', 'Subscribe'].map(item => (
              <Link key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                {item}
              </Link>
            ))}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Digital Heroes · digitalheroes.co.in · All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
