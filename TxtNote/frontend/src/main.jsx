import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthGate from './features/auth/AuthGate.jsx'
import { isAuthenticated } from './features/auth/authSession.js'
import './index.css'
import { blockUiSelection } from './lib/uiSelection.js'

blockUiSelection()

if (isAuthenticated()) {
  void import('./app/App.jsx')
} else {
  void import('./features/auth/RegisterPage.tsx')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
)
