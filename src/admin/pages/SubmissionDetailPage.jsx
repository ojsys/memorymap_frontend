import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import AdminLayout from '../components/AdminLayout'

const STATUS_META = {
  SUBMITTED:    { label: 'Submitted',    color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  NEEDS_INFO:   { label: 'Needs Info',   color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  APPROVED:     { label: 'Approved',     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  REJECTED:     { label: 'Rejected',     color: 'text-red-400',     bg: 'bg-red-500/15' },
}

function Field({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-slate-200 leading-relaxed ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-6 space-y-5" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="text-sm font-semibold text-white border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sub, setSub]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notes, setNotes]       = useState('')
  const [acting, setActing]     = useState(null) // 'approve' | 'reject' | 'needs_info'
  const [error, setError]       = useState(null)

  useEffect(() => {
    api.get(`/api/submissions/${id}/`)
      .then(r => { setSub(r.data); setNotes(r.data.review_notes || '') })
      .catch(() => setError('Could not load submission.'))
      .finally(() => setLoading(false))
  }, [id])

  const act = async (action) => {
    setActing(action)
    setError(null)
    try {
      const url = `/api/submissions/${id}/${action === 'needs_info' ? 'request-info' : action}/`
      await api.post(url, { review_notes: notes })
      navigate('/admin-panel/submissions')
    } catch (e) {
      setError(e.response?.data?.error || 'Action failed. Please try again.')
      setActing(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>
      </AdminLayout>
    )
  }

  if (error && !sub) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-red-400">{error}</p>
          <Link to="/admin-panel/submissions" className="text-blue-400 text-sm mt-4 block">← Back to submissions</Link>
        </div>
      </AdminLayout>
    )
  }

  const m = STATUS_META[sub.status] ?? { label: sub.status, color: 'text-slate-400', bg: 'bg-slate-500/15' }
  const isPending = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'].includes(sub.status)

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link to="/admin-panel/submissions" className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All submissions
            </Link>
            <h1 className="text-xl font-bold text-white">
              {sub.victim_name || <span className="text-slate-400 italic">Name withheld</span>}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Submission #{sub.id} · received {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${m.bg} ${m.color}`}>
            {m.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Left column — submission details */}
          <div className="col-span-2 space-y-5">

            <Section title="About the person">
              <div className="grid grid-cols-3 gap-5">
                <Field label="Name" value={sub.victim_name || 'Not provided'} />
                <Field label="Age" value={sub.victim_age} />
                <Field label="Gender" value={{ M: 'Male', F: 'Female', NR: 'Not recorded' }[sub.victim_gender] || 'Not specified'} />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <Field label="Community / Ward" value={sub.community_ward} />
                <Field label="Year of death" value={sub.year_of_death} />
                <Field label="Cause of death" value={sub.cause_of_death || 'Not provided'} />
              </div>
              {sub.home_lat && sub.home_lng && (
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Latitude" value={sub.home_lat} mono />
                  <Field label="Longitude" value={sub.home_lng} mono />
                </div>
              )}
            </Section>

            <Section title="Story / testimony">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{sub.story}</p>
            </Section>

            <Section title="Submitter information (private)">
              <div className="grid grid-cols-2 gap-5">
                <Field label="Name" value={sub.submitter_name || 'Anonymous'} />
                <Field label="Relationship" value={sub.submitter_relationship || 'Not stated'} />
              </div>
              <Field label="Contact" value={sub.submitter_contact || 'Not provided'} />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Consent</p>
                <span className={`text-sm font-medium ${sub.submitter_consents ? 'text-emerald-400' : 'text-red-400'}`}>
                  {sub.submitter_consents ? 'Confirmed — submitter has authority to share' : 'Not confirmed'}
                </span>
              </div>
              {sub.ip_address && <Field label="IP address" value={sub.ip_address} mono />}
            </Section>

            {sub.reviewed_by_name && (
              <Section title="Review history">
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Reviewed by" value={sub.reviewed_by_name} />
                  <Field label="Reviewed at" value={sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleString('en-GB') : null} />
                </div>
                {sub.review_notes && <Field label="Notes" value={sub.review_notes} />}
              </Section>
            )}

            {sub.status === 'APPROVED' && sub.victim && (
              <div
                className="rounded-xl p-4 flex items-center gap-3 text-sm"
                style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-300">
                  Victim record created —{' '}
                  <Link to={`/admin-panel/victims/${sub.victim}/edit`} className="underline">
                    edit record #{sub.victim}
                  </Link>
                </span>
              </div>
            )}
          </div>

          {/* Right column — action panel */}
          <div className="space-y-4">
            <div
              className="rounded-xl p-5 space-y-4 sticky top-6"
              style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h3 className="text-sm font-semibold text-white">Review action</h3>

              {isPending ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes (optional)</label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add any review notes…"
                      className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none resize-none"
                      style={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                      {error}
                    </p>
                  )}

                  <button
                    onClick={() => act('approve')}
                    disabled={!!acting}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: acting === 'approve' ? '#047857' : '#059669' }}
                  >
                    {acting === 'approve' ? 'Approving…' : 'Approve & create record'}
                  </button>

                  <button
                    onClick={() => act('needs_info')}
                    disabled={!!acting}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-amber-400 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    {acting === 'needs_info' ? 'Saving…' : 'Request more info'}
                  </button>

                  <button
                    onClick={() => act('reject')}
                    disabled={!!acting}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-red-400 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    {acting === 'reject' ? 'Rejecting…' : 'Reject submission'}
                  </button>
                </>
              ) : (
                <div className="text-sm text-slate-400 py-4 text-center">
                  This submission has been <strong className={m.color}>{m.label.toLowerCase()}</strong>.
                  <br />No further actions available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
