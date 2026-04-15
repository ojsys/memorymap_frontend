import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext'

export default function AboutPage() {
  const missionHeading = useContent('about_mission_heading', 'About the Middle Belt Memorial')
  const missionBody    = useContent('about_mission_body',
    'The Middle Belt Memorial is a documentation project dedicated to preserving the names, stories, and histories of individuals killed during ethno-religious and communal conflicts across the Middle Belt region of Nigeria. We believe that every life lost deserves to be remembered — not as a statistic, but as a person with a name, a family, and a community.')

  const whyHeading = useContent('about_why_heading', 'Why this project exists')
  const whyBody    = useContent('about_why_body',
    'Decades of recurring violence across the Middle Belt states of Nigeria have left behind thousands of unnamed victims. Official records are incomplete, fragmented, or inaccessible. Families have mourned without public acknowledgement. This platform is built to close that gap — creating a permanent, searchable, and dignified record that communities, researchers, journalists, and policymakers can access and contribute to.')

  const methodHeading = useContent('about_method_heading', 'How records are collected')
  const methodBody    = useContent('about_method_body',
    'Records are gathered through community engagement — working directly with families, community leaders, and local organisations in affected areas. Each record is only published with the informed consent of a family member or designated community representative. Where consent for naming has not been given, individuals are recorded anonymously. No record is published without verification.')

  const ethicsHeading = useContent('about_ethics_heading', 'Our ethical commitments')

  const contributeHeading = useContent('about_contribute_heading', 'Contribute a record')
  const contributeBody    = useContent('about_contribute_body',
    'If you have information about a victim of communal violence anywhere in the Middle Belt region — a family member, neighbour, or community member — you can submit a record for review. All submissions go through a consent and verification process before publication.')

  const contactHeading = useContent('about_contact_heading', 'Contact')
  const contactBody    = useContent('about_contact_body',
    'For enquiries about the project, research partnerships, or data requests, please reach out through the submission form or contact the project team directly.')

  const ethicsPillars = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: '#34d399',
      title: 'Consent first',
      body: 'No individual is named without the explicit consent of their family or community representative.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: '#60a5fa',
      title: 'Transparency',
      body: 'We are clear about what data we hold, how it was collected, and who verified it.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: '#f59e0b',
      title: 'Privacy by default',
      body: 'Sensitive details — precise addresses, witness identities — are never published on the public register.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: '#f87171',
      title: 'Community ownership',
      body: 'Communities affected by violence own their stories. Records can be updated or removed at any time by the consenting party.',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs dark:text-slate-500 text-slate-400 mb-10">
        <Link to="/" className="dark:hover:text-slate-300 hover:text-slate-600 transition-colors">Home</Link>
        <span>›</span>
        <span className="dark:text-slate-300 text-slate-600">About</span>
      </nav>

      {/* Mission */}
      <section className="mb-14">
        <h1 className="text-3xl md:text-4xl font-bold dark:text-white text-slate-900 mb-5 leading-tight">
          {missionHeading}
        </h1>
        <p className="dark:text-slate-400 text-slate-600 text-base leading-relaxed">
          {missionBody}
        </p>
      </section>

      <div className="border-t mb-14" style={{ borderColor: 'var(--border)' }} />

      {/* Why */}
      <section className="mb-14">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-4">{whyHeading}</h2>
        <p className="dark:text-slate-400 text-slate-600 text-base leading-relaxed">{whyBody}</p>
      </section>

      {/* How records are collected */}
      <section className="mb-14">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-4">{methodHeading}</h2>
        <p className="dark:text-slate-400 text-slate-600 text-base leading-relaxed">{methodBody}</p>
      </section>

      <div className="border-t mb-14" style={{ borderColor: 'var(--border)' }} />

      {/* Ethics */}
      <section className="mb-14">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-8">{ethicsHeading}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ethicsPillars.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${p.color}18`, color: p.color }}
              >
                {p.icon}
              </div>
              <h3 className="font-semibold dark:text-white text-slate-800 text-sm mb-2">{p.title}</h3>
              <p className="dark:text-slate-500 text-slate-500 text-xs leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t mb-14" style={{ borderColor: 'var(--border)' }} />

      {/* Contribute */}
      <section className="mb-14">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-4">{contributeHeading}</h2>
        <p className="dark:text-slate-400 text-slate-600 text-base leading-relaxed mb-6">{contributeBody}</p>
        <Link
          to="/submit"
          className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-5 py-2.5 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 bg-slate-900 text-white hover:bg-slate-700"
        >
          Submit a record
        </Link>
      </section>

      {/* Contact */}
      <section
        className="rounded-2xl p-8 border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold dark:text-white text-slate-900 mb-3">{contactHeading}</h2>
        <p className="dark:text-slate-400 text-slate-600 text-sm leading-relaxed">{contactBody}</p>
      </section>

    </div>
  )
}
