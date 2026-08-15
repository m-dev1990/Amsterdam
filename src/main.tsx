import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AmsterdamEngine from './Engine'
import AppComponent from './App.tsx'

import './main.css'

await AmsterdamEngine.start()

createRoot(document.getElementById('root')!).render(
    <AppComponent />
)
