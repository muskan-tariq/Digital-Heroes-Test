import { useEffect, useState } from 'react'
import { supabase, type Charity } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Heart, Search, ExternalLink, Globe, ArrowLeft, Loader } from 'lucide-react'

const PLACEHOLDER_CHARITIES: Charity[] = [
  { id: '70868f63-0490-4824-b152-7a0914440c24', name: 'Cancer Research UK', description: 'We are the largest independent cancer research organisation in the UK, supporting research to understand, prevent, diagnose and treat cancer.', image_url: null, website_url: 'https://www.cancerresearchuk.org', created_at: '' },
  { id: 'b2d3e91b-6902-45d2-a7d1-e6e73f9154a1', name: 'Mind', description: 'We provide advice and support to empower anyone experiencing a mental health problem, campaigning to improve services, and reduce stigma.', image_url: null, website_url: 'https://www.mind.org.uk', created_at: '' },
  { id: 'c5e3f1a2-b9d8-4f7c-a6e1-d5b2c9a8f3e4', name: "St Giles Hospice", description: 'Providing outstanding free-of-charge palliative and end-of-life care, support and education for local communities across Staffordshire.', image_url: null, website_url: 'https://www.stgileshospice.com', created_at: '' },
  { id: 'a1b2c3d4-e5f6-4a5b-b6c7-d8e9f0a1b2c3', name: 'Age UK', description: 'We are the country\'s largest charity dedicated to helping everyone make the most of later life, regardless of their age.', image_url: null, website_url: 'https://www.ageuk.org.uk', created_at: '' },
  { id: '5f9a2b7c-3d4e-4b6f-8a9b-c0d1e2f3a4b5', name: 'British Heart Foundation', description: 'Funding lifesaving research into heart and circulatory diseases, and providing information and support to those affected.', image_url: null, website_url: 'https://www.bhf.org.uk', created_at: '' },
  { id: '6a7b8c9d-0e1f-4a2b-3c4d-5e6f7a8b9c0d', name: 'Great Ormond Street Hospital Charity', description: 'Working to ensure children from around the world can access the best care at Great Ormond Street Hospital.', image_url: null, website_url: 'https://www.gosh.org', created_at: '' },
]

const COLOR_PALETTE = ['#6558f5', '#00e5a0', '#ff6b6b', '#ffd700', '#7c3aed', '#0ea5e9']

export default function CharitiesPage() {
  const { user } = useAuthStore()
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCharities = async () => {
      const { data, error } = await supabase.from('charities').select('*').order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setCharities(data)
      } else {
        setCharities(PLACEHOLDER_CHARITIES)
      }
      setLoading(false)
    }
    fetchCharities()
  }, [])

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(5, 8, 17, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            <ArrowLeft size={18} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Back to Home</span>
          </Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            <Heart size={18} color="var(--color-primary)" fill="var(--color-primary)" />
            Digital Heroes
          </Link>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Get Started</Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: 'var(--space-3xl) 0 var(--space-2xl)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-primary" style={{ width: 400, height: 400, top: -100, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container-sm" style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge badge-green" style={{ margin: '0 auto 16px' }}>
            <Heart size={12} /> Our Charity Network
          </div>
          <h1 className="heading-xl">Causes That <span className="text-gradient">Matter</span></h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
            Every subscriber helps fund real change. Explore our partner charities and choose the one that speaks to your heart.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="container" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input id="charity-search"
            className="form-input"
            style={{ paddingLeft: '3rem', borderRadius: 'var(--radius-full)', padding: '0.9rem 1rem 0.9rem 3rem' }}
            placeholder="Search charities by name or cause…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Charities Grid */}
      <div className="container" style={{ paddingBottom: 'var(--space-4xl)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <Loader className="animate-spin" size={40} style={{ margin: 'auto', color: 'var(--color-primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p>No charities found matching your search.</p>
          </div>
        ) : (
          <div className="grid-auto">
            {filtered.map((charity, i) => (
              <div key={charity.id} className="charity-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="charity-card-img" style={{ background: `linear-gradient(135deg, ${COLOR_PALETTE[i % COLOR_PALETTE.length]}33, ${COLOR_PALETTE[(i + 1) % COLOR_PALETTE.length]}11)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Heart size={40} color={COLOR_PALETTE[i % COLOR_PALETTE.length]} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} style={{ opacity: 0.6 }} />
                  </div>
                </div>
                <div className="charity-card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{charity.name}</h3>
                      {charity.is_featured && <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Featured</span>}
                    </div>
                    {charity.website_url && (
                      <a href={charity.website_url} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 2 }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {charity.description}
                  </p>
                  
                  {charity.upcoming_events && (
                    <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>Upcoming Event</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{charity.upcoming_events}</div>
                    </div>
                  )}

                  {charity.website_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      <Globe size={12} />
                      {charity.website_url.replace('https://', '').replace('www.', '').split('/')[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
