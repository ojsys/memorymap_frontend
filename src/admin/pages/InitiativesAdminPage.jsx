import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import api from '../api'

const inputCls  = "w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
const inputStyle = { backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }

const EMPTY = { name: '', organising_body: '', description: '', date: '', location_name: '', url: '' }

export default function InitiativesAdminPage() {
  const toast = useToast()
  const [items, setItems]       = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)

  const load = () => api.get('/initiatives/?page_size=100&ordering=-date').then(r => setItems(r.data.results ?? []))
  useEffect(() => { load() }, [])

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (item) => {
    setEditing(item.id)
    setForm({ name: item.name, organising_body: item.organising_body, description: item.description,
              date: item.date ?? '', location_name: item.location_name ?? '', url: item.url ?? '' })
    setShowForm(true)
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim() || !form.organising_body.trim() || !form.description.trim()) {
      toast('Name, organising body, and description are required.', 'error'); return
    }
    setSaving(true)
    try {
      const payload = { ...form, date: form.date || null, url: form.url || null, location_name: form.location_name || '' }
      if (editing) {
        await api.patch(`/initiatives/${editing}/`, payload)
        toast('Initiative updated.', 'success')
      } else {
        await api.post('/initiatives/', payload)
        toast('Initiative added.', 'success')
      }
      setShowForm(false)
      load()
    } catch {
      toast('Failed to save initiative.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Community Initiatives</h1>
            <p className="text-slate-500 text-sm mt-1">{items.length} initiatives</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: '#3b82f6' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add initiative
          </button>
        </div>

        <div className="space-y-3">
          {items.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-sm rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              No initiatives yet. Add the first one.
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-4 rounded-xl p-5"
              style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  {item.date && <span className="text-xs text-slate-500 shrink-0">{item.date}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">{item.organising_body}{item.location_name && ` · ${item.location_name}`}</p>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{item.description}</p>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">{item.url}</a>}
              </div>
              <button onClick={() => openEdit(item)} className="text-slate-600 hover:text-blue-400 transition-colors shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl p-6 space-y-4 relative"
            style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{editing ? 'Edit initiative' : 'Add initiative'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            {[
              { key: 'name',             label: 'Initiative name',    required: true, placeholder: 'e.g. Annual Remembrance March' },
              { key: 'organising_body',  label: 'Organising body',    required: true, placeholder: 'e.g. Stafanos Foundation' },
              { key: 'location_name',    label: 'Location',           placeholder: 'e.g. Angwan Rogo Community Hall' },
              { key: 'url',              label: 'Website / link',     placeholder: 'https://…' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input type="text" value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className={inputCls} style={inputStyle} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={set('date')} className={inputCls} style={inputStyle} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea value={form.description} onChange={set('description')} rows={4}
                placeholder="Describe the initiative and its purpose…"
                className={`${inputCls} resize-y`} style={inputStyle} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#3b82f6' }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add initiative'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}
