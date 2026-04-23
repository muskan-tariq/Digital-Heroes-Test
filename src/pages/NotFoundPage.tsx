import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', fontWeight: 900, lineHeight: 1 }} className="text-gradient">404</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Page not found</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary btn-lg">
          <ArrowLeft size={18} />Take me home
        </Link>
      </div>
    </div>
  )
}
