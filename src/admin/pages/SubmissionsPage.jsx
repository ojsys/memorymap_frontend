import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import AdminLayout from '../components/AdminLayout'

const STATUS_META = {
  SUBMITTED:    { label: 'Submitted',     color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  UNDER_REVIEW: { label: 'Under Review',  color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  NEEDS_INFO:   { label: 'Needs Info',    color: 'text-orange-400', bg: 'bg-orange-500/15' },
  APPROVED:     { label: 'Approved',      color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  REJECTED:     { label: 'Rejected',      color: 'text-red-400',    bg: 'bg-red-500/15' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { label: status, color: 'text-slate-400', bg: 'bg-slate-500/15' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  )
}

const FILTER_OPTIONS = [
  { value: '',             label: 'All' },
  { value: 'SUBMITTED',   label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'NEEDS_INFO',  label: 'Needs Info' },
  { value: 'APPROVED',    label: 'Approved' },
  { value: 'REJECTED',    label: 'Rejected' },
]

export default function SubmissionsPage() {
  const [submissions, setSubs]   = useState([])
  const [loading, setLoading]    = useState(true)
  const [statusFilter, setFilter] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const filtered = await api.get('/submissions/', { params: statusFilter ? { status: statusFilter } : {} })
      setSubs(filtered.data.results ?? filtered.data)
    } catch {
      setSubs([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Community Submissions</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review and verify community-submitted victim records</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ backgroundColor: '#0d1117' }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ward</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted by</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Consents</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Received</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">Loading…</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">No submissions found.</td>
                </tr>
              ) : submissions.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <td className="px-5 py-3.5 text-white font-medium">
                    {s.victim_name || <span className="text-slate-500 italic">Name withheld</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{s.community_ward}</td>
                  <td className="px-5 py-3.5 text-slate-400">{s.year_of_death ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400">{s.submitter_relationship || 'Anonymous'}</td>
                  <td className="px-5 py-3.5">
                    {s.submitter_consents
                      ? <span className="text-emerald-400 text-xs">Yes</span>
                      : <span className="text-red-400 text-xs">No</span>}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/admin-panel/submissions/${s.id}`}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
