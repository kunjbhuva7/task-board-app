import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { VaultProvider } from './context/VaultContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <VaultProvider>
          <App />
        </VaultProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
