import { useContent } from '../context/ContentContext'

export default function Footer() {
  const quote       = useContent('footer_quote',       'If we cannot stop the killings, we can at least stop the erasure.')
  const attribution = useContent('footer_attribution', 'Fwangmun Oscar Danladi — Mapping Memory, University of Iowa, 2025')
  const copyright   = useContent('footer_copyright',   '© 2026 Mapping Memory · Nigeria · All records subject to community consent')
  const linkPrivacy = useContent('footer_link_privacy', 'Privacy')
  const linkEthics  = useContent('footer_link_ethics',  'Ethics policy')
  const linkData    = useContent('footer_link_data',    'Data request')
  const linkContact = useContent('footer_link_contact', 'Contact')

  return (
    <footer style={{ backgroundColor: 'var(--footer-bg)' }}>
      {/* Quote section */}
      <div className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl font-serif leading-none mb-6" style={{ color: '#3b6ea5' }}>&ldquo;</div>
          <blockquote className="text-white text-xl md:text-2xl font-serif italic leading-relaxed mb-6">
            {quote}
          </blockquote>
          <p className="text-slate-400 text-sm">{attribution}</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="text-slate-500 text-xs leading-relaxed">{copyright}</p>
        <nav className="flex items-center gap-5 text-xs text-slate-400">
          <a href="#" className="hover:text-white transition-colors">{linkPrivacy}</a>
          <a href="#" className="hover:text-white transition-colors">{linkEthics}</a>
          <a href="#" className="hover:text-white transition-colors">{linkData}</a>
          <a href="#" className="hover:text-white transition-colors">{linkContact}</a>
        </nav>
      </div>
    </footer>
  )
}
