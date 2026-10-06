import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { Modal, ConfirmDialog } from '../components/Modal'
import { inputCls, inputStyle } from '../components/formStyles'
import { useToast } from '../components/Toast'
import api from '../api'

const EMPTY = { victim: '', interviewee_role: '', date_recorded: '', transcript: '', audio_file: null }

export default function OralHistoriesAdminPage() {
  const toast    = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [editing, setEditing]   = useState(null)   // null = closed, 'new', or item
  const [victims, setVictims]   = useState([])     // for victim select
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const PAGE_SIZE = 25

  const load = useCallback(() => {
    api.get(`/oral-histories/?page=${page}&page_size=${PAGE_SIZE}`).then(r => {
      setItems(r.data.results ?? [])
      setTotal(r.data.count ?? 0)
    })
  }, [page])

  useEffect(() => { load() }, [load])

  const loadVictims = useCallback(() => {
    if (victims.length) return
    api.get('/victims/?page_size=500&ordering=full_name').then(r => setVictims(r.data.results ?? []))
  }, [victims.length])

  const openNew = useCallback(() => {
    loadVictims()
    setForm(EMPTY)
    setEditing('new')
  }, [loadVictims])

  useEffect(() => {
    if (location.pathname.endsWith('/new')) openNew()
  }, [location.pathname, openNew])

  const openEdit = item => {
    loadVictims()
    setForm({
      victim: String(item.victim), interviewee_role: item.interviewee_role ?? '',
      date_recorded: item.date_recorded ?? '', transcript: item.transcript ?? '', audio_file: null,
    })
    setEditing(item)
  }

  const close = () => {
    setEditing(null)
    if (location.pathname.endsWith('/new')) navigate('/admin-panel/oral-histories', { replace: true })
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.victim) { toast('Please select a victim.', 'error'); return }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('victim', form.victim)
      data.append('interviewee_role', form.interviewee_role)
      data.append('date_recorded', form.date_recorded)
      data.append('transcript', form.transcript)
      if (form.audio_file) data.append('audio_file', form.audio_file)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (editing === 'new') {
        await api.post('/oral-histories/', data, { headers })
        toast('Oral history added.', 'success')
      } else {
        await api.patch(`/oral-histories/${editing.id}/`, data, { headers })
        toast('Oral history updated.', 'success')
      }
      close()
      load()
    } catch {
      toast('Failed to save oral history.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/oral-histories/${deleting.id}/`)
      toast('Oral history deleted.', 'success')
      setDeleting(null)
      load()
    } catch {
      toast('Failed to delete oral history.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isNew = editing === 'new'

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Oral Histories</h1>
            <p className="text-slate-500 text-sm mt-1">{total} records</p>
          </div>
          <button
            onClick={() => navigate('/admin-panel/oral-histories/new')}
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
            style={{ gridTemplateColumns: '2fr 2fr 1fr 80px 120px', backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
            <span>VICTIM</span><span>INTERVIEWEE ROLE</span><span>DATE</span><span>AUDIO</span><span className="text-right">ACTIONS</span>
          </div>
          {items.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No oral histories yet.</div>
          )}
          {items.map(h => (
            <div key={h.id} className="grid items-center px-4 py-4 border-b"
              style={{ gridTemplateColumns: '2fr 2fr 1fr 80px 120px', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{h.victim_name ?? `Victim #${h.victim}`}</p>
                {h.transcript && <p className="text-xs text-slate-500 truncate">{h.transcript}</p>}
              </div>
              <p className="text-sm text-slate-400">{h.interviewee_role || '—'}</p>
              <p className="text-sm text-slate-400">{h.date_recorded || '—'}</p>
              <div>
                {h.audio_file
                  ? <a href={h.audio_file} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 font-medium hover:underline">Audio ✓</a>
                  : <span className="text-xs text-slate-600">Text only</span>}
              </div>
              <div className="flex justify-end gap-1">
                <button onClick={() => openEdit(h)} className="px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5">Edit</button>
                <button onClick={() => setDeleting(h)} className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-white/5">Delete</button>
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

      {editing && (
        <Modal title={isNew ? 'Add oral history' : 'Edit oral history'} onClose={close}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Victim <span className="text-red-400">*</span></label>
              <select value={form.victim} onChange={set('victim')} className={inputCls} style={inputStyle}>
                <option value="">{victims.length ? 'Select victim…' : 'Loading…'}</option>
                {victims.map(v => <option key={v.id} value={v.id}>{v.display_name} — {v.community_ward}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Interviewee role</label>
              <input type="text" value={form.interviewee_role} onChange={set('interviewee_role')}
                placeholder="e.g. Sister of victim, Community elder"
                className={inputCls} style={inputStyle} />
              <p className="text-xs text-slate-600 mt-1">Role only — never the interviewee's name.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date recorded</label>
              <input type="date" value={form.date_recorded} onChange={set('date_recorded')} className={inputCls} style={inputStyle} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {isNew || !editing.audio_file ? 'Audio file (MP3 / WAV, max 50 MB)' : 'Replace audio file (leave empty to keep current)'}
              </label>
              <input type="file" accept="audio/*" onChange={e => setForm(f => ({ ...f, audio_file: e.target.files[0] }))}
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-500/20 file:text-blue-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Transcript</label>
              <textarea value={form.transcript} onChange={set('transcript')} rows={6}
                placeholder="Written transcript of the testimony…"
                className={`${inputCls} resize-y`} style={inputStyle} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#3b82f6' }}>
                {saving ? 'Saving…' : isNew ? 'Save oral history' : 'Save changes'}
              </button>
              <button type="button" onClick={close}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete oral history?"
          message={`This permanently removes the testimony for ${deleting.victim_name ?? 'this victim'}${deleting.audio_file ? ', including its audio file' : ''}. This cannot be undone.`}
          busy={saving}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </AdminLayout>
  )
}
