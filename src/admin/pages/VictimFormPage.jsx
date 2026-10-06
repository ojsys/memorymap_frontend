import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { ConfirmDialog } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useAuth } from '../AuthContext'
import api from '../api'

const KNOWN_WARDS = [
  'Rikkos','Yan Gwoi','Dogon Karfe','Nasarawa Gwom','Angwan Rogo','Tudun Wada',
  'Gangare','Bauchi Road','Anglo Jos','Nassarawa','Ali Kazaure','Maza Maza',
  'Terminus','Congo Russia','Sarkin Arab','Angwan Soya','Gwong','Katako',
  'Dutse Uku','Rukuba Road','Apata','Bukuru','Dadin Kowa','Farin Gada','Gada Biyu',
  'Jenta','Naraguta','Tafawa Balewa Road','Zaria Road','Rayfield',
  'Tudun Wada South','Angwan Rukuba','Kwariari','Laranto','Tina Junction',
]

const EMPTY = {
  full_name: '', age_at_death: '', gender: 'NR', community_ward: '',
  year_of_death: '', date_of_death: '', cause_of_death: '', biographical_note: '',
  home_lat: '', home_lng: '', incident_lat: '', incident_lng: '',
  burial_lat: '', burial_lng: '', source: '',
  consent_status: 'PENDING', consent_date: '', consent_notes: '',
}

function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
      style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }}
      {...rest}
    />
  )
}

function Textarea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600 resize-y"
      style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }}
    />
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
      style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {children}
    </select>
  )
}

function Section({ title, children }) {
  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">{title}</h3>
      {children}
    </div>
  )
}

function CoordPair({ latVal, lngVal, onLatChange, onLngChange, label }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={latVal} onChange={onLatChange} placeholder="Latitude e.g. 9.917" />
        <Input value={lngVal} onChange={onLngChange} placeholder="Longitude e.g. 8.896" />
      </div>
    </div>
  )
}

export default function VictimFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate  = useNavigate()
  const toast     = useToast()

  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { isSuperuser } = useAuth()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/victims/${id}/`)
      toast('Record deleted.', 'success')
      navigate('/admin-panel/victims')
    } catch {
      toast('Failed to delete record.', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  useEffect(() => {
    if (!isEditing) return
    api.get(`/victims/${id}/`).then(r => {
      const d = r.data
      setForm({
        full_name:         d.full_name ?? d.display_name ?? '',
        age_at_death:      d.age_at_death ?? '',
        gender:            d.gender ?? 'NR',
        community_ward:    d.community_ward ?? '',
        year_of_death:     d.year_of_death ?? '',
        date_of_death:     d.date_of_death ?? '',
        cause_of_death:    d.cause_of_death ?? '',
        biographical_note: d.biographical_note ?? '',
        home_lat:          d.home_lat ?? '',
        home_lng:          d.home_lng ?? '',
        incident_lat:      d.incident_lat ?? '',
        incident_lng:      d.incident_lng ?? '',
        burial_lat:        d.burial_lat ?? '',
        burial_lng:        d.burial_lng ?? '',
        source:            d.source ?? '',
        consent_status:    d.consent_status ?? 'PENDING',
        consent_date:      d.consent_date ?? '',
        consent_notes:     d.consent_notes ?? '',
      })
    }).finally(() => setLoading(false))
  }, [id, isEditing])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.full_name.trim())       e.full_name       = 'Full name is required.'
    if (!form.community_ward.trim())  e.community_ward  = 'Community / ward is required.'
    if (!form.source.trim())          e.source          = 'Source is required.'
    if (!form.year_of_death && !form.date_of_death)
                                      e.year_of_death   = 'Provide at least a year of death.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    // Coerce empty strings to null for numeric/date fields
    const nullify = (v) => (v === '' || v === null || v === undefined) ? null : v
    const payload = {
      ...form,
      age_at_death:  nullify(form.age_at_death)  ? Number(form.age_at_death)  : null,
      year_of_death: nullify(form.year_of_death) ? Number(form.year_of_death) : null,
      date_of_death: nullify(form.date_of_death),
      home_lat:      nullify(form.home_lat),
      home_lng:      nullify(form.home_lng),
      incident_lat:  nullify(form.incident_lat),
      incident_lng:  nullify(form.incident_lng),
      burial_lat:    nullify(form.burial_lat),
      burial_lng:    nullify(form.burial_lng),
      consent_date:  nullify(form.consent_date),
    }

    try {
      if (isEditing) {
        await api.patch(`/victims/${id}/`, payload)
        toast('Record updated successfully.', 'success')
      } else {
        await api.post('/victims/', payload)
        toast('Record created successfully.', 'success')
        navigate('/admin-panel/victims')
      }
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        toast('Please fix the errors below.', 'error')
      } else {
        toast('Failed to save record.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <AdminLayout>
      <div className="p-8 text-slate-500">Loading…</div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link to="/admin-panel/victims" className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit victim record' : 'Add victim record'}
          </h1>
        </div>
        <p className="text-slate-500 text-sm mb-8 ml-7">
          All fields marked <span className="text-red-400">*</span> are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identity */}
          <Section title="Identity">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" required error={errors.full_name}>
                <Input value={form.full_name} onChange={set('full_name')} placeholder="e.g. Emmanuel Yakubu" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={set('gender')}>
                  <option value="NR">Not recorded</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </Select>
              </Field>
              <Field label="Age at death" hint="Approximate age is acceptable.">
                <Input type="number" value={form.age_at_death} onChange={set('age_at_death')} placeholder="e.g. 34" min={0} max={120} />
              </Field>
              <Field label="Community / Ward" required error={errors.community_ward}>
                <input
                  list="wards-list"
                  value={form.community_ward}
                  onChange={set('community_ward')}
                  placeholder="e.g. Angwan Rogo"
                  className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                  style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <datalist id="wards-list">
                  {KNOWN_WARDS.map(w => <option key={w} value={w} />)}
                </datalist>
              </Field>
            </div>
          </Section>

          {/* Death details */}
          <Section title="Death details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year of death" required error={errors.year_of_death} hint="Use this if exact date is unknown.">
                <Input type="number" value={form.year_of_death} onChange={set('year_of_death')} placeholder="e.g. 2001" min={1990} max={2030} />
              </Field>
              <Field label="Date of death" hint="Overrides year field if provided.">
                <Input type="date" value={form.date_of_death} onChange={set('date_of_death')} />
              </Field>
              <Field label="Cause of death" className="col-span-2">
                <Input value={form.cause_of_death} onChange={set('cause_of_death')} placeholder="e.g. Shot during violence" />
              </Field>
            </div>
          </Section>

          {/* Biography */}
          <Section title="Biography & source">
            <Field label="Biographical note" hint="Short life story, occupation, family context. Leave blank if unknown.">
              <Textarea rows={4} value={form.biographical_note} onChange={set('biographical_note')} placeholder="Describe the person's life and context…" />
            </Field>
            <Field label="Source" required error={errors.source} hint="e.g. 'Family interview, 2024' or 'Church register, St. Patrick's Jos'">
              <Textarea rows={2} value={form.source} onChange={set('source')} placeholder="How was this record obtained?" />
            </Field>
          </Section>

          {/* Locations */}
          <Section title="Locations (optional)">
            <p className="text-xs text-slate-500 -mt-2">
              Enter decimal coordinates (lat/lng). Leave blank if unknown.
              Use Google Maps to find coordinates — right-click any location and copy the lat/lng.
            </p>
            <CoordPair
              label="Last known home"
              latVal={form.home_lat} lngVal={form.home_lng}
              onLatChange={set('home_lat')} onLngChange={set('home_lng')}
            />
            <CoordPair
              label="Incident / attack site"
              latVal={form.incident_lat} lngVal={form.incident_lng}
              onLatChange={set('incident_lat')} onLngChange={set('incident_lng')}
            />
            <CoordPair
              label="Burial site"
              latVal={form.burial_lat} lngVal={form.burial_lng}
              onLatChange={set('burial_lat')} onLngChange={set('burial_lng')}
            />
          </Section>

          {/* Consent */}
          <Section title="Consent & visibility">
            <div
              className="rounded-lg px-4 py-3 text-xs text-amber-400 mb-2"
              style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              Records set to <strong>PENDING</strong> are hidden from the public until reviewed.
              Only set to <strong>CONSENTED</strong> or <strong>ANONYMOUS</strong> after family or community approval.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consent status" required>
                <Select value={form.consent_status} onChange={set('consent_status')}>
                  <option value="PENDING">PENDING — hidden from public</option>
                  <option value="CONSENTED">CONSENTED — name visible</option>
                  <option value="ANONYMOUS">ANONYMOUS — name withheld</option>
                </Select>
              </Field>
              <Field label="Consent date">
                <Input type="date" value={form.consent_date} onChange={set('consent_date')} />
              </Field>
              <Field label="Consent notes" className="col-span-2" hint="Who gave consent, how it was obtained, etc. Not shown publicly.">
                <Textarea rows={2} value={form.consent_notes} onChange={set('consent_notes')} placeholder="e.g. Verbal consent from elder sister, witnessed by community leader." />
              </Field>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#3b82f6' }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create record'}
            </button>
            <Link
              to="/admin-panel/victims"
              className="px-6 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </Link>
            {isEditing && form.consent_status !== 'PENDING' && (
              <a href={`/victims/${id}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline ml-2">
                View on site ↗
              </a>
            )}
            {isEditing && isSuperuser && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="ml-auto px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                Delete record
              </button>
            )}
          </div>
        </form>

        {confirmDelete && (
          <ConfirmDialog
            title="Delete this victim record?"
            message={`This permanently removes ${form.full_name || 'this record'} and any linked oral histories from the memorial. If the family has withdrawn consent, consider setting the record to PENDING instead, which hides it without losing data.`}
            busy={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </AdminLayout>
  )
}
