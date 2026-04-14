import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const COLOR = {
    success: { bg: '#10b981', border: 'rgba(16,185,129,0.3)' },
    error:   { bg: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    info:    { bg: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white shadow-xl"
            style={{ backgroundColor: '#1e293b', border: `1px solid ${COLOR[t.type]?.border}` }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLOR[t.type]?.bg }}
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
