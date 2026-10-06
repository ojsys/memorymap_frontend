import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import { useAuth } from '../AuthContext'
import api from '../api'

const STATUS_STYLE = {
  PENDING:  { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  APPROVED: { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  REJECTED: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

const FIELD_LABELS = {
  full_name: 'Name', gender: 'Gender', age_at_death: 'Age',
  community_ward: 'Ward', year_of_death: 'Year', cause_of_death: 'Cause',
  consent_status: 'Consent', source: 'Source',
}

export default function ImportDetailPage() {
  const { id }   = useParams()
  const toast    = useToast()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [imp, setImp]         = useState(null)
  const [notes, setNotes]     = useState('')
  const [acting, setActing]   = useState(null) // 'approve' | 'reject'
  const [isSuperUser, setIsSuperUser] = useState(false)

  useEffect(() => {
    api.get(`/imports/${id}/`).then(r => {
      setImp(r.data)
      setNotes(r.data.review_notes ?? '')
    })
    // Decode JWT to check superuser — simplest: try a superuser-only action
    // Instead, we'll just try to show the buttons and let the API block non-superusers
    // We detect via checking if user is superuser from the token
    try {
      const payload = JSON.parse(atob(localStorage.getItem('mm_admin_token').split('.')[1]))
      // Django simplejwt doesn't include is_superuser by default — we show buttons
      // and let the API reject if not permitted
      setIsSuperUser(true) // show buttons; API enforces permission
    } catch { setIsSuperUser(false) }
  }, [id])

  const act = async (action) => {
    if (!notes.trim() && action === 'reject') {
      toast('Please provide a reason for rejection.', 'error')
      return
    }
    setActing(action)
    try {
      await api.post(`/imports/${id}/${action}/`, { review_notes: notes })
      toast(action === 'approve' ? 'Import approved — records created.' : 'Import rejected.', 'success')
      navigate('/admin-panel/imports')
    } catch (err) {
      toast(err.response?.data?.error ?? `Failed to ${action}.`, 'error')
    } finally {
      setActing(null)
    }
  }

  if (!imp) return <AdminLayout><div className="p-8 text-slate-500">Loading…</div></AdminLayout>

  const ss     = STATUS_STYLE[imp.status]
  const invalid = imp.rows?.filter(r => !r.is_valid) ?? []
  const valid   = imp.rows?.filter(r => r.is_valid)  ?? []
  const isPending = imp.status === 'PENDING'

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-5xl">
        {/* Back */}
        <Link to="/admin-panel/imports" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to imports
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white truncate">{imp.original_filename}</h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                style={{ backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                {imp.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Uploaded by <span className="text-slate-300">{imp.uploaded_by_name}</span>
              {' · '}{new Date(imp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {imp.reviewed_by_name && (
              <p className="text-slate-500 text-sm mt-0.5">
                {imp.status === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
                <span className="text-slate-300">{imp.reviewed_by_name}</span>
                {imp.reviewed_at && ` · ${new Date(imp.reviewed_at).toLocaleDateString('en-GB')}`}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total rows',   value: imp.total_rows },
            { label: 'Valid rows',   value: imp.valid_rows, color: '#34d399' },
            { label: 'Invalid rows', value: imp.total_rows - imp.valid_rows, color: imp.total_rows - imp.valid_rows > 0 ? '#f87171' : '#94a3b8' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center border"
              style={{ backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color ?? 'white' }}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Approval / rejection panel — superadmin only, pending only */}
        {isPending && isSuperUser && (
          <div className="rounded-2xl p-6 mb-8 border"
            style={{ backgroundColor: '#141929', borderColor: 'rgba(251,191,36,0.2)' }}>
            <h2 className="font-semibold text-white mb-1">Review this import</h2>
            <p className="text-slate-500 text-sm mb-4">
              Approving will create <strong className="text-white">{imp.valid_rows}</strong> victim records
              from the valid rows. Invalid rows will be skipped.
              {invalid.length > 0 && (
                <span className="text-amber-400"> {invalid.length} invalid rows will not be imported.</span>
              )}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Review notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Add notes about this import (required when rejecting)…"
                className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600 resize-none"
                style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => act('approve')} disabled={!!acting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#10b981' }}>
                {acting === 'approve' ? 'Approving…' : `Approve & import ${imp.valid_rows} records`}
              </button>
              <button onClick={() => act('reject')} disabled={!!acting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {acting === 'reject' ? 'Rejecting…' : 'Reject import'}
              </button>
            </div>
          </div>
        )}

        {/* Review notes (post-review) */}
        {!isPending && imp.review_notes && (
          <div className="rounded-xl px-4 py-3 mb-6 text-sm"
            style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-slate-400 text-xs font-medium mb-1">Review notes</p>
            <p className="text-slate-300">{imp.review_notes}</p>
          </div>
        )}

        {/* Row preview table */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Row preview</h2>
          <div className="flex gap-2 text-xs">
            <span className="text-green-400">{valid.length} valid</span>
            {invalid.length > 0 && <><span className="text-slate-600">·</span><span className="text-red-400">{invalid.length} invalid</span></>}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="grid text-xs font-medium text-slate-500 px-4 py-3 border-b"
            style={{ gridTemplateColumns: '50px 2fr 1fr 80px 1fr 80px', backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
            <span>ROW</span><span>NAME</span><span>WARD</span><span>YEAR</span><span>SOURCE</span><span>STATUS</span>
          </div>
          {imp.rows?.map(row => {
            const d = row.raw_data
            const hasErrors = !row.is_valid
            return (
              <div key={row.id}
                className="grid items-start px-4 py-3 border-b"
                style={{
                  gridTemplateColumns: '50px 2fr 1fr 80px 1fr 80px',
                  borderColor: 'rgba(255,255,255,0.05)',
                  backgroundColor: hasErrors ? 'rgba(239,68,68,0.03)' : undefined,
                }}>
                <span className="text-xs text-slate-500">{row.row_number}</span>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{d.full_name || <span className="text-slate-600">—</span>}</p>
                  {hasErrors && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {Object.entries(row.validation_errors).slice(0, 2).map(([k, v]) => `${k}: ${v[0]}`).join(' · ')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">{d.community_ward || '—'}</p>
                <p className="text-sm text-slate-400">{d.year_of_death || '—'}</p>
                <p className="text-xs text-slate-500 truncate">{d.source || '—'}</p>
                <span className={`text-xs font-medium ${row.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                  {row.is_valid ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
