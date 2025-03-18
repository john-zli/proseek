import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ModalManager } from './components/modal_manager.tsx'
import { Header } from './components/header.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalManager>
      <Header />
      <App />
    </ModalManager>
  </StrictMode>,
)
