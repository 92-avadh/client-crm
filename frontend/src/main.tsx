import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Globally prevent mouse wheel scrolling from changing values on any number inputs
if (typeof window !== 'undefined') {
  document.addEventListener(
    'wheel',
    () => {
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT' &&
        (document.activeElement as HTMLInputElement).type === 'number'
      ) {
        (document.activeElement as HTMLInputElement).blur();
      }
    },
    { passive: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
