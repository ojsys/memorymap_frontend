import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import api from '../api'

const CONSENT_STYLES = {
  CONSENTED: { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  ANONYMOUS: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  PENDING:   { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
}
const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

export default function VictimsAdminPage() {
  const toast = useToast()
  const [victims, setVictims]   = useState([])
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [consent, setConsent]   = useState('')   // filter by consent status
  const [page, setPage]         = useState(1)
  const [changing, setChanging] = useState(null) // id of record being updated
  const PAGE_SIZE = 30

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE, ordering: '-created_at' })
    if (search)  params.set('search', search)
    if (consent) params.set('consent_status', consent)
    api.get(`/victims/?${params}`).then(r => {
      setVictims(r.data.results ?? [])
      setTotal(r.data.count ?? 0)
    })
  }, [page, search, consent])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, consent])

  const changeConsent = async (id, status) => {
    setChanging(id)
    try {
      await api.patch(`/victims/${id}/`, { consent_status: status })
      toast('Consent status updated.', 'success')
      load()
    } catch {
      toast('Failed to update consent status.', 'error')
    } finally {
      setChanging(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Victims</h1>
            <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} total records</p>
          </div>
          <Link
            to="/admin-panel/victims/new"
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add record
          </Link>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search names…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <select
            value={consent}
            onChange={e => setConsent(e.target.value)}
            className="text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <option value="">All statuses</option>
            <option value="CONSENTED">Consented</option>
            <option value="ANONYMOUS">Anonymous</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Header */}
          <div
            className="grid text-xs font-medium text-slate-500 px-4 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 1fr 80px 1fr 160px 80px', backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <span>NAME</span>
            <span>WARD</span>
            <span>YEAR</span>
            <span>GENDER</span>
            <span>CONSENT</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {victims.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No records found.</div>
          )}

          {victims.map((v, i) => {
            const cs = CONSENT_STYLES[v.consent_status] ?? CONSENT_STYLES.PENDING
            return (
              <div
                key={v.id}
                className="grid items-center px-4 py-3.5 border-b"
                style={{ gridTemplateColumns: '2fr 1fr 80px 1fr 160px 80px', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <p className="text-sm font-medium text-white truncate">{v.display_name}</p>
                <p className="text-sm text-slate-400 truncate">{v.community_ward}</p>
                <p className="text-sm text-slate-400">{v.effective_year ?? '—'}</p>
                <p className="text-sm text-slate-400">{GENDER_LABELS[v.gender] ?? '—'}</p>

                {/* Consent dropdown */}
                <select
                  value={v.consent_status}
                  disabled={changing === v.id}
                  onChange={e => changeConsent(v.id, e.target.value)}
                  className="text-xs font-medium rounded-full px-3 py-1.5 focus:outline-none disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}
                >
                  <option value="CONSENTED">CONSENTED</option>
                  <option value="ANONYMOUS">ANONYMOUS</option>
                  <option value="PENDING">PENDING</option>
                </select>

                {/* Edit */}
                <div className="flex justify-end">
                  <Link
                    to={`/admin-panel/victims/${v.id}/edit`}
                    className="text-slate-600 hover:text-blue-400 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 text-sm">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 rounded-lg text-slate-300 disabled:opacity-30"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 rounded-lg text-slate-300 disabled:opacity-30"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
