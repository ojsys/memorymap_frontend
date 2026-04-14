import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

const JOS_CENTER = [9.917, 8.896]

const PREVIEW_MARKERS = [
  { center: [9.924, 8.891], color: '#60a5fa', r: 8 },
  { center: [9.912, 8.903], color: '#f87171', r: 6 },
  { center: [9.930, 8.910], color: '#34d399', r: 5 },
  { center: [9.908, 8.887], color: '#f87171', r: 9 },
  { center: [9.920, 8.895], color: '#60a5fa', r: 5 },
  { center: [9.916, 8.915], color: '#78716c', r: 6 },
  { center: [9.905, 8.900], color: '#34d399', r: 4 },
]

const FEATURE_ICONS = [
  // Map
  <svg key="map" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>,
  // Register
  <svg key="reg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  // Oral histories
  <svg key="oral" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>,
  // Community
  <svg key="comm" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
]

const FEATURE_COLORS = ['#60a5fa', '#f59e0b', '#f87171', '#34d399']

export default function HomePage() {
  const [stats, setStats] = useState({ victims: '—', histories: '—' })

  // CMS content
  const heroBadge      = useContent('hero_badge',      'JOS NORTH PILOT — PHASE 1')
  const heroHeadline   = useContent('hero_headline',   'Remembering the names behind the numbers')
  const heroHighlight  = useContent('hero_headline_highlight', 'names behind')
  const heroSubtitle   = useContent('hero_subtitle',   'A memorial register and digital map preserving the identities, stories, and places of individuals killed in Plateau State\'s ethno-religious conflicts.')
  const heroQuote      = useContent('hero_quote',      '"If we cannot stop the killings, we can stop the erasure."')
  const heroCtaMap     = useContent('hero_cta_map',    'Explore the map')
  const heroCtaReg     = useContent('hero_cta_register', 'Browse the register')
  const mapAreaLabel   = useContent('map_area_label',    'Phase 1 coverage')

  const statsCommunityValue = useContent('stats_communities_value', '1')
  const statsCommunityLabel = useContent('stats_communities_label', 'COMMUNITY\nPILOTED')
  const statsYearsValue     = useContent('stats_years_value',       '2001–2024')
  const statsYearsLabel     = useContent('stats_years_label',       'YEARS\nDOCUMENTED')
  const statsNamesLabel     = useContent('stats_names_label',       'NAMES\nRECORDED')
  const statsHistoriesLabel = useContent('stats_histories_label',   'ORAL\nHISTORIES')

  const featuresSectionLabel = useContent('features_section_label', 'PLATFORM FEATURES')
  const featuresHeading      = useContent('features_heading',       'Built for memory. Designed for dignity.')
  const featuresSubheading   = useContent('features_subheading',    'Every feature is shaped by the ethical responsibility of working with names of the dead and stories of the living.')

  const featureTitles = [
    useContent('feature_1_title', 'Interactive Memorial Map'),
    useContent('feature_2_title', 'Searchable Register'),
    useContent('feature_3_title', 'Oral History Archive'),
    useContent('feature_4_title', 'Community Initiatives'),
  ]
  const featureDescs = [
    useContent('feature_1_description', 'Colour-coded markers plot last known homes, incident sites, and burial grounds across Jos North.'),
    useContent('feature_2_description', 'Browse and search victim records by name, gender, year, and community ward. Every name preserved with dignity.'),
    useContent('feature_3_description', 'Audio recordings and written testimonies from family members and witnesses, linked to individual profiles.'),
    useContent('feature_4_description', 'A curated record of local peacebuilding and remembrance activities, organised by communities in Plateau State.'),
  ]

  useEffect(() => {
    axios.get('/api/victims/?page_size=1').then(res =>
      setStats(s => ({ ...s, victims: res.data.count }))
    )
    axios.get('/api/oral-histories/?page_size=1').then(res =>
      setStats(s => ({ ...s, histories: res.data.count }))
    )
  }, [])

  // Split headline around the highlight phrase for blue colouring
  const renderHeadline = () => {
    if (!heroHighlight || !heroHeadline.includes(heroHighlight)) {
      return <>{heroHeadline}</>
    }
    const [before, after] = heroHeadline.split(heroHighlight)
    return (
      <>
        {before}
        <span style={{ color: '#60a5fa' }}>{heroHighlight}</span>
        {after}
      </>
    )
  }

  return (
    <div>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 0%, rgba(0,0,0,0.04) 100%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">

          <div>
            <div className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-medium mb-8"
              style={{ borderColor: 'rgba(96,165,250,0.35)', color: '#2563eb', backgroundColor: 'rgba(96,165,250,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {heroBadge}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight dark:text-white text-slate-900 mb-6">
              {renderHeadline()}
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-6 max-w-md">
              {heroSubtitle}
            </p>

            <p className="dark:text-slate-500 text-slate-400 text-sm italic mb-8">
              {heroQuote}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/map"
                className="inline-flex items-center gap-2 border text-sm font-medium rounded-full px-5 py-2.5 transition-all dark:text-white dark:border-white/25 dark:hover:bg-white dark:hover:text-slate-900 text-slate-700 border-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {heroCtaMap}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-5 py-2.5 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 bg-slate-900 text-white hover:bg-slate-700"
              >
                {heroCtaReg}
              </Link>
            </div>
          </div>

          {/* Mini-map */}
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <MapContainer
              center={JOS_CENTER} zoom={13}
              zoomControl={false} scrollWheelZoom={false}
              dragging={false} doubleClickZoom={false}
              attributionControl={false} className="h-full w-full"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {PREVIEW_MARKERS.map((m, i) => (
                <CircleMarker key={i} center={m.center} radius={m.r}
                  pathOptions={{ color: m.color, fillColor: m.color, fillOpacity: 0.85, weight: 1.5 }} />
              ))}
            </MapContainer>
            <div className="absolute bottom-3 right-3 z-[1000] text-xs font-medium px-2 py-1 rounded"
              style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
              {mapAreaLabel}
            </div>
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.15)' }} />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4">
            {[
              { value: stats.victims,      label: statsNamesLabel },
              { value: stats.histories,    label: statsHistoriesLabel },
              { value: statsCommunityValue, label: statsCommunityLabel },
              { value: statsYearsValue,    label: statsYearsLabel },
            ].map((stat, i) => (
              <div key={i} className="py-8 px-2 border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
                <p className="text-3xl font-bold dark:text-white text-slate-900 tabular-nums">{stat.value}</p>
                <p className="text-xs font-medium mt-1.5 whitespace-pre-line leading-relaxed dark:text-slate-600 text-slate-400"
                  style={{ letterSpacing: '0.08em' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section className="py-20 px-6 md:px-10" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest mb-4 text-blue-600 dark:text-blue-400" style={{ letterSpacing: '0.15em' }}>
            {featuresSectionLabel}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white text-slate-900 mb-4">{featuresHeading}</h2>
          <p className="dark:text-slate-400 text-slate-500 text-base max-w-xl mb-12 leading-relaxed">{featuresSubheading}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureTitles.map((title, i) => (
              <div key={i} className="rounded-2xl p-6 border transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${FEATURE_COLORS[i]}18`, color: FEATURE_COLORS[i] }}>
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="font-semibold dark:text-white text-slate-800 text-sm mb-2">{title}</h3>
                <p className="dark:text-slate-500 text-slate-500 text-xs leading-relaxed">{featureDescs[i]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
