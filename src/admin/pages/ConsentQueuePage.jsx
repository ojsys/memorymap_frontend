import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import api from '../api'

const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

export default function ConsentQueuePage() {
  const toast = useToast()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/victims/?consent_status=PENDING&page_size=100&ordering=created_at')
      .then(r => setPending(r.data.results ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id, asAnonymous = false) => {
    setUpdating(id)
    try {
      await api.patch(`/victims/${id}/`, {
        consent_status: asAnonymous ? 'ANONYMOUS' : 'CONSENTED',
        consent_date: new Date().toISOString().split('T')[0],
      })
      toast(asAnonymous ? 'Published anonymously.' : 'Consent approved — record now public.', 'success')
      load()
    } catch {
      toast('Failed to update record.', 'error')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Consent Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Records awaiting consent review before publication.
          </p>
        </div>

        {!loading && pending.length === 0 && (
          <div
            className="rounded-2xl py-16 text-center border"
            style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#141929' }}
          >
            <svg className="w-10 h-10 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white font-medium">All records reviewed</p>
            <p className="text-slate-500 text-sm mt-1">No records are pending consent approval.</p>
          </div>
        )}

        <div className="space-y-3">
          {pending.map(v => (
            <div
              key={v.id}
              className="rounded-xl p-5 border"
              style={{ backgroundColor: '#141929', borderColor: 'rgba(251,191,36,0.15)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{v.display_name}</p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
                    >
                      PENDING
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {v.community_ward}
                    {v.effective_year && <span> · {v.effective_year}</span>}
                    {v.gender && <span> · {GENDER_LABELS[v.gender]}</span>}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/admin-panel/victims/${v.id}/edit`}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Review
                  </Link>
                  <button
                    onClick={() => approve(v.id, true)}
                    disabled={updating === v.id}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}
                  >
                    Anonymous
                  </button>
                  <button
                    onClick={() => approve(v.id, false)}
                    disabled={updating === v.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                  >
                    {updating === v.id ? '…' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
