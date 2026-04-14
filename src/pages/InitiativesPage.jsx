import { useEffect, useState } from 'react'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState([])
  const heading    = useContent('initiatives_heading',    'Community Initiatives')
  const subheading = useContent('initiatives_subheading', 'Local remembrance and peacebuilding activities in Plateau State.')

  useEffect(() => {
    axios.get('/api/initiatives/').then(res => setInitiatives(res.data.results))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">{heading}</h1>
      <p className="dark:text-slate-400 text-slate-500 text-sm mb-10">{subheading}</p>

      {initiatives.length === 0 && (
        <p className="dark:text-slate-500 text-slate-400">No initiatives recorded yet.</p>
      )}

      <div className="flex flex-col gap-5">
        {initiatives.map(i => (
          <article
            key={i.id}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold dark:text-white text-slate-900 text-lg mb-1">{i.name}</h2>
            <p className="text-sm dark:text-slate-500 text-slate-400 mb-4">
              {i.organising_body}
              {i.date && <span> · {i.date}</span>}
              {i.location_name && <span> · {i.location_name}</span>}
            </p>
            <p className="dark:text-slate-300 text-slate-600 text-sm leading-relaxed">{i.description}</p>
            {i.url && (
              <a
                href={i.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline mt-4 block"
              >
                Learn more →
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
