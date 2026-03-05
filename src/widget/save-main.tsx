import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { SaveWidgetApp } from './SaveWidgetApp';

// Polyfill Buffer for browser environment (needed by gray-matter)
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById('save-widget-root')!).render(
    <React.StrictMode>
        <SaveWidgetApp />
    </React.StrictMode>,
);
