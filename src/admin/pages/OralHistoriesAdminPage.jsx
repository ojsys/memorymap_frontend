import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import api from '../api'

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}>
        {children}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
      </div>
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
const inputStyle = { backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }

export default function OralHistoriesAdminPage() {
  const toast    = useToast()
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [victims, setVictims]   = useState([])   // for victim select
  const [form, setForm]         = useState({ victim: '', interviewee_role: '', date_recorded: '', transcript: '', audio_file: null })
  const [saving, setSaving]     = useState(false)
  const PAGE_SIZE = 25

  const load = () => {
    api.get(`/oral-histories/?page=${page}&page_size=${PAGE_SIZE}&ordering=-created_at`).then(r => {
      setItems(r.data.results ?? [])
      setTotal(r.data.count ?? 0)
    })
  }

  useEffect(() => { load() }, [page])

  const openForm = () => {
    // Load all victims for select (paginated to 500)
    api.get('/victims/?page_size=500&ordering=full_name').then(r => setVictims(r.data.results ?? []))
    setShowForm(true)
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.victim) { toast('Please select a victim.', 'error'); return }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('victim', form.victim)
      if (form.interviewee_role) data.append('interviewee_role', form.interviewee_role)
      if (form.date_recorded)    data.append('date_recorded', form.date_recorded)
      if (form.transcript)       data.append('transcript', form.transcript)
      if (form.audio_file)       data.append('audio_file', form.audio_file)
      await api.post('/oral-histories/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast('Oral history added.', 'success')
      setShowForm(false)
      setForm({ victim: '', interviewee_role: '', date_recorded: '', transcript: '', audio_file: null })
      load()
    } catch {
      toast('Failed to save oral history.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Oral Histories</h1>
            <p className="text-slate-500 text-sm mt-1">{total} records</p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add oral history
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="grid text-xs font-medium text-slate-500 px-4 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 2fr 1fr 80px', backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
            <span>VICTIM</span><span>INTERVIEWER ROLE</span><span>DATE</span><span>AUDIO</span>
          </div>
          {items.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No oral histories yet.</div>
          )}
          {items.map((h, i) => (
            <div key={h.id} className="grid items-center px-4 py-4 border-b"
              style={{ gridTemplateColumns: '2fr 2fr 1fr 80px', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-sm font-medium text-white">{h.victim_name ?? `Victim #${h.victim}`}</p>
              </div>
              <p className="text-sm text-slate-400">{h.interviewee_role || '—'}</p>
              <p className="text-sm text-slate-400">{h.date_recorded || '—'}</p>
              <div>
                {h.audio_file
                  ? <span className="text-xs text-teal-400 font-medium">Audio ✓</span>
                  : <span className="text-xs text-slate-600">Text only</span>}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2 mt-5 justify-end">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-300 disabled:opacity-30"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}>Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-300 disabled:opacity-30"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}>Next</button>
          </div>
        )}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 relative"
            style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Add oral history</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Victim <span className="text-red-400">*</span></label>
              <select value={form.victim} onChange={set('victim')} className={inputCls} style={inputStyle}>
                <option value="">Select victim…</option>
                {victims.map(v => <option key={v.id} value={v.id}>{v.display_name} — {v.community_ward}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Interviewee role</label>
              <input type="text" value={form.interviewee_role} onChange={set('interviewee_role')}
                placeholder="e.g. Sister of victim, Community elder"
                className={inputCls} style={inputStyle} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date recorded</label>
              <input type="date" value={form.date_recorded} onChange={set('date_recorded')} className={inputCls} style={inputStyle} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Audio file (MP3 / WAV, max 50 MB)</label>
              <input type="file" accept="audio/*" onChange={e => setForm(f => ({ ...f, audio_file: e.target.files[0] }))}
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-500/20 file:text-blue-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Transcript</label>
              <textarea value={form.transcript} onChange={set('transcript')} rows={4}
                placeholder="Written transcript of the testimony…"
                className={`${inputCls} resize-y`} style={inputStyle} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#3b82f6' }}>
                {saving ? 'Saving…' : 'Save oral history'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}
