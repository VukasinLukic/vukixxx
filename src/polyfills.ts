/**
 * Polyfills for browser compatibility
 * Required for libraries that depend on Node.js APIs (like gray-matter)
 */

import { Buffer } from 'buffer';

// Expose Buffer globally for libraries that expect it
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

// Also set it on globalThis for better compatibility
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

export {};
