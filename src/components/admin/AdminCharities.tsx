import { useEffect, useState } from 'react'
import { supabase, type Charity } from '../../lib/supabase'
import { Plus, Search, Edit3, Trash2, Loader, Save, Globe } from 'lucide-react'

export default function AdminCharities() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Charity> | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchCharities = async () => {
    try {
      const { data, error } = await supabase.from('charities').select('*').order('name')
      if (error) console.error('AdminCharities fetch error:', error.message)
      setCharities(data ?? [])
    } catch (e) {
      console.error('AdminCharities error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharities()
  }, [])

  const filtered = charities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!editing?.name || !editing?.description) return
    setSaving(true)
    
    if (editing.id) {
      await supabase.from('charities').update({
        name: editing.name,
        description: editing.description,
        website_url: editing.website_url,
        image_url: editing.image_url,
        is_featured: editing.is_featured || false,
        upcoming_events: editing.upcoming_events || ''
      }).eq('id', editing.id)
    } else {
      await supabase.from('charities').insert({
        name: editing.name,
        description: editing.description,
        website_url: editing.website_url,
        image_url: editing.image_url,
        is_featured: editing.is_featured || false,
        upcoming_events: editing.upcoming_events || ''
      })
    }
    
    setEditing(null)
    setSaving(false)
    fetchCharities()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charity?')) return
    await supabase.from('charities').delete().eq('id', id)
    fetchCharities()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1>Charity Management</h1>
          <p>Add, edit, and manage charitable organizations on the platform.</p>
        </div>
        <button onClick={() => setEditing({ name: '', description: '', website_url: '' })} className="btn btn-primary">
          <Plus size={18} /> Add Charity
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: '2.5rem' }} 
            placeholder="Search charities..." 
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              {editing.id ? 'Edit Charity' : 'Add New Charity'}
            </h2>
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Charity Name</label>
              <input className="form-input" value={editing.name} 
                onChange={e => setEditing({...editing, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" style={{ minHeight: 100 }} value={editing.description} 
                onChange={e => setEditing({...editing, description: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Upcoming Events (e.g. Golf Days)</label>
              <input className="form-input" value={editing.upcoming_events || ''} 
                onChange={e => setEditing({...editing, upcoming_events: e.target.value})} placeholder="e.g. Charity Golf Day - June 15th" />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="is_featured" checked={editing.is_featured || false} 
                onChange={e => setEditing({...editing, is_featured: e.target.checked})} />
              <label htmlFor="is_featured" className="form-label" style={{ marginBottom: 0 }}>Feature this charity on homepage</label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? <Loader className="animate-spin" size={18} /> : <><Save size={18} /> Save Charity</>}
              </button>
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-auto">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', gridColumn: '1 / -1' }}>
            <Loader className="animate-spin" size={36} style={{ color: 'var(--color-primary)', margin: 'auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">❤️</div>
            <p>No charities found.</p>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="charity-card">
              <div className="charity-card-body">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{c.name}</h3>
                    {c.is_featured && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Featured</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} color="var(--color-accent)" />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>{c.description}</p>
                {c.website_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <Globe size={12} /> {c.website_url}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
