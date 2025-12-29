import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { ThemeProvider } from './components/theme-provider'

console.log('🚀 Main.tsx loading...')
console.log('Environment:', {
  DEV: import.meta.env.DEV,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  MODE: import.meta.env.MODE
})

const rootElement = document.getElementById('root')
console.log('Root element found:', !!rootElement)

createRoot(rootElement!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
