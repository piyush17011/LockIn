// ─────────────────────────────────────────────
//  LOCKIN — Streetwear Brutalist Theme
//  10 colorways — switch via ColorSwitcher
// ─────────────────────────────────────────────

export const ColorSchemes = {

  // 1. INK — dark + red strike
  INK: {
    id: 'INK', label: 'INK',
    bg:        '#0D0D0D',
    surface:   '#111111',
    card:      '#161410',
    border:    '#2a2620',
    accent:    '#FF2D2D',   // red
    accentAlt: '#FFE500',   // yellow
    text:      '#F0EBE1',
    textSub:   '#8a8070',
    muted:     '#3a3632',
    btnText:   '#0D0D0D',
  },

  // 2. VOID — pitch black + electric green
  VOID: {
    id: 'VOID', label: 'VOID',
    bg:        '#000000',
    surface:   '#0a0a0a',
    card:      '#0f0f0f',
    border:    '#1f1f1f',
    accent:    '#00FF6A',   // electric green
    accentAlt: '#FFFFFF',
    text:      '#EEFBF1',
    textSub:   '#4a6050',
    muted:     '#1f2e24',
    btnText:   '#000000',
  },

  // 3. DUST — off-white paper + raw orange
  DUST: {
    id: 'DUST', label: 'DUST',
    bg:        '#F5F0E8',
    surface:   '#EDE8DF',
    card:      '#E8E2D8',
    border:    '#C8C0B0',
    accent:    '#FF4500',   // raw orange-red
    accentAlt: '#1A1510',
    text:      '#1A1510',
    textSub:   '#6B6050',
    muted:     '#B8B0A0',
    btnText:   '#F5F0E8',
  },

  // 4. COBALT — navy + hot pink
  COBALT: {
    id: 'COBALT', label: 'COBALT',
    bg:        '#05080F',
    surface:   '#090E1A',
    card:      '#0D1220',
    border:    '#1A2240',
    accent:    '#FF2D78',   // hot pink
    accentAlt: '#4DFFFF',   // cyan
    text:      '#E8EEFF',
    textSub:   '#6070A0',
    muted:     '#1A2240',
    btnText:   '#05080F',
  },

  // 5. CRIMSON — deep red + gold
  CRIMSON: {
    id: 'CRIMSON', label: 'CRIMSON',
    bg:        '#0A0000',
    surface:   '#120000',
    card:      '#1A0000',
    border:    '#3A1010',
    accent:    '#C0392B',   // deep crimson
    accentAlt: '#F0C040',   // gold
    text:      '#FFF0E8',
    textSub:   '#906050',
    muted:     '#3A1010',
    btnText:   '#FFF0E8',
  },

  // 6. ARCTIC — ice white + electric blue
  ARCTIC: {
    id: 'ARCTIC', label: 'ARCTIC',
    bg:        '#F0F4FF',
    surface:   '#E4ECFF',
    card:      '#FFFFFF',
    border:    '#C0CCEE',
    accent:    '#0057FF',   // electric blue
    accentAlt: '#FF3D78',   // pink pop
    text:      '#080E2A',
    textSub:   '#5060A0',
    muted:     '#B0BCDD',
    btnText:   '#FFFFFF',
  },

  // 7. TOXIC — neon yellow + black
  TOXIC: {
    id: 'TOXIC', label: 'TOXIC',
    bg:        '#080800',
    surface:   '#101000',
    card:      '#181800',
    border:    '#303000',
    accent:    '#DDFF00',   // neon yellow
    accentAlt: '#FF4400',   // hot orange
    text:      '#F8FFD0',
    textSub:   '#707020',
    muted:     '#303000',
    btnText:   '#080800',
  },

  // 8. SAKURA — soft pink + black
  SAKURA: {
    id: 'SAKURA', label: 'SAKURA',
    bg:        '#0A0008',
    surface:   '#130010',
    card:      '#1A0018',
    border:    '#380030',
    accent:    '#FF6EB4',   // sakura pink
    accentAlt: '#FFD6F0',   // light blush
    text:      '#FFE8F8',
    textSub:   '#906080',
    muted:     '#380030',
    btnText:   '#0A0008',
  },

  // 9. MATRIX — terminal green on black
  MATRIX: {
    id: 'MATRIX', label: 'MATRIX',
    bg:        '#000300',
    surface:   '#000800',
    card:      '#000D00',
    border:    '#001800',
    accent:    '#00FF41',   // terminal green
    accentAlt: '#00CC33',
    text:      '#C8FFC8',
    textSub:   '#1A6620',
    muted:     '#002200',
    btnText:   '#000300',
  },

 
  // ── SOFT COLORWAYS ────────────────────────────────────────

  // 11. LATTE — warm beige + brown
  LATTE: {
    id: 'LATTE', label: 'LATTE',
    bg:        '#F7F2EA',
    surface:   '#EFE9DF',
    card:      '#E8E0D4',
    border:    '#D4C8B8',
    accent:    '#8B5E3C',
    accentAlt: '#C4956A',
    text:      '#2C1F14',
    textSub:   '#7A6552',
    muted:     '#C4B8A8',
    btnText:   '#F7F2EA',
  },

  // 12. SLATE — cool grey + soft blue
  SLATE: {
    id: 'SLATE', label: 'SLATE',
    bg:        '#F4F6F8',
    surface:   '#EAEDF0',
    card:      '#FFFFFF',
    border:    '#D0D6DC',
    accent:    '#5B8DB8',
    accentAlt: '#3A6690',
    text:      '#1E2A34',
    textSub:   '#6A7F8E',
    muted:     '#B8C4CC',
    btnText:   '#FFFFFF',
  },

  // 13. MINT — soft green + cream
  MINT: {
    id: 'MINT', label: 'MINT',
    bg:        '#F2F8F4',
    surface:   '#E8F2EC',
    card:      '#FFFFFF',
    border:    '#C4DECA',
    accent:    '#4A9B6F',
    accentAlt: '#2D7A52',
    text:      '#162418',
    textSub:   '#5A8060',
    muted:     '#B0CEB8',
    btnText:   '#FFFFFF',
  },

  // 14. ROSE — dusty rose + mauve
  ROSE: {
    id: 'ROSE', label: 'ROSE',
    bg:        '#FBF4F4',
    surface:   '#F5ECEC',
    card:      '#FFFFFF',
    border:    '#E8D4D4',
    accent:    '#B06070',
    accentAlt: '#8C4A58',
    text:      '#2A1518',
    textSub:   '#8A6068',
    muted:     '#D4B8BC',
    btnText:   '#FFFFFF',
  },

  // 15. SAND — warm tan + terracotta
  SAND: {
    id: 'SAND', label: 'SAND',
    bg:        '#FAF5EE',
    surface:   '#F2EAE0',
    card:      '#EDE3D6',
    border:    '#D8CCB8',
    accent:    '#C4714A',
    accentAlt: '#A0522D',
    text:      '#2A1A0E',
    textSub:   '#806050',
    muted:     '#C8B8A4',
    btnText:   '#FAF5EE',
  },

  // 16. LAVENDER — soft purple + lilac
  LAVENDER: {
    id: 'LAVENDER', label: 'LAVENDER',
    bg:        '#F6F4FB',
    surface:   '#EEEAF6',
    card:      '#FFFFFF',
    border:    '#D8D0EE',
    accent:    '#7B68B0',
    accentAlt: '#9B8FCC',
    text:      '#1E1830',
    textSub:   '#706888',
    muted:     '#C8C0E0',
    btnText:   '#FFFFFF',
  },

  // 17. DUSK — muted navy + peach
  DUSK: {
    id: 'DUSK', label: 'DUSK',
    bg:        '#1C2233',
    surface:   '#242C40',
    card:      '#2C3650',
    border:    '#3C4860',
    accent:    '#E8A080',
    accentAlt: '#F0C0A0',
    text:      '#EEF0F8',
    textSub:   '#8090A8',
    muted:     '#3C4860',
    btnText:   '#1C2233',
  },
  // 18. MIDNIGHT — premium dark blue
MIDNIGHT: {
  id: 'MIDNIGHT', label: 'MIDNIGHT',
  bg:        '#020617',
  surface:   '#030B1A',
  card:      '#07152E',
  border:    '#102040',
  accent:    '#3B82F6',
  accentAlt: '#60A5FA',
  text:      '#E6F0FF',
  textSub:   '#6B85B6',
  muted:     '#102040',
  btnText:   '#020617',
},

// 19. FIRE — aggressive gym vibe
FIRE: {
  id: 'FIRE', label: 'FIRE',
  bg:        '#0C0000',
  surface:   '#180000',
  card:      '#240000',
  border:    '#3A0000',
  accent:    '#FF3B00',
  accentAlt: '#FF8C00',
  text:      '#FFF0E8',
  textSub:   '#A86050',
  muted:     '#3A0000',
  btnText:   '#FFFFFF',
},

// 20. OCEAN — calm blue gradient vibe
OCEAN: {
  id: 'OCEAN', label: 'OCEAN',
  bg:        '#031926',
  surface:   '#06283D',
  card:      '#0A3D62',
  border:    '#114B7A',
  accent:    '#00A8E8',
  accentAlt: '#7FDBFF',
  text:      '#E8F8FF',
  textSub:   '#6BA4C0',
  muted:     '#114B7A',
  btnText:   '#031926',
},

// 21. SUNSET — warm gradient feel
SUNSET: {
  id: 'SUNSET', label: 'SUNSET',
  bg:        '#1A0F0A',
  surface:   '#24140C',
  card:      '#2E1A0F',
  border:    '#442210',
  accent:    '#FF7A18',
  accentAlt: '#FFD166',
  text:      '#FFF3E8',
  textSub:   '#B08060',
  muted:     '#442210',
  btnText:   '#1A0F0A',
},

// 22. NEON — cyberpunk look
NEON: {
  id: 'NEON', label: 'NEON',
  bg:        '#020002',
  surface:   '#0A0010',
  card:      '#120018',
  border:    '#2E0030',
  accent:    '#FF00FF',
  accentAlt: '#00FFFF',
  text:      '#FFE8FF',
  textSub:   '#8A608A',
  muted:     '#2E0030',
  btnText:   '#020002',
},

// 23. FOREST — nature green
FOREST: {
  id: 'FOREST', label: 'FOREST',
  bg:        '#081C15',
  surface:   '#0B2B1F',
  card:      '#123B2A',
  border:    '#1F513C',
  accent:    '#2ECC71',
  accentAlt: '#A3F7BF',
  text:      '#E8FFF4',
  textSub:   '#6A9A86',
  muted:     '#1F513C',
  btnText:   '#081C15',
},

// 24. ICE — minimal frosted white
ICE: {
  id: 'ICE', label: 'ICE',
  bg:        '#F7FBFF',
  surface:   '#EDF5FF',
  card:      '#FFFFFF',
  border:    '#D8E6F5',
  accent:    '#3DA9FC',
  accentAlt: '#90CAF9',
  text:      '#0C1B2A',
  textSub:   '#5A738C',
  muted:     '#C8DAEC',
  btnText:   '#FFFFFF',
},

  // 25. COPPER — warm metallic bronze
  COPPER: {
    id: 'COPPER', label: 'COPPER',
    bg:        '#0E0800',
    surface:   '#1A1000',
    card:      '#241800',
    border:    '#3C2800',
    accent:    '#B87333',
    accentAlt: '#E8A050',
    text:      '#FFF4E0',
    textSub:   '#9A7040',
    muted:     '#3C2800',
    btnText:   '#0E0800',
  },

  // 26. STORM — dark grey + electric purple
  STORM: {
    id: 'STORM', label: 'STORM',
    bg:        '#0C0C12',
    surface:   '#121220',
    card:      '#1A1A2E',
    border:    '#28283C',
    accent:    '#9B59B6',
    accentAlt: '#C39BD3',
    text:      '#F0EEFF',
    textSub:   '#706080',
    muted:     '#28283C',
    btnText:   '#F0EEFF',
  },

  // 27. CHALK — bright white minimal
  CHALK: {
    id: 'CHALK', label: 'CHALK',
    bg:        '#FFFFFF',
    surface:   '#F8F8F8',
    card:      '#F0F0F0',
    border:    '#E0E0E0',
    accent:    '#111111',
    accentAlt: '#555555',
    text:      '#111111',
    textSub:   '#666666',
    muted:     '#CCCCCC',
    btnText:   '#FFFFFF',
  },

  // 28. EMBER — smouldering dark amber
  EMBER: {
    id: 'EMBER', label: 'EMBER',
    bg:        '#0F0800',
    surface:   '#1C1000',
    card:      '#281800',
    border:    '#402800',
    accent:    '#FF8C00',
    accentAlt: '#FFC444',
    text:      '#FFF8E8',
    textSub:   '#A07030',
    muted:     '#402800',
    btnText:   '#0F0800',
  },

  // 29. PEARL — warm cream + gold
  PEARL: {
    id: 'PEARL', label: 'PEARL',
    bg:        '#FDFAF4',
    surface:   '#F5F0E4',
    card:      '#EDE8D8',
    border:    '#D8CEB0',
    accent:    '#BFA14A',
    accentAlt: '#8C7030',
    text:      '#1C1600',
    textSub:   '#7A6840',
    muted:     '#C8BC98',
    btnText:   '#1C1600',
  },

  // 30. BLOOD — deep dark red + white
  BLOOD: {
    id: 'BLOOD', label: 'BLOOD',
    bg:        '#070000',
    surface:   '#100000',
    card:      '#1A0000',
    border:    '#300000',
    accent:    '#FF1744',
    accentAlt: '#FF6E6E',
    text:      '#FFFFFF',
    textSub:   '#AA5050',
    muted:     '#300000',
    btnText:   '#070000',
  },

  // 31. CHROME — silver metallic dark
  CHROME: {
    id: 'CHROME', label: 'CHROME',
    bg:        '#0A0A0A',
    surface:   '#141414',
    card:      '#1E1E1E',
    border:    '#2E2E2E',
    accent:    '#C0C0C0',
    accentAlt: '#E8E8E8',
    text:      '#F5F5F5',
    textSub:   '#888888',
    muted:     '#333333',
    btnText:   '#0A0A0A',
  },

  // 32. AURORA — dark + teal aurora
  AURORA: {
    id: 'AURORA', label: 'AURORA',
    bg:        '#030C10',
    surface:   '#061820',
    card:      '#0A2530',
    border:    '#103840',
    accent:    '#00E5CC',
    accentAlt: '#80FFE8',
    text:      '#E0FFFA',
    textSub:   '#408A80',
    muted:     '#103840',
    btnText:   '#030C10',
  },

};

// ── Legacy exports — keeps other screens from breaking ────────
export const Colors = {
  bg:         ColorSchemes.INK.bg,
  surface:    ColorSchemes.INK.surface,
  card:       ColorSchemes.INK.card,
  border:     ColorSchemes.INK.border,
  accent:     ColorSchemes.INK.accent,
  accentDim:  'rgba(255,45,45,0.15)',
  accentDim2: 'rgba(255,45,45,0.08)',
  text:       ColorSchemes.INK.text,
  textSub:    ColorSchemes.INK.textSub,
  muted:      ColorSchemes.INK.muted,
  white:      '#ffffff',
  purple:     '#7b61ff',
  purpleDim:  'rgba(123,97,255,0.15)',
  red:        '#FF2D2D',
  orange:     '#FF4500',
  blue:       '#54a0ff',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const Radius  = { sm: 0, md: 0, lg: 0, xl: 0, full: 0 };

// ─────────────────────────────────────────────
//  FONT SCHEMES
//  Each scheme defines: display, heading, body
//  fonts used across the app
// ─────────────────────────────────────────────
export const FontSchemes = {

  BARLOW: {
    id:      'BARLOW',
    label:   'Barlow',
    desc:    'Sharp & Condensed',
    display: 'BarlowCondensed-Black',
    heading: 'BarlowCondensed-Bold',
    body:    'Barlow-Regular',
    bodySemi:'Barlow-SemiBold',
  },

  ROUNDED: {
    id:      'ROUNDED',
    label:   'Rounded',
    desc:    'Soft & Friendly',
    display: 'Nunito-ExtraBold',
    heading: 'Nunito-Bold',
    body:    'Nunito-Regular',
    bodySemi:'Nunito-Bold',
  },

  SERIF: {
    id:      'SERIF',
    label:   'Serif',
    desc:    'Elegant & Editorial',
    display: 'PlayfairDisplay-ExtraBold',
    heading: 'PlayfairDisplay-Bold',
    body:    'PlayfairDisplay-Regular',
    bodySemi:'PlayfairDisplay-Bold',
  },

  MINIMAL: {
    id:      'MINIMAL',
    label:   'Minimal',
    desc:    'Clean & Modern',
    display: 'DMSans-ExtraBold',
    heading: 'DMSans-Bold',
    body:    'DMSans-Regular',
    bodySemi:'DMSans-Bold',
  },

  MONO: {
    id:      'MONO',
    label:   'Mono',
    desc:    'Techy & Code-like',
    display: 'JetBrainsMono-ExtraBold',
    heading: 'JetBrainsMono-Bold',
    body:    'JetBrainsMono-Regular',
    bodySemi:'JetBrainsMono-Bold',
  },

EDITORIAL: {
  id: 'EDITORIAL',
  label: 'Editorial',
  desc: 'Magazine style',
  display: 'LibreBaskerville-Bold',
  heading: 'LibreBaskerville-Bold',
  body: 'LibreBaskerville-Regular',
  bodySemi: 'LibreBaskerville-Bold',
},

};
