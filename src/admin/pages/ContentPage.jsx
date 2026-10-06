import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'

// Public pages, each made up of the content sections that appear on it.
const PAGES = [
  { id: 'home', label: 'Home page', url: '/', sections: [
    ['hero', 'Hero (top of page)'],
    ['stats', 'Stats bar'],
    ['features', 'Platform features'],
    ['showcase', 'Victims showcase'],
    ['oral', 'Oral history spotlight'],
    ['initiatives_preview', 'Initiatives preview'],
    ['cta', 'Call-to-action banner'],
  ]},
  { id: 'about', label: 'About page', url: '/about', sections: [
    ['about', 'About page'],
  ]},
  { id: 'pages', label: 'Other pages', url: null, sections: [
    ['pages', 'Register, Map, Submit & Initiatives pages'],
  ]},
  { id: 'site', label: 'Header & footer', url: '/', sections: [
    ['site', 'Site name & navigation'],
    ['footer', 'Footer'],
  ]},
  { id: 'admin', label: 'Admin panel', url: null, sections: [
    ['admin', 'Admin panel'],
  ]},
]
const KNOWN_SECTIONS = new Set(PAGES.flatMap(p => p.sections.map(([s]) => s)))

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
      toast('Saved — live on the site now.', 'success')
    } catch {
      toast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const revert = () => { setValue(item.value); setDirty(false) }

  const isLong = item.value.length > 80 || item.value.includes('\n')

  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-sm font-medium text-slate-200 mb-2">{item.label}</p>
      {isLong ? (
        <textarea
          rows={Math.min(8, Math.max(3, Math.ceil(value.length / 90) + value.split('\n').length - 1))}
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
          onKeyDown={e => { if (e.key === 'Enter' && dirty) save() }}
          className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
          style={{ backgroundColor: '#0a0f1e', border: `1px solid ${dirty ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}` }}
        />
      )}
      {dirty && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={revert} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white">
            Undo changes
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, items, onSave }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#0d1117' }}>
        <span className="font-semibold text-white text-sm">{title}</span>
        <span className="text-xs text-slate-600">{items.length} fields</span>
      </div>
      <div className="px-5" style={{ backgroundColor: '#0a0f1e' }}>
        {items.map(item => (
          <ContentField key={item.key} item={item} onSave={onSave} />
        ))}
      </div>
    </div>
  )
}

export default function ContentPage() {
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [pageId, setPageId]   = useState('home')
  const [search, setSearch]   = useState('')
  const toast = useToast()

  const load = useCallback(() => {
    api.get('/content/admin/')
      .then(r => setGrouped(r.data))
      .catch(() => toast('Could not load content', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleSave = async (key, value) => {
    await api.patch(`/content/${key}/`, { value })
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

  // Any section added on the backend but not mapped above still shows up
  const extra = Object.keys(grouped).filter(s => !KNOWN_SECTIONS.has(s))
  const pages = extra.length
    ? [...PAGES, { id: 'other', label: 'Other', url: null, sections: extra.map(s => [s, s]) }]
    : PAGES

  const q = search.trim().toLowerCase()
  const matches = item => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)

  // When searching, look across every page; otherwise show the selected page
  const visible = q
    ? pages.flatMap(p => p.sections.map(([s, title]) => [s, `${p.label} › ${title}`]))
    : (pages.find(p => p.id === pageId) ?? pages[0]).sections
  const current = pages.find(p => p.id === pageId)

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pages & Text</h1>
          <p className="text-sm text-slate-500 mt-1">
            Edit the words shown on the public website. Each change goes live as soon as you press Save.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search all text on the site…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 mb-6 text-sm text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.08)' }}
        />

        {loading ? (
          <div className="text-slate-500 text-sm py-12 text-center">Loading…</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {!q && (
              <nav className="md:w-44 shrink-0 flex md:flex-col gap-1 overflow-x-auto">
                {pages.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPageId(p.id)}
                    className={`text-left whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${
                      p.id === pageId ? 'bg-blue-500/15 text-blue-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </nav>
            )}

            <div className="flex-1 min-w-0 space-y-4">
              {!q && current?.url && (
                <a href={current.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-400 hover:underline">
                  View {current.label.toLowerCase()} on the site ↗
                </a>
              )}
              {visible.map(([section, title]) => {
                const items = (grouped[section] ?? []).filter(i => !q || matches(i))
                if (!items.length) return null
                return <Section key={section} title={title} items={items} onSave={handleSave} />
              })}
              {visible.every(([s]) => !(grouped[s] ?? []).some(i => !q || matches(i))) && (
                <p className="text-sm text-slate-500 py-8 text-center">
                  {q ? 'No text matches your search.' : 'No editable text for this page yet.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
