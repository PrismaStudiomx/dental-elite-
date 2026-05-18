import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'
import './index.css' // O el nombre de tus estilos de Tailwind

// Detectamos la URL del navegador en tiempo real
const irAAdmin = window.location.pathname === '/admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {irAAdmin ? <Admin /> : <App />}
  </React.StrictMode>,
)