import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { Modal, ConfirmDialog, Field } from '../components/Modal'
import { inputCls, inputStyle } from '../components/formStyles'
import { useToast } from '../components/Toast'
import { useAuth } from '../AuthContext'
import api from '../api'

const ROLES = [
  { value: 'administrator', label: 'Administrator', desc: 'Full access, including staff accounts, import approval and deleting records.' },
  { value: 'editor',        label: 'Editor',        desc: 'Adds and edits victims, oral histories, initiatives and website text.' },
  { value: 'verifier',      label: 'Verifier (CVT)', desc: 'Community Verification Team: reviews public submissions and consent.' },
]
const ROLE_STYLES = {
  administrator: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  editor:        { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  verifier:      { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)' },
}

const EMPTY = { username: '', first_name: '', last_name: '', email: '', role: 'editor', password: '' }

function formatDate(iso) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const toast    = useToast()
  const { user: me } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [editing, setEditing]   = useState(null)   // null = closed, 'new', or user object
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [confirm, setConfirm]   = useState(null)   // user to (de)activate

  const load = useCallback(() => {
    api.get('/staff/users/', { params: search ? { search } : {} })
      .then(r => setUsers(r.data))
      .catch(() => toast('Could not load staff accounts.', 'error'))
      .finally(() => setLoading(false))
  }, [search, toast])

  useEffect(() => { load() }, [load])

  const openNew = useCallback(() => { setEditing('new'); setForm(EMPTY); setErrors({}) }, [])
  useEffect(() => {
    if (location.pathname.endsWith('/new')) openNew()
  }, [location.pathname, openNew])

  const openEdit = u => {
    setEditing(u)
    setForm({ username: u.username, first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role, password: '' })
    setErrors({})
  }
  const close = () => {
    setEditing(null)
    if (location.pathname.endsWith('/new')) navigate('/admin-panel/users', { replace: true })
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    const payload = { ...form }
    if (!payload.password) delete payload.password
    try {
      if (editing === 'new') {
        await api.post('/staff/users/', payload)
        toast(`Account created for ${form.username}.`, 'success')
      } else {
        await api.patch(`/staff/users/${editing.id}/`, payload)
        toast('Account updated.', 'success')
      }
      close()
      load()
    } catch (err) {
      const data = err.response?.data
      if (data?.error) toast(data.error, 'error')
      else if (data && typeof data === 'object') { setErrors(data); toast('Please fix the errors below.', 'error') }
      else toast('Failed to save account.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    const u = confirm
    setSaving(true)
    try {
      await api.patch(`/staff/users/${u.id}/`, { is_active: !u.is_active })
      toast(u.is_active ? `${u.username} can no longer sign in.` : `${u.username} reactivated.`, 'success')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to update account.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isNew = editing === 'new'

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Accounts</h1>
            <p className="text-slate-500 text-sm mt-1">Who can sign in to this admin panel, and what they can do.</p>
          </div>
          <button onClick={() => navigate('/admin-panel/users/new')}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: '#3b82f6' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add staff
          </button>
        </div>

        <input
          type="text" placeholder="Search by name, username or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          className={`${inputCls} max-w-sm mb-5`} style={{ ...inputStyle, backgroundColor: '#141929' }}
        />

        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {loading && <div className="py-12 text-center text-slate-500 text-sm">Loading…</div>}
          {!loading && users.length === 0 && <div className="py-12 text-center text-slate-500 text-sm">No staff accounts found.</div>}
          {users.map((u, i) => {
            const rs = ROLE_STYLES[u.role]
            const isMe = u.id === me?.id
            return (
              <div key={u.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', backgroundColor: '#0f1424', opacity: u.is_active ? 1 : 0.55 }}>
                <div className="flex-1 min-w-48">
                  <p className="text-sm font-medium text-white">
                    {u.full_name || u.username}
                    {isMe && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                    {!u.is_active && <span className="ml-2 text-xs text-red-400">Deactivated</span>}
                  </p>
                  <p className="text-xs text-slate-500">@{u.username}{u.email && ` · ${u.email}`}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                  {ROLES.find(r => r.value === u.role)?.label}
                </span>
                <span className="text-xs text-slate-500 w-36">Last sign-in: {formatDate(u.last_login)}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5">Edit</button>
                  {!isMe && (
                    <button onClick={() => setConfirm(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs hover:bg-white/5 ${u.is_active ? 'text-slate-500 hover:text-red-400' : 'text-emerald-400'}`}>
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-600 mt-4">
          Accounts are deactivated rather than deleted so the record of who entered each victim is preserved.
        </p>
      </div>

      {editing && (
        <Modal title={isNew ? 'Add staff account' : `Edit ${editing.username}`} onClose={close}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.first_name}>
                <input value={form.first_name} onChange={set('first_name')} className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Last name" error={errors.last_name}>
                <input value={form.last_name} onChange={set('last_name')} className={inputCls} style={inputStyle} />
              </Field>
            </div>
            <Field label="Username" required error={errors.username} hint="Used to sign in. Letters, numbers and @/./+/-/_ only.">
              <input value={form.username} onChange={set('username')} required autoComplete="off" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" value={form.email} onChange={set('email')} className={inputCls} style={inputStyle} />
            </Field>

            <Field label="Role" required error={errors.role}>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.value}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                    style={{ backgroundColor: '#0a0f1e', border: `1px solid ${form.role === r.value ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={set('role')} disabled={!isNew && editing.id === me?.id}
                      className="mt-1 accent-blue-500" />
                    <span>
                      <span className="block text-sm text-white">{r.label}</span>
                      <span className="block text-xs text-slate-500">{r.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field
              label={isNew ? 'Password' : 'New password'} required={isNew} error={errors.password}
              hint={isNew ? 'At least 8 characters, not too common. Share it with them securely.' : 'Leave blank to keep their current password.'}>
              <input type="password" value={form.password} onChange={set('password')} required={isNew}
                autoComplete="new-password" className={inputCls} style={inputStyle} />
            </Field>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#3b82f6' }}>
                {saving ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
              </button>
              <button type="button" onClick={close}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.is_active ? 'Deactivate account?' : 'Reactivate account?'}
          message={confirm.is_active
            ? `${confirm.full_name || confirm.username} will no longer be able to sign in. Records they created are kept. You can reactivate them later.`
            : `${confirm.full_name || confirm.username} will be able to sign in again with their existing password.`}
          confirmLabel={confirm.is_active ? 'Deactivate' : 'Reactivate'}
          danger={confirm.is_active}
          busy={saving}
          onConfirm={toggleActive}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AdminLayout>
  )
}
