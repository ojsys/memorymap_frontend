import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const ContentContext = createContext({})

export function ContentProvider({ children }) {
  const [content, setContent] = useState({})

  useEffect(() => {
    axios.get('/api/content/')
      .then(r => {
        setContent(r.data)
        if (r.data.site_name) document.title = r.data.site_name
      })
      .catch(() => {}) // silently fall back to hardcoded defaults in components
  }, [])

  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  )
}

/**
 * useContent(key, fallback?)
 * Returns the CMS value for the given key, or the fallback if not yet loaded.
 */
export function useContent(key, fallback = '') {
  const ctx = useContext(ContentContext)
  return ctx[key] ?? fallback
}
