import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { applyConsolePrefs } from './utils/consolePrefs';
import './index.css';

// Apply stored per-device preferences before the first paint.
applyConsolePrefs();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgb(var(--ink-750))',
              color: 'rgb(var(--text-body))',
              border: '1px solid rgb(var(--ink-600))',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.75rem 1rem',
              maxWidth: '26rem',
              boxShadow: '0 12px 40px -12px rgba(0,0,0,0.6)',
            },
            success: { iconTheme: { primary: 'rgb(var(--accent-emerald))', secondary: 'rgb(var(--ink-850))' } },
            error: { iconTheme: { primary: 'rgb(var(--accent-rose))', secondary: 'rgb(var(--ink-850))' }, duration: 5500 },
          }}
        />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
