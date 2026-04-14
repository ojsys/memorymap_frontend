import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'

const SECTION_LABELS = {
  site:     'Site-wide',
  hero:     'Hero section',
  stats:    'Stats bar',
  features: 'Platform features',
  footer:   'Footer',
  pages:    'Pages',
  admin:    'Admin panel',
}

function ContentField({ item, onSave }) {
  const [value, setValue]   = useState(item.value)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)
  const toast = useToast()

  const handleChange = (v) => { setValue(v); setDirty(v !== item.value) }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(item.key, value)
      setDirty(false)
      toast('Saved', 'success')
    } catch {
      toast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isLong = item.value.length > 80 || item.value.includes('\n')

  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 mb-1">{item.label}</p>
          <p className="text-xs text-slate-600 font-mono mb-2">{item.key}</p>
          {isLong ? (
            <textarea
              rows={Math.min(6, (value.split('\n').length || 1) + 1)}
              value={value}
              onChange={e => handleChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-y"
              style={{ backgroundColor: '#0a0f1e', border: `1px solid ${dirty ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}` }}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={e => handleChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: '#0a0f1e', border: `1px solid ${dirty ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}` }}
            />
          )}
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="mt-7 shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30"
          style={{
            backgroundColor: dirty ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: dirty ? '#60a5fa' : '#475569',
            border: `1px solid ${dirty ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, items, onSave, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
        style={{ backgroundColor: '#0d1117' }}
      >
        <span className="font-semibold text-white text-sm">{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">{items.length} fields</span>
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-5" style={{ backgroundColor: '#0a0f1e' }}>
          {items.map(item => (
            <ContentField key={item.key} item={item} onSave={onSave} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContentPage() {
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = useCallback(() => {
    api.get('/api/content/admin/')
      .then(r => setGrouped(r.data))
      .catch(() => toast('Could not load content', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleSave = async (key, value) => {
    await api.patch(`/api/content/${key}/`, { value })
    // update local state
    setGrouped(prev => {
      const next = { ...prev }
      for (const section of Object.keys(next)) {
        next[section] = next[section].map(item =>
          item.key === key ? { ...item, value } : item
        )
      }
      return next
    })
  }

  // Order of sections in the UI
  const SECTION_ORDER = ['site', 'hero', 'stats', 'features', 'footer', 'pages', 'admin']
  const orderedSections = [
    ...SECTION_ORDER.filter(s => grouped[s]),
    ...Object.keys(grouped).filter(s => !SECTION_ORDER.includes(s)),
  ]

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Site Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Edit any text shown on the public website. Changes go live immediately.
          </p>
        </div>

        {loading ? (
          <div className="text-slate-500 text-sm py-12 text-center">Loading…</div>
        ) : (
          <div className="space-y-3">
            {orderedSections.map((section, i) => (
              <Section
                key={section}
                title={SECTION_LABELS[section] ?? section}
                items={grouped[section] ?? []}
                onSave={handleSave}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
