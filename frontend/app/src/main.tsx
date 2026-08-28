import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/base/index.css';

// Guard against third-party browser extensions and DevTools soft-navigation injection errors
if (typeof window !== 'undefined') {
  const isIgnoredError = (msg: string, stack?: string): boolean => {
    return (
      msg.includes('startTime') ||
      msg.includes('reportAllChanges') ||
      msg.includes("reading 'startTime'") ||
      (typeof stack === 'string' && stack.includes('reportAllChanges'))
    );
  };

  const originalOnError = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    const messageStr = typeof msg === 'string' ? msg : msg?.toString() || '';
    if (isIgnoredError(messageStr, error?.stack)) {
      return true; // Prevents the error from appearing in DevTools console
    }
    if (typeof originalOnError === 'function') {
      return originalOnError.apply(this, [msg, source, lineno, colno, error]);
    }
    return false;
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isIgnoredError(event.message || '', event.error?.stack)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || '';
      if (
        msg.includes('message channel closed before a response was received') ||
        msg.includes('A listener indicated an asynchronous response') ||
        isIgnoredError(msg, reason?.stack)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
