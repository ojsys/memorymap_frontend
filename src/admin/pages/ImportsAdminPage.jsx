import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '../components/Toast'
import api from '../api'

const STATUS_STYLE = {
  PENDING:  { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  APPROVED: { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  REJECTED: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  )
}

export default function ImportsAdminPage() {
  const toast    = useToast()
  const fileRef  = useRef()
  const [imports, setImports]   = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]  = useState(false)
  const [preview, setPreview]    = useState(null) // newly uploaded import data

  const load = () => api.get('/imports/').then(r => setImports(r.data.results ?? r.data))
  useEffect(() => { load() }, [])

  const uploadFile = async (file) => {
    if (!file) return
    const allowed = ['.csv', '.xlsx', '.xls']
    if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast('Only CSV and Excel (.xlsx) files are supported.', 'error')
      return
    }
    setUploading(true)
    setPreview(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/imports/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPreview(res.data)
      toast('File uploaded. Awaiting superadmin approval.', 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.error ?? 'Upload failed.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    uploadFile(e.dataTransfer.files[0])
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/imports/template/', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mapping_memory_import_template.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Could not download template.', 'error')
    }
  }

  return (
    <AdminLayout>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Import</h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload a CSV or Excel sheet. A superadmin will review it before records are added.
            </p>
          </div>
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white border rounded-xl px-4 py-2 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download template
          </button>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed px-8 py-12 text-center cursor-pointer transition-colors mb-8"
          style={{
            borderColor: dragOver ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            backgroundColor: dragOver ? 'rgba(59,130,246,0.05)' : '#141929',
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => uploadFile(e.target.files[0])} />
          {uploading ? (
            <div className="text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Parsing and validating rows…
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-white font-medium mb-1">Drop your CSV or Excel file here</p>
              <p className="text-slate-500 text-sm">or click to browse · .csv, .xlsx supported</p>
            </>
          )}
        </div>

        {/* Upload validation summary */}
        {preview && (
          <div className="rounded-2xl p-6 mb-8 border"
            style={{ backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-white">Upload complete — awaiting approval</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Total rows',   value: preview.total_rows },
                { label: 'Valid',        value: preview.valid_rows,                    color: '#34d399' },
                { label: 'Invalid',      value: preview.total_rows - preview.valid_rows, color: preview.total_rows - preview.valid_rows > 0 ? '#f87171' : undefined },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0a0f1e' }}>
                  <p className="text-2xl font-bold" style={{ color: s.color ?? 'white' }}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Invalid rows */}
            {preview.rows?.filter(r => !r.is_valid).length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rows with errors</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {preview.rows.filter(r => !r.is_valid).map(row => (
                    <div key={row.id} className="rounded-lg px-3 py-2.5 text-sm"
                      style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <span className="text-red-400 font-medium">Row {row.row_number}</span>
                      <span className="text-slate-400 ml-2">{row.raw_data?.full_name || '(no name)'}</span>
                      <p className="text-xs text-red-400/70 mt-0.5">
                        {Object.entries(row.validation_errors).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-amber-400 mt-4">
              A superadmin must approve this import before any records are added to the database.
            </p>
          </div>
        )}

        {/* Import history */}
        <h2 className="font-semibold text-white text-sm mb-4">Import history</h2>
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="grid text-xs font-medium text-slate-500 px-4 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 1fr 100px 100px 100px 80px', backgroundColor: '#141929', borderColor: 'rgba(255,255,255,0.07)' }}>
            <span>FILE</span><span>UPLOADED BY</span><span>TOTAL</span><span>VALID</span><span>STATUS</span><span className="text-right">REVIEW</span>
          </div>
          {imports.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No imports yet.</div>
          )}
          {imports.map((imp, i) => (
            <div key={imp.id} className="grid items-center px-4 py-3.5 border-b"
              style={{ gridTemplateColumns: '2fr 1fr 100px 100px 100px 80px', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-sm font-medium text-white truncate">{imp.original_filename}</p>
                <p className="text-xs text-slate-500">{new Date(imp.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-slate-400 truncate">{imp.uploaded_by_name}</p>
              <p className="text-sm text-slate-300">{imp.total_rows}</p>
              <p className="text-sm text-slate-300">{imp.valid_rows}</p>
              <StatusBadge status={imp.status} />
              <div className="text-right">
                <Link to={`/admin-panel/imports/${imp.id}`} className="text-xs text-blue-400 hover:underline">
                  {imp.status === 'PENDING' ? 'Review →' : 'View →'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
