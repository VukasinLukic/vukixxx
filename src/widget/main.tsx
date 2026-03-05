import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { WidgetApp } from './WidgetApp';

// Polyfill Buffer for browser environment (needed by gray-matter)
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById('widget-root')!).render(
  <React.StrictMode>
    <WidgetApp />
  </React.StrictMode>,
);
