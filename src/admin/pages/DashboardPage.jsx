import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import api from '../api'
import { useContent } from '../../context/ContentContext'

const CONSENT_COLORS = {
  CONSENTED: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  ANONYMOUS: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  PENDING:   { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: accent ? 'rgba(96,165,250,0.08)' : '#141929', border: `1px solid ${accent ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.07)'}` }}
    >
      <p className="text-2xl font-bold" style={{ color: accent ? '#60a5fa' : 'white' }}>
        {value ?? '—'}
      </p>
      <p className="text-xs font-medium mt-1" style={{ color: accent ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.3)', letterSpacing: '0.07em' }}>
        {label}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const adminSubtitle = useContent('admin_subtitle', 'Conflict Documentation Platform')
  const [stats, setStats]           = useState(null)
  const [recent, setRecent]         = useState([])
  const [pending, setPending]       = useState([])
  const [allCount, setAllCount]     = useState(null)
  const [pendingCount, setPendingCount]       = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)

  useEffect(() => {
    api.get('/victims/stats/').then(r => setStats(r.data))
    api.get('/victims/?ordering=-created_at&page_size=8').then(r => {
      setRecent(r.data.results ?? [])
      setAllCount(r.data.count ?? 0)   // staff see every record, including PENDING
    })
    api.get('/victims/?consent_status=PENDING&page_size=5').then(r => {
      setPending(r.data.results ?? [])
      setPendingCount(r.data.count ?? 0)
    })
    api.get('/submissions/?status=SUBMITTED&page_size=1').then(r => setSubmissionCount(r.data.count ?? 0)).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">{adminSubtitle}</p>
          </div>
          <Link
            to="/admin-panel/victims/new"
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add victim record
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="TOTAL RECORDS" value={allCount?.toLocaleString()} />
          <StatCard label="PUBLICLY VISIBLE" value={stats?.total?.toLocaleString()} />
          <StatCard label="ORAL HISTORIES" value={stats?.oral_histories?.toLocaleString()} />
          <StatCard label="PENDING CONSENT" value={pendingCount} accent={pendingCount > 0} />
          <StatCard label="NEW SUBMISSIONS" value={submissionCount} accent={submissionCount > 0} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent additions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm">Recently added</h2>
              <Link to="/admin-panel/victims" className="text-xs text-blue-400 hover:underline">View all →</Link>
            </div>
            <div
              className="rounded-xl overflow-hidden border"
              style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#141929' }}
            >
              {recent.map((v, i) => {
                const c = CONSENT_COLORS[v.consent_status] ?? CONSENT_COLORS.PENDING
                return (
                  <div
                    key={v.id}
                    className="flex items-center gap-4 px-4 py-3.5"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.display_name}</p>
                      <p className="text-xs text-slate-500">{v.community_ward} · {v.effective_year ?? '—'}</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }}
                    >
                      {v.consent_status}
                    </span>
                    <Link
                      to={`/admin-panel/victims/${v.id}/edit`}
                      className="text-slate-600 hover:text-blue-400 transition-colors shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                )
              })}
              {recent.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No records yet.</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Consent queue */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                  Consent queue
                  {pendingCount > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                      {pendingCount}
                    </span>
                  )}
                </h2>
                <Link to="/admin-panel/consent" className="text-xs text-blue-400 hover:underline">Manage →</Link>
              </div>
              <div
                className="rounded-xl border overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#141929' }}
              >
                {pending.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-sm text-slate-500">All records reviewed.</p>
                  </div>
                )}
                {pending.map((v, i) => (
                  <Link
                    key={v.id}
                    to={`/admin-panel/victims/${v.id}/edit`}
                    className="block px-4 py-3 hover:bg-white/5"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <p className="text-sm text-white truncate">{v.display_name}</p>
                    <p className="text-xs text-slate-500">{v.community_ward}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h2 className="font-semibold text-white text-sm mb-4">Quick actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/admin-panel/victims/new',        label: 'Add victim record' },
                  { to: '/admin-panel/oral-histories/new', label: 'Add oral history' },
                  { to: '/admin-panel/initiatives/new',    label: 'Add initiative' },
                  { to: '/admin-panel/consent',            label: 'Review consent queue' },
                  { to: '/admin-panel/submissions',        label: 'Community submissions' },
                ].map(a => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                    style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {a.label}
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
