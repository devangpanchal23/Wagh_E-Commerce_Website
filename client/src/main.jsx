import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Startup validation check for environment variables
if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.error(
    '❌ [Env Validation Error] VITE_GOOGLE_CLIENT_ID is missing or empty in client/.env! Please add VITE_GOOGLE_CLIENT_ID=<your-gcp-client-id>.apps.googleusercontent.com to client/.env and restart the dev server.'
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
