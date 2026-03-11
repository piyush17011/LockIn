import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemes, FontSchemes } from '../constants/theme';

const SCHEME_KEY = '@lockin_schemeId';
const FONT_KEY   = '@lockin_fontId';

// These schemes have light backgrounds — all others are dark
const LIGHT_SCHEMES = new Set([
  'DUST', 'ARCTIC', 'LATTE', 'SLATE', 'MINT', 'ROSE', 'SAND', 'LAVENDER', 'ICE',
]);

const DEFAULT_DARK  = 'VOID';
const DEFAULT_LIGHT = 'SLATE';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemAppearance             = useColorScheme(); // 'light' | 'dark' | null
  const [schemeId, setSchemeIdState] = useState(null);
  const [fontId,   setFontIdState]   = useState('BARLOW');
  const [ready,    setReady]         = useState(false);

  // ── Load saved prefs on mount, fall back to system-aware default ───────────
  useEffect(() => {
    AsyncStorage.multiGet([SCHEME_KEY, FONT_KEY])
      .then((pairs) => {
        const saved = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

        if (saved[SCHEME_KEY] && ColorSchemes[saved[SCHEME_KEY]]) {
          setSchemeIdState(saved[SCHEME_KEY]);
        } else {
          // First launch — pick based on device light/dark mode
          setSchemeIdState(systemAppearance === 'light' ? DEFAULT_LIGHT : DEFAULT_DARK);
        }

        if (saved[FONT_KEY] && FontSchemes[saved[FONT_KEY]]) {
          setFontIdState(saved[FONT_KEY]);
        }
      })
      .catch(() => {
        setSchemeIdState(systemAppearance === 'light' ? DEFAULT_LIGHT : DEFAULT_DARK);
      })
      .finally(() => setReady(true));
  }, []);

  // ── Wrappers — update state AND persist ───────────────────────────────────
  const setSchemeId = (id) => {
    setSchemeIdState(id);
    AsyncStorage.setItem(SCHEME_KEY, id).catch(() => {});
  };

  const setFontId = (id) => {
    setFontIdState(id);
    AsyncStorage.setItem(FONT_KEY, id).catch(() => {});
  };

  const isDark = schemeId ? !LIGHT_SCHEMES.has(schemeId) : systemAppearance !== 'light';

  const scheme = ColorSchemes[schemeId] ?? ColorSchemes[DEFAULT_DARK];
  const font   = FontSchemes[fontId]   ?? FontSchemes['BARLOW'];

  // Hold render until prefs restored — prevents flash of wrong theme
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{
      scheme, schemeId, setSchemeId, ColorSchemes,
      font, fontId, setFontId, FontSchemes,
      isDark,
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
