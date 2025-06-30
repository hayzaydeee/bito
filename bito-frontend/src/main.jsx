import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@radix-ui/themes/styles.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <App />
)
