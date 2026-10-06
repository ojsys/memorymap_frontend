export function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${width} rounded-2xl p-6 space-y-4 my-auto`}
        style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Replaces window.confirm with an on-brand dialog. */
export function ConfirmDialog({ title, message, confirmLabel = 'Delete', danger = true, busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width="max-w-md">
      <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onConfirm} disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: danger ? '#dc2626' : '#3b82f6' }}>
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
      </div>
    </Modal>
  )
}

export function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{Array.isArray(error) ? error.join(' ') : error}</p>}
    </div>
  )
}
