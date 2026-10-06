import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Field } from '../components/Modal'
import { inputCls, inputStyle } from '../components/formStyles'
import { useToast } from '../components/Toast'
import { useAuth } from '../AuthContext'
import api from '../api'

const ROLE_LABELS = { administrator: 'Administrator', editor: 'Editor', verifier: 'Verifier (CVT)' }

function Card({ title, children }) {
  return (
    <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">{title}</h3>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const toast = useToast()
  const { user, refreshUser } = useAuth()
  const [profile, setProfile]   = useState({ first_name: '', last_name: '', email: '' })
  const [pw, setPw]             = useState({ current_password: '', new_password: '', confirm: '' })
  const [errors, setErrors]     = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (user) setProfile({ first_name: user.first_name ?? '', last_name: user.last_name ?? '', email: user.email ?? '' })
  }, [user])

  const saveProfile = async e => {
    e.preventDefault()
    setSavingProfile(true)
    setErrors({})
    try {
      await api.patch('/me/', profile)
      await refreshUser()
      toast('Profile saved.', 'success')
    } catch (err) {
      setErrors(err.response?.data ?? {})
      toast('Could not save profile.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async e => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) {
      setErrors({ confirm: 'The two new passwords do not match.' })
      return
    }
    setSavingPw(true)
    setErrors({})
    try {
      await api.post('/me/password/', { current_password: pw.current_password, new_password: pw.new_password })
      setPw({ current_password: '', new_password: '', confirm: '' })
      toast('Password changed.', 'success')
    } catch (err) {
      setErrors(err.response?.data ?? {})
      toast('Could not change password.', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  const btn = 'px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60'

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">
            Signed in as <span className="text-slate-300">@{user?.username}</span>
            {user?.role && <> · {ROLE_LABELS[user.role]}</>}
          </p>
        </div>

        <form onSubmit={saveProfile}>
          <Card title="Your details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.first_name}>
                <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Last name" error={errors.last_name}>
                <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} className={inputCls} style={inputStyle} />
              </Field>
            </div>
            <Field label="Email" error={errors.email}>
              <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className={inputCls} style={inputStyle} />
            </Field>
            <button type="submit" disabled={savingProfile} className={btn} style={{ backgroundColor: '#3b82f6' }}>
              {savingProfile ? 'Saving…' : 'Save details'}
            </button>
          </Card>
        </form>

        <form onSubmit={savePassword}>
          <Card title="Change password">
            <Field label="Current password" required error={errors.current_password}>
              <input type="password" required autoComplete="current-password" value={pw.current_password}
                onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="New password" required error={errors.new_password} hint="At least 8 characters; avoid common words.">
              <input type="password" required autoComplete="new-password" value={pw.new_password}
                onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Confirm new password" required error={errors.confirm}>
              <input type="password" required autoComplete="new-password" value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className={inputCls} style={inputStyle} />
            </Field>
            <button type="submit" disabled={savingPw} className={btn} style={{ backgroundColor: '#3b82f6' }}>
              {savingPw ? 'Changing…' : 'Change password'}
            </button>
          </Card>
        </form>
      </div>
    </AdminLayout>
  )
}
