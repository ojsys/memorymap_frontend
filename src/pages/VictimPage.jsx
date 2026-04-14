import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

export default function VictimPage() {
  const { id } = useParams()
  const [victim, setVictim] = useState(null)
  const [histories, setHistories] = useState([])

  useEffect(() => {
    axios.get(`/api/victims/${id}/`).then(res => setVictim(res.data))
    axios.get(`/api/oral-histories/?victim=${id}`).then(res => setHistories(res.data.results))
  }, [id])

  if (!victim) return (
    <div className="p-8 dark:text-slate-500 text-slate-400">Loading…</div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/register" className="text-sm dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 transition-colors mb-8 block">
        ← Back to register
      </Link>

      <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{victim.display_name}</h1>
      <p className="dark:text-slate-400 text-slate-500 text-sm mb-8">
        {victim.community_ward} · {victim.effective_year ?? 'Year unknown'}
      </p>

      <dl
        className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-10 rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {victim.age_at_death && (
          <>
            <dt className="dark:text-slate-500 text-slate-400">Age at death</dt>
            <dd className="dark:text-slate-200 text-slate-700">{victim.age_at_death}</dd>
          </>
        )}
        {victim.gender && (
          <>
            <dt className="dark:text-slate-500 text-slate-400">Gender</dt>
            <dd className="dark:text-slate-200 text-slate-700">{GENDER_LABELS[victim.gender] ?? '—'}</dd>
          </>
        )}
        {victim.cause_of_death && (
          <>
            <dt className="dark:text-slate-500 text-slate-400">Cause of death</dt>
            <dd className="dark:text-slate-200 text-slate-700">{victim.cause_of_death}</dd>
          </>
        )}
        {victim.source && (
          <>
            <dt className="dark:text-slate-500 text-slate-400">Source</dt>
            <dd className="dark:text-slate-200 text-slate-700">{victim.source}</dd>
          </>
        )}
      </dl>

      {victim.biographical_note && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-4">Biography</h2>
          <p className="dark:text-slate-300 text-slate-600 leading-relaxed whitespace-pre-line">{victim.biographical_note}</p>
        </section>
      )}

      {histories.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-4">Oral Histories</h2>
          <div className="flex flex-col gap-4">
            {histories.map(h => (
              <div key={h.id} className="rounded-xl p-5"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-xs dark:text-slate-500 text-slate-400 mb-3">
                  {h.interviewee_role && <span>{h.interviewee_role}</span>}
                  {h.date_recorded && <span> · {h.date_recorded}</span>}
                </p>
                {h.audio_file && (
                  <audio controls className="w-full mb-3">
                    <source src={h.audio_file} />
                  </audio>
                )}
                {h.transcript && (
                  <p className="text-sm dark:text-slate-300 text-slate-600 whitespace-pre-line leading-relaxed">{h.transcript}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
