import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useContent } from '../../context/ContentContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const adminSubtitle = useContent('admin_subtitle', 'Conflict Documentation Platform')
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/admin-panel')
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Invalid username or password.'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0a0f1e' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
            style={{ backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' }}
          >
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin sign in</h1>
          <p className="text-slate-500 text-sm mt-1">Mapping Memory · {adminSubtitle}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm text-red-400"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              required
              autoFocus
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Access restricted to authorised staff only.
        </p>
      </div>
    </div>
  )
}
