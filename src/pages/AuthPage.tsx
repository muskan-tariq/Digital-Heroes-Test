import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Heart, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader } from 'lucide-react'

export default function AuthPage() {
  const [params] = useSearchParams()
  const [isSignup, setIsSignup] = useState(params.get('signup') === 'true')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignup) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (signUpError) throw signUpError
        setSuccess('Account created! Please check your email to confirm, then log in.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        // Navigation is handled automatically by App.tsx when user state changes
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-xl)', position: 'relative', overflow: 'hidden'
    }}>
      <div className="orb orb-primary" style={{ width: 500, height: 500, top: -100, left: -150 }} />
      <div className="orb orb-secondary" style={{ width: 400, height: 400, bottom: -100, right: -100 }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 'var(--space-lg)' }}>
            <span style={{ background: 'var(--gradient-primary)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} color="white" fill="white" />
            </span>
            Digital Heroes
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {isSignup ? 'Join thousands playing for a cause' : 'Sign in to your Digital Heroes account'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ backdropFilter: 'blur(20px)', background: 'rgba(12, 18, 37, 0.85)' }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {isSignup && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input id="signup-name" className="form-input" style={{ paddingLeft: '2.5rem' }}
                    type="text" placeholder="Your full name"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input id="auth-email" className="form-input" style={{ paddingLeft: '2.5rem' }}
                  type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input id="auth-password" className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id={isSignup ? 'signup-btn' : 'login-btn'} type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '0.9rem' }} disabled={loading}>
              {loading ? <Loader size={18} className="animate-spin" /> : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="divider" />

          {/* Demo Login Buttons */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 10, letterSpacing: '0.05em' }}>QUICK DEMO ACCESS</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" 
                onClick={() => { setEmail('admin@test.com'); setPassword('password123'); setIsSignup(false) }} 
                className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                Demo Admin
              </button>
              <button type="button" 
                onClick={() => { setEmail('player@test.com'); setPassword('password123'); setIsSignup(false) }} 
                className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                Demo Player
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess('') }}
              style={{ background: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer' }}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
