import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

const MARKER_COLORS = {
  home: '#2563eb',
  incident: '#dc2626',
  burial: '#78716c',
}

const LOCATION_LABELS = {
  home: 'Last known home',
  incident: 'Incident site',
  burial: 'Burial site',
}

const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

// Jos North, Plateau State
const JOS_CENTER = [9.917, 8.896]

// Flies the map to a new centre whenever `center` changes
function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.2 })
  }, [center, map])
  return null
}

function groupByYear(victims) {
  const groups = {}
  victims.forEach(v => {
    const year = v.effective_year ?? 'Unknown'
    if (!groups[year]) groups[year] = []
    groups[year].push(v)
  })
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return Number(b) - Number(a)
  })
}

export default function MapPage() {
  const mapAreaLabel = useContent('map_area_label', 'Jos, Plateau State')
  const [features, setFeatures] = useState([])
  const [victims, setVictims] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const cardRefs = useRef({})

  useEffect(() => {
    axios.get('/api/victims/geojson/').then(res => setFeatures(res.data.features))
    axios.get('/api/victims/?page_size=500').then(res => setVictims(res.data.results ?? []))
  }, [])

  const visibleFeatures = features.filter(f => {
    const p = f.properties
    if (typeFilter !== 'all' && p.location_type !== typeFilter) return false
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false
    return true
  })

  function selectFromTimeline(id) {
    setSelectedId(id)
    const feat = features.find(f => f.properties.id === id)
    if (feat) {
      const [lng, lat] = feat.geometry.coordinates
      setFlyTarget([lat, lng])
    }
  }

  function selectFromMap(id) {
    setSelectedId(prev => {
      if (prev !== id) {
        // Scroll the timeline card into view
        setTimeout(() => {
          cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
      }
      return id
    })
  }

  const yearGroups = groupByYear(victims)

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* ── Timeline panel ── */}
      <aside className="w-72 xl:w-80 flex flex-col shrink-0 overflow-hidden"
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <h2 className="font-semibold text-sm tracking-wide dark:text-white text-slate-800">Memorial Timeline</h2>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {victims.length} {victims.length === 1 ? 'record' : 'records'} · {mapAreaLabel}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-8">
          {yearGroups.map(([year, group]) => (
            <div key={year}>
              {/* Year heading */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold tracking-widest text-amber-500 dark:text-amber-400 uppercase">
                  {year}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sidebar-border)' }} />
                <span className="text-xs dark:text-slate-500 text-slate-400">{group.length}</span>
              </div>

              {/* Cards on a timeline spine */}
              <div className="relative pl-5 border-l-2 space-y-1" style={{ borderColor: 'var(--sidebar-border)' }}>
                {group.map(v => {
                  const isActive = selectedId === v.id
                  return (
                    <button
                      key={v.id}
                      ref={el => (cardRefs.current[v.id] = el)}
                      onClick={() => selectFromTimeline(v.id)}
                      className={`group relative w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 ${
                        isActive ? 'bg-amber-500 shadow-lg' : 'dark:hover:bg-white/8 hover:bg-black/5'
                      }`}
                    >
                      {/* Connector dot on spine */}
                      <span
                        className={`absolute -left-[1.45rem] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                          isActive
                            ? 'bg-amber-400 border-amber-400'
                            : 'dark:bg-sidebar-bg dark:border-stone-600 dark:group-hover:border-stone-400 bg-white border-slate-300 group-hover:border-slate-500'
                        }`}
                        style={{ backgroundColor: isActive ? undefined : 'var(--sidebar-bg)' }}
                      />

                      <p className={`font-medium text-sm leading-tight ${isActive ? 'text-stone-900' : 'dark:text-slate-100 text-slate-700'}`}>
                        {v.display_name}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-amber-900' : 'dark:text-slate-400 text-slate-500'}`}>
                        {v.community_ward}
                        {v.gender && v.gender !== 'NR' && (
                          <span> · {GENDER_LABELS[v.gender]}</span>
                        )}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {victims.length === 0 && (
            <p className="text-sm dark:text-slate-500 text-slate-400 text-center pt-8">No records yet.</p>
          )}
        </div>
      </aside>

      {/* ── Map panel ── */}
      <div className="flex-1 relative">

        {/* Filter bar overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 bg-white rounded-full shadow-lg border border-stone-200 px-1 py-1 text-xs">
          {[
            { value: 'all', label: 'All sites' },
            { value: 'home', label: 'Homes' },
            { value: 'incident', label: 'Incidents' },
            { value: 'burial', label: 'Burials' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                typeFilter === opt.value
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-5 bg-stone-200 mx-1" />
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="text-stone-600 bg-transparent focus:outline-none pr-2 pl-1 py-1 cursor-pointer"
          >
            <option value="all">All genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="NR">Not recorded</option>
          </select>
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-6 right-4 z-[1000] bg-white rounded-xl shadow-md border border-stone-200 px-3.5 py-3 text-xs">
          {Object.entries(LOCATION_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2 py-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: MARKER_COLORS[type] }}
              />
              <span className="text-stone-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Selected victim quick-view */}
        {selectedId && (() => {
          const v = victims.find(v => v.id === selectedId)
          if (!v) return null
          return (
            <div className="absolute bottom-6 left-4 z-[1000] rounded-xl shadow-xl px-4 py-3 max-w-xs"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm leading-tight dark:text-white text-slate-900">{v.display_name}</p>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                {v.community_ward} · {v.effective_year ?? 'Year unknown'}
              </p>
              <Link
                to={`/victims/${v.id}`}
                className="text-amber-400 text-xs mt-2 block hover:underline"
              >
                View full profile →
              </Link>
            </div>
          )
        })()}

        <MapContainer center={JOS_CENTER} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={flyTarget} />
          {visibleFeatures.map((feature, i) => {
            const [lng, lat] = feature.geometry.coordinates
            const p = feature.properties
            const isSelected = p.id === selectedId
            return (
              <CircleMarker
                key={i}
                center={[lat, lng]}
                radius={isSelected ? 12 : 7}
                pathOptions={{
                  color: isSelected ? '#ffffff' : MARKER_COLORS[p.location_type],
                  weight: isSelected ? 3 : 1.5,
                  fillColor: MARKER_COLORS[p.location_type],
                  fillOpacity: isSelected ? 1 : 0.75,
                }}
                eventHandlers={{ click: () => selectFromMap(p.id) }}
              >
                <Popup>
                  <span className="font-semibold text-stone-800 block">{p.name}</span>
                  <span className="text-xs text-stone-400">
                    {LOCATION_LABELS[p.location_type]} · {p.year ?? 'Year unknown'}
                  </span>
                  <Link
                    to={`/victims/${p.id}`}
                    className="text-blue-600 text-xs underline block mt-2"
                  >
                    View full profile →
                  </Link>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
