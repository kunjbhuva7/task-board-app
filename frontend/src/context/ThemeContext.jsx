import React, { createContext, useEffect } from 'react';

export const ThemeContext = createContext();

// Dark mode has been removed — the app always uses the light theme.
// This provider is kept (no-op) so existing consumers don't break.
export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Force light theme regardless of any previously saved preference
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.removeItem('darkMode'); } catch (e) { /* ignore */ }
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
