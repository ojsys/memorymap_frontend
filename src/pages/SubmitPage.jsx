import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const WARDS = [
  'Angwan Rukuba', 'Angwan Rogo', 'Bauchi Road', 'Bassa', 'Bukuru',
  'Congo Russia', 'Dadin Kowa', 'Du', 'Farin Gada', 'Gangare',
  'Gyel', 'Hwolshe', 'Jenta Adamu', 'Jenta Apata', 'Jos East',
  'Jos North', 'Jos South', 'Kabong', 'Kwall', 'Kwang',
  'Laranto', 'Libertad', 'Mista Ali', 'Nassarawa', 'Naraguta',
  'Naraguta B', 'Rantya', 'Rikkos', 'Rukuba Road', 'Shen',
  'Tafawa Balewa', 'Tudun Wada', 'University', 'Vwang', 'Zawan',
]

const INITIAL = {
  victim_name: '', victim_age: '', victim_gender: '',
  community_ward: '', year_of_death: '', cause_of_death: '',
  story: '', home_lat: '', home_lng: '',
  submitter_name: '', submitter_relationship: '',
  submitter_contact: '', submitter_consents: false,
}

// Shared input style helper
const inputStyle = (hasError = false) => ({
  backgroundColor: 'var(--bg-input)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
  color: 'inherit',
})

const cardStyle = (hasError = false) => ({
  backgroundColor: 'var(--bg-surface)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
})

export default function SubmitPage() {
  const submitHeading     = useContent('submit_heading',        'Submit a Record')
  const submitSubheading  = useContent('submit_subheading',     'Help preserve the memory of someone lost to violence in your community. All submissions are reviewed by our Community Verification Team before publication.')
  const submitPrivacyNote = useContent('submit_privacy_notice', 'Submitter information is never published and is only used for follow-up if the verification team needs clarification.')

  const [form, setForm]        = useState(INITIAL)
  const [errors, setErrors]    = useState({})
  const [submitting, setSub]   = useState(false)
  const [submitted, setDone]   = useState(false)
  const [serverErr, setSrvErr] = useState(null)

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.community_ward.trim()) e.community_ward = 'Community / ward is required.'
    if (!form.story.trim())          e.story = 'Please describe what you know about this person.'
    if (!form.submitter_consents)    e.submitter_consents = 'You must confirm you have authority to share this.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSrvErr(null)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSub(true)
    try {
      const payload = {
        ...form,
        victim_age:    form.victim_age    ? Number(form.victim_age)    : null,
        year_of_death: form.year_of_death ? Number(form.year_of_death) : null,
        home_lat:      form.home_lat      ? Number(form.home_lat)      : null,
        home_lng:      form.home_lng      ? Number(form.home_lng)      : null,
      }
      await axios.post(`${API}/api/submissions/`, payload)
      setDone(true)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        for (const [k, v] of Object.entries(data)) {
          fieldErrors[k] = Array.isArray(v) ? v.join(' ') : v
        }
        setErrors(fieldErrors)
      } else {
        setSrvErr('Something went wrong. Please try again.')
      }
    } finally {
      setSub(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Thank you</h2>
          <p className="dark:text-slate-300 text-slate-600 leading-relaxed">
            Your submission has been received and will be reviewed by our Community Verification Team.
            Every name matters — thank you for helping us preserve this memory.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setForm(INITIAL); setDone(false) }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/15 bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Submit another
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#b8860b' }}
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────
  const labelClass = 'block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1.5'
  const inputClass = 'w-full rounded-lg px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder-slate-600 placeholder-slate-400 outline-none transition-colors'

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link to="/" className="dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 text-sm mb-6 flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 mt-4">{submitHeading}</h1>
          <p className="dark:text-slate-400 text-slate-500 mt-2 leading-relaxed">{submitSubheading}</p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-4 mb-8 flex gap-3 text-sm"
          style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="dark:text-blue-200 text-blue-700">{submitPrivacyNote}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── About the person ── */}
          <section>
            <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
              About the person
            </h2>
            <div className="rounded-xl p-6 space-y-5" style={cardStyle()}>

              {/* Name */}
              <div>
                <label className={labelClass}>
                  Full name <span className="dark:text-slate-500 text-slate-400 font-normal">(leave blank if unknown or to keep anonymous)</span>
                </label>
                <input type="text" value={form.victim_name}
                  onChange={e => set('victim_name', e.target.value)}
                  placeholder="e.g. Yakubu Emmanuel Danladi"
                  className={inputClass} style={inputStyle()} />
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Approximate age at death</label>
                  <input type="number" min="0" max="120" value={form.victim_age}
                    onChange={e => set('victim_age', e.target.value)}
                    placeholder="e.g. 34" className={inputClass} style={inputStyle()} />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={form.victim_gender}
                    onChange={e => set('victim_gender', e.target.value)}
                    className={inputClass} style={inputStyle()}>
                    <option value="">Not specified</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="NR">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Ward */}
              <div>
                <label className={labelClass}>Community / ward <span className="text-red-500">*</span></label>
                <input list="ward-list" type="text" value={form.community_ward}
                  onChange={e => set('community_ward', e.target.value)}
                  placeholder="Start typing a ward name…"
                  className={inputClass} style={inputStyle(!!errors.community_ward)} />
                <datalist id="ward-list">{WARDS.map(w => <option key={w} value={w} />)}</datalist>
                {errors.community_ward && <p className="text-red-500 text-xs mt-1">{errors.community_ward}</p>}
              </div>

              {/* Year + Cause */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Year of death</label>
                  <input type="number" min="1990" max="2030" value={form.year_of_death}
                    onChange={e => set('year_of_death', e.target.value)}
                    placeholder="e.g. 2001" className={inputClass} style={inputStyle()} />
                </div>
                <div>
                  <label className={labelClass}>Cause of death</label>
                  <input type="text" value={form.cause_of_death}
                    onChange={e => set('cause_of_death', e.target.value)}
                    placeholder="e.g. Ethno-religious violence"
                    className={inputClass} style={inputStyle()} />
                </div>
              </div>

              {/* Story */}
              <div>
                <label className={labelClass}>
                  What you know about this person <span className="text-red-500">*</span>
                </label>
                <textarea rows={5} value={form.story}
                  onChange={e => set('story', e.target.value)}
                  placeholder="Please share anything you know — their life, family, what happened, their legacy…"
                  className={`${inputClass} resize-none`} style={inputStyle(!!errors.story)} />
                {errors.story && <p className="text-red-500 text-xs mt-1">{errors.story}</p>}
              </div>

              {/* Coordinates */}
              <div>
                <label className={labelClass}>
                  Location coordinates <span className="dark:text-slate-500 text-slate-400 font-normal">(optional — helps place them on the map)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="any" value={form.home_lat}
                    onChange={e => set('home_lat', e.target.value)}
                    placeholder="Latitude e.g. 9.9167"
                    className={inputClass} style={inputStyle()} />
                  <input type="number" step="any" value={form.home_lng}
                    onChange={e => set('home_lng', e.target.value)}
                    placeholder="Longitude e.g. 8.8921"
                    className={inputClass} style={inputStyle()} />
                </div>
              </div>
            </div>
          </section>

          {/* ── About you ── */}
          <section>
            <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
              About you <span className="dark:text-slate-500 text-slate-400 text-sm font-normal">(optional — never published)</span>
            </h2>
            <div className="rounded-xl p-6 space-y-5" style={cardStyle()}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your name</label>
                  <input type="text" value={form.submitter_name}
                    onChange={e => set('submitter_name', e.target.value)}
                    placeholder="Full name" className={inputClass} style={inputStyle()} />
                </div>
                <div>
                  <label className={labelClass}>Your relationship</label>
                  <input type="text" value={form.submitter_relationship}
                    onChange={e => set('submitter_relationship', e.target.value)}
                    placeholder="e.g. Family member, Neighbour"
                    className={inputClass} style={inputStyle()} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Contact (phone or email)</label>
                <input type="text" value={form.submitter_contact}
                  onChange={e => set('submitter_contact', e.target.value)}
                  placeholder="Only used if verification team needs to follow up"
                  className={inputClass} style={inputStyle()} />
              </div>
            </div>
          </section>

          {/* ── Consent ── */}
          <section>
            <div className="rounded-xl p-6" style={cardStyle(!!errors.submitter_consents)}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative shrink-0 mt-0.5">
                  <input type="checkbox" checked={form.submitter_consents}
                    onChange={e => set('submitter_consents', e.target.checked)}
                    className="sr-only" />
                  <div className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: form.submitter_consents ? '#b8860b' : 'var(--bg-input)',
                      border: `1.5px solid ${form.submitter_consents ? '#b8860b' : 'var(--border-strong)'}`,
                    }}>
                    {form.submitter_consents && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
                  I confirm that I have the authority or community standing to share this information,
                  and I understand that it will be reviewed before any publication. I give consent for
                  this information to be used for the purposes of historical documentation and
                  memorialisation. <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.submitter_consents && (
                <p className="text-red-500 text-xs mt-3 ml-8">{errors.submitter_consents}</p>
              )}
            </div>
          </section>

          {serverErr && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-400"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {serverErr}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link to="/" className="text-sm dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={submitting}
              className="px-8 py-3 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: submitting ? '#8a6508' : '#b8860b' }}>
              {submitting ? 'Submitting…' : 'Submit record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
