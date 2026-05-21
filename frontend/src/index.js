import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import './index.css';
import App from './App';

// In production (Vercel), point axios at the Render backend URL.
// In development, leave empty so the CRA proxy (package.json "proxy") handles /api/... → localhost:5000.
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
