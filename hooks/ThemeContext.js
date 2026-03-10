import { createContext, useContext, useState } from 'react';
import { ColorSchemes, FontSchemes } from '../constants/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [schemeId, setSchemeId]   = useState('VOID');
  const [fontId,   setFontId]     = useState('BARLOW');

  const scheme = ColorSchemes[schemeId];
  const font   = FontSchemes[fontId];

  return (
    <ThemeContext.Provider value={{
      // color
      scheme, schemeId, setSchemeId, ColorSchemes,
      // font
      font, fontId, setFontId, FontSchemes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
