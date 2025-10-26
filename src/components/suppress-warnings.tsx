'use client';

import { useEffect } from 'react';

export function SuppressWarnings() {
  useEffect(() => {
    // Suppress React Router warnings if they appear
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      // Filter out React Router deprecation warnings
      if (
        message.includes('React Router Future Flag Warning') ||
        message.includes('No routes matched location') ||
        message.includes('/undefined')
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Filter out React Router route matching errors
      if (message.includes('No routes matched location')) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
}
