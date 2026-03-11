import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

export const STORY_W  = SW;
export const STORY_H  = SW * (16 / 9);
export const THUMB_H  = SH * 0.42;
export const THUMB_W  = THUMB_H * (9 / 16);
export const SIDE_PAD = (SW - THUMB_W) / 2;
export const ACCENT   = '#00f5c4';
export const TS = {
  textShadowColor:  '#000',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 6,
};

// ─── Font options ─────────────────────────────────────────────────────────────
export const FONT_OPTIONS = [
  { key: 'barlow',    label: 'Barlow',    family: 'Barlow-SemiBold',           weight: '700' },
  { key: 'condensed', label: 'Condensed', family: 'BarlowCondensed-Black',     weight: '900' },
  { key: 'dm',        label: 'DM Sans',   family: 'DMSans-ExtraBold',          weight: '800' },
  { key: 'mono',      label: 'Mono',      family: 'JetBrainsMono-ExtraBold',   weight: '800' },
  { key: 'nunito',    label: 'Nunito',    family: 'Nunito-ExtraBold',          weight: '800' },
  { key: 'playfair',  label: 'Playfair',  family: 'PlayfairDisplay-ExtraBold', weight: '800' },
];

export const SIZE_OPTIONS = [
  { key: 'xs', label: 'XS', scale: 0.72 },
  { key: 'sm', label: 'S',  scale: 0.86 },
  { key: 'md', label: 'M',  scale: 1.00 },
  { key: 'lg', label: 'L',  scale: 1.16 },
  { key: 'xl', label: 'XL', scale: 1.32 },
];

export const SPACE_OPTIONS = [
  { key: 'tight',  label: 'Tight',  letter: -3, line: -0.05 },
  { key: 'normal', label: 'Normal', letter: -1, line: 0     },
  { key: 'wide',   label: 'Wide',   letter:  2, line: 0.04  },
  { key: 'wider',  label: 'Wider',  letter:  5, line: 0.09  },
];

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmtTime(sec) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function fmtCal(c) {
  if (!c) return null;
  return c >= 1000 ? `${(c / 1000).toFixed(1)}k` : `${c}`;
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────
// Each preset receives: photoUri, workout, streak, userName, dateStr, timeStr,
// calStr, exCount, w, h, s, fontFamily, sizeScale, letterMult, lineMult

// 0 — Raw
export function Raw({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
  fontFamily, sizeScale, letterMult, lineMult, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const ls = (n) => Math.round(s(n) * letterMult);
  const lh = (n, fSize) => Math.round(fSize * (1 + lineMult));
  const statItems = [
    streak > 0 && { v: `${streak}`, l: 'STREAK' },
    calStr       && { v: calStr,    l: 'CAL'    },
    timeStr      && { v: timeStr,   l: 'TIME'   },
  ].filter(Boolean);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.22, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: s(8) }}>
        <Text style={{ fontSize: fs(30), fontFamily, color: '#fff', letterSpacing: ls(-1), ...TS }}>LOCKIN</Text>
      </View>
      <View style={{ position: 'absolute', top: h * 0.22, left: s(24), right: s(24), height: h * 0.44, justifyContent: 'flex-start' }}>
        <Text style={{ fontSize: fs(72), fontFamily, color: '#fff', letterSpacing: ls(-3), lineHeight: lh(0, fs(72)), ...TS }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
      </View>
      <View style={{ position: 'absolute', top: h * 0.66, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: s(24) }}>
        {statItems.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {statItems.map((st, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {i > 0 && <View style={{ width: 1, height: fs(28), backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: s(10) }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: fs(20), fontFamily, color: '#fff', ...TS }}>{st.v}</Text>
                  <Text style={{ fontSize: fs(8), fontFamily, color: 'rgba(255,255,255,0.45)', letterSpacing: ls(2), marginTop: s(2) }}>{st.l}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={{ fontSize: fs(10), fontFamily, color: 'rgba(255,255,255,0.38)', marginTop: s(10), letterSpacing: ls(1) }}>@{userName}  ·  {dateStr}</Text>
      </View>
    </View>
  );
}

// 1 — Statement
export function Statement({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
  fontFamily, sizeScale, letterMult, lineMult, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const ls = (n) => Math.round(s(n) * letterMult);
  const lh = (n, fSize) => Math.round(fSize * (1 + lineMult));
  const statItems = [
    streak > 0 && { v: `${streak}`, l: 'STREAK' },
    calStr       && { v: calStr,    l: 'CAL'    },
    timeStr      && { v: timeStr,   l: 'TIME'   },
  ].filter(Boolean);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: s(24), right: s(24), height: h * 0.28, justifyContent: 'flex-end', paddingBottom: s(6) }}>
        <Text style={{ fontSize: fs(48), fontFamily, color: '#f6f5f5', letterSpacing: ls(-2), lineHeight: lh(0, fs(48)), ...TS }}>LOCKIN</Text>
      </View>
      <View style={{ position: 'absolute', top: h * 0.28, left: 0, right: 0, height: h * 0.38, justifyContent: 'center', paddingHorizontal: s(24) }}>
        {statItems.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {statItems.map((st, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {i > 0 && <View style={{ width: 1, height: fs(28), backgroundColor: 'rgba(225, 47, 47, 0.2)', marginHorizontal: s(10) }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: fs(22), fontFamily, color: '#fff', ...TS }}>{st.v}</Text>
                  <Text style={{ fontSize: fs(9), fontFamily, color: 'rgb(246, 244, 244)', letterSpacing: ls(2), marginTop: s(2) }}>{st.l}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ position: 'absolute', top: h * 0.66, left: s(24), right: s(24), bottom: 0, justifyContent: 'center' }}>
        <Text style={{ fontSize: fs(44), fontFamily, color: '#fff', letterSpacing: ls(-2), lineHeight: lh(0, fs(44)), ...TS }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        <Text style={{ fontSize: fs(10), fontFamily, color: 'rgba(255,255,255,0.38)', marginTop: s(8), letterSpacing: ls(1) }}>@{userName}  ·  {dateStr}</Text>
      </View>
    </View>
  );
}

// 2 — Stripped
export function Stripped({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
  fontFamily, sizeScale, letterMult, lineMult, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const ls = (n) => Math.round(s(n) * letterMult);
  const lh = (n, fSize) => Math.round(fSize * (1 + lineMult));
  const statParts = [
    calStr     && { v: calStr,      l: 'CAL'    },
    timeStr    && { v: timeStr,     l: 'TIME'   },
    streak > 0 && { v: `${streak}`, l: 'STREAK' },
  ].filter(Boolean);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.22, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: s(8) }}>
        <Text style={{ fontSize: fs(36), fontFamily, color: '#fff', letterSpacing: ls(2), ...TS }}>LOCKIN</Text>
      </View>
      <View style={{ position: 'absolute', top: h * 0.22, left: 0, right: 0, height: h * 0.44 }} />
      <View style={{ position: 'absolute', top: h * 0.66, left: s(24), right: s(24), bottom: 0, justifyContent: 'center' }}>
        <Text style={{ fontSize: fs(52), fontFamily, color: '#fff', letterSpacing: ls(-2), lineHeight: lh(0, fs(52)), ...TS }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {statParts.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12) }}>
            {statParts.map((st, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {i > 0 && <View style={{ width: 1, height: fs(22), backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: s(8) }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: fs(16), fontFamily, color: '#fff', ...TS }}>{st.v}</Text>
                  <Text style={{ fontSize: fs(8), fontFamily, color: 'rgba(255,255,255,0.45)', letterSpacing: ls(1), marginTop: s(2) }}>{st.l}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={{ fontSize: fs(10), fontFamily, color: 'rgba(255,255,255,0.38)', marginTop: s(10), letterSpacing: ls(1) }}>@{userName}  ·  {dateStr}</Text>
      </View>
    </View>
  );
}

// 3 — Classic
export function Classic({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s,
  fontFamily, sizeScale = 1, onImageLoad }) {
  const fs   = (n) => Math.round(s(n) * sizeScale);
  const hero = timeStr ? { v: timeStr, l: null } : calStr ? { v: calStr, l: 'KCAL' } : exCount ? { v: String(exCount), l: 'EXERCISES' } : null;
  const sec2 = [calStr && timeStr && { v: calStr, l: 'KCAL' }, exCount && { v: String(exCount), l: 'EXERCISES' }].filter(Boolean);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#0e1219', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: s(60), alignItems: 'center' }}>
        <Text style={{ fontSize: s(22), fontFamily, color: '#fff', letterSpacing: s(6), ...TS }}>LOCK<Text style={{ color: ACCENT }}>IN</Text></Text>
        {streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(5), marginTop: s(10) }}>
            <Text style={{ fontSize: s(14) }}>🔥</Text>
            <Text style={{ fontSize: s(11), fontFamily, color: 'rgba(255,255,255,0.95)', letterSpacing: s(2), ...TS }}>{streak} DAY STREAK</Text>
          </View>
        )}
      </View>
      {hero && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: fs(88), fontFamily, color: '#fff', letterSpacing: fs(-4), lineHeight: fs(90), ...TS }}>{hero.v}</Text>
          {hero.l && <Text style={{ fontSize: s(14), fontFamily, color: 'rgba(255,255,255,0.9)', letterSpacing: s(3), marginTop: s(4), ...TS }}>{hero.l}</Text>}
          {sec2.length > 0 && (
            <View style={{ flexDirection: 'row', marginTop: s(28), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: s(20) }}>
              {sec2.map((st, i) => (
                <View key={i} style={[{ paddingHorizontal: s(32), alignItems: 'center' }, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={{ fontSize: s(28), fontFamily, color: '#fff', ...TS }}>{st.v}</Text>
                  <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.85)', letterSpacing: s(2), marginTop: s(3), ...TS }}>{st.l}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: s(32), paddingBottom: s(52) }}>
        <Text style={{ fontSize: fs(40), fontFamily, color: '#fff', letterSpacing: fs(-1), ...TS }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: s(14) }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: s(12), fontFamily, color: 'rgba(255,255,255,0.85)', letterSpacing: s(1.5), ...TS }}>{dateStr}</Text>
          <Text style={{ fontSize: s(12), fontFamily, color: 'rgba(255,255,255,0.85)', ...TS }}>@{userName}</Text>
        </View>
      </View>
    </View>
  );
}

// 4 — Minimal
export function Minimal({ photoUri, workout, userName, dateStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: s(40), paddingBottom: s(60) }}>
        <Text style={{ fontSize: s(11), fontFamily, color: ACCENT, letterSpacing: s(4), marginBottom: s(8), ...TS }}>LOCKIN</Text>
        <Text style={{ fontSize: fs(52), fontFamily, color: '#fff', letterSpacing: fs(-2), lineHeight: fs(54), ...TS }}>{workout.type.toUpperCase()}</Text>
        <Text style={{ fontSize: s(13), fontFamily, color: 'rgba(255,255,255,0.7)', marginTop: s(12), letterSpacing: s(1), ...TS }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 5 — Gen Z
export function GenZ({ photoUri, workout, streak, userName, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: s(52), left: s(20) }}>
        <Text style={{ fontSize: s(10), fontFamily, color: '#fff', letterSpacing: s(3), opacity: 0.5 }}>@{userName}</Text>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: s(20) }}>
        <Text style={{ fontSize: s(11), fontFamily, color: '#ff6af5', letterSpacing: s(3), marginBottom: s(10) }}>NO DAYS OFF 🔥</Text>
        <Text style={{ fontSize: fs(62), fontFamily, color: '#fff', letterSpacing: fs(-3), lineHeight: fs(58) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: s(8), marginTop: s(16), flexWrap: 'wrap' }}>
          {[timeStr && `⏱ ${timeStr}`, calStr && `🔥 ${calStr} kcal`, streak > 0 && `💀 ${streak} day streak`].filter(Boolean).map((tag, i) => (
            <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: s(20), paddingHorizontal: s(12), paddingVertical: s(5), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ fontSize: s(11), fontFamily, color: '#fff' }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: s(40), left: s(20), right: s(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: s(18), fontFamily, color: '#ff6af5', letterSpacing: s(4) }}>LOCKIN</Text>
      </View>
    </View>
  );
}

// 6 — Retro 80s
export function Retro({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#1a0033', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.4, overflow: 'hidden' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', bottom: i * s(22), left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,0,200,0.25)' }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', bottom: 0, top: 0, left: i * (w / 9), width: 1, backgroundColor: 'rgba(255,0,200,0.2)' }} />
        ))}
      </View>
      <View style={{ position: 'absolute', top: s(54), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(13), fontFamily, color: '#ff00c8', letterSpacing: s(6), textShadowColor: '#ff00c8', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: s(10) }}>★ LOCKIN ★</Text>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: fs(64), fontFamily, color: '#fff', letterSpacing: fs(-2), textAlign: 'center', textShadowColor: '#00f5ff', textShadowOffset: { width: s(3), height: s(3) }, textShadowRadius: 0 }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {streak > 0 && <Text style={{ fontSize: s(13), fontFamily, color: '#ff00c8', letterSpacing: s(3), marginTop: s(12) }}>🔥 {streak} DAY STREAK</Text>}
        {timeStr && <Text style={{ fontSize: s(22), fontFamily, color: '#00f5ff', marginTop: s(8), textShadowColor: '#00f5ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: s(8) }}>{timeStr}</Text>}
      </View>
      <View style={{ position: 'absolute', bottom: s(36), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,0,200,0.6)', letterSpacing: s(2) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 7 — Brutalist
export function Brutalist({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#f5f0e8', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(8), backgroundColor: '#000' }} />
      <View style={{ position: 'absolute', top: s(8), left: 0, right: 0, height: s(4), backgroundColor: '#ff3300' }} />
      <View style={{ position: 'absolute', top: s(56), left: s(24) }}>
        <Text style={{ fontSize: s(10), fontFamily, color: '#000', letterSpacing: s(5) }}>LOCKIN WORKOUT SYSTEM</Text>
      </View>
      <View style={{ position: 'absolute', top: s(80), left: s(24), right: s(24) }}>
        <Text style={{ fontSize: fs(72), fontFamily, color: '#000', letterSpacing: fs(-5), lineHeight: fs(66) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: s(80), left: s(24), right: s(24) }}>
        <View style={{ height: s(3), backgroundColor: '#000', marginBottom: s(14) }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[timeStr && { v: timeStr, l: 'TIME' }, streak > 0 && { v: `${streak}D`, l: 'STREAK' }].filter(Boolean).map((st, i) => (
            <View key={i}>
              <Text style={{ fontSize: s(28), fontFamily, color: '#ff3300' }}>{st.v}</Text>
              <Text style={{ fontSize: s(9), fontFamily, color: '#000', letterSpacing: s(2) }}>{st.l}</Text>
            </View>
          ))}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: s(10), fontFamily, color: '#000', letterSpacing: s(1) }}>@{userName}</Text>
            <Text style={{ fontSize: s(9), fontFamily, color: '#666', marginTop: s(3) }}>{dateStr}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// 8 — Pastel
export function Pastel({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#fef6f0', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: s(56), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(12), fontFamily, color: '#e8a598', letterSpacing: s(4) }}>✦ LOCKIN ✦</Text>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(28) }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: s(24), padding: s(28), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,165,152,0.3)' }}>
          <Text style={{ fontSize: s(13), fontFamily, color: '#e8a598', letterSpacing: s(3), marginBottom: s(10) }}>today's workout</Text>
          <Text style={{ fontSize: fs(42), fontFamily, color: '#3d2b2b', letterSpacing: fs(-2), textAlign: 'center' }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
          {streak > 0 && <Text style={{ fontSize: s(13), fontFamily, color: '#e8a598', marginTop: s(10) }}>🌸 {streak} day streak</Text>}
          <View style={{ height: 1, width: s(60), backgroundColor: 'rgba(232,165,152,0.4)', marginVertical: s(16) }} />
          <View style={{ flexDirection: 'row', gap: s(20) }}>
            {[timeStr && { v: timeStr, l: 'time' }, calStr && { v: calStr, l: 'kcal' }].filter(Boolean).map((st, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: s(22), fontFamily, color: '#3d2b2b' }}>{st.v}</Text>
                <Text style={{ fontSize: s(9), fontFamily, color: '#e8a598', letterSpacing: s(1) }}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: s(40), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(10), fontFamily, color: '#c9a09a', letterSpacing: s(1) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 9 — Cinematic
export function Cinematic({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.12, backgroundColor: '#000' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.28, backgroundColor: '#000' }} />
      <View style={{ position: 'absolute', bottom: h * 0.28, left: 0, right: 0, height: h * 0.18, backgroundColor: 'rgba(0,0,0,0.7)' }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.12, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(255,255,255,0.5)', letterSpacing: s(5) }}>LOCKIN PRESENTS</Text>
      </View>
      <View style={{ position: 'absolute', bottom: h * 0.28, left: s(28), right: s(28), height: h * 0.18, justifyContent: 'center' }}>
        <Text style={{ fontSize: fs(46), fontFamily, color: '#fff', letterSpacing: fs(-2), lineHeight: fs(44), ...TS }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {streak > 0 && <Text style={{ fontSize: s(11), fontFamily, color: ACCENT, letterSpacing: s(2), marginTop: s(6), ...TS }}>🔥 {streak} DAY STREAK</Text>}
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.28, justifyContent: 'center', alignItems: 'center', gap: s(6) }}>
        {timeStr && <Text style={{ fontSize: s(28), fontFamily, color: '#fff', letterSpacing: s(-1) }}>{timeStr}</Text>}
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.4)', letterSpacing: s(2) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 10 — Military
export function Military({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#1a1f10', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: s(52), left: s(20), right: s(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: s(9), fontFamily, color: '#8fa86e', letterSpacing: s(4) }}>LOCKIN//OPS</Text>
        <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(143,168,110,0.6)', letterSpacing: s(2) }}>{dateStr}</Text>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: s(20) }}>
        <Text style={{ fontSize: s(11), fontFamily, color: '#8fa86e', letterSpacing: s(5), marginBottom: s(10) }}>MISSION:</Text>
        <Text style={{ fontSize: fs(58), fontFamily, color: '#fff', letterSpacing: fs(-2), lineHeight: fs(54) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {streak > 0 && <Text style={{ fontSize: s(11), fontFamily, color: '#8fa86e', letterSpacing: s(3), marginTop: s(10) }}>▣ {streak}-DAY ACTIVE STREAK</Text>}
        <View style={{ height: 1, backgroundColor: 'rgba(143,168,110,0.3)', marginVertical: s(16) }} />
        <View style={{ flexDirection: 'row', gap: s(24) }}>
          {[timeStr && { v: timeStr, l: 'DURATION' }, calStr && { v: calStr, l: 'CALORIES' }, exCount && { v: String(exCount), l: 'OPS' }].filter(Boolean).map((st, i) => (
            <View key={i}>
              <Text style={{ fontSize: s(22), fontFamily, color: '#fff' }}>{st.v}</Text>
              <Text style={{ fontSize: s(8), fontFamily, color: '#8fa86e', letterSpacing: s(2), marginTop: s(2) }}>{st.l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: s(40), left: s(20) }}>
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(143,168,110,0.5)', letterSpacing: s(1) }}>OPERATOR: @{userName}</Text>
      </View>
    </View>
  );
}

// 11 — Polaroid
export function Polaroid({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#e8e0d8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#fff', padding: s(10), paddingBottom: s(32), shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: s(12), elevation: 8, transform: [{ rotate: '-2deg' }] }}>
        <View style={{ width: w * 0.72, height: w * 0.72, backgroundColor: '#ccc', overflow: 'hidden' }}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
            : <View style={{ flex: 1, backgroundColor: '#d4cfc9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(40) }}>💪</Text></View>}
        </View>
        <Text style={{ fontSize: fs(20), fontFamily, color: '#222', marginTop: s(14), textAlign: 'center', fontStyle: 'italic', letterSpacing: fs(-1) }}>{workout.type}</Text>
        <Text style={{ fontSize: s(11), fontFamily, color: '#888', textAlign: 'center', marginTop: s(4) }}>{dateStr}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: s(36), alignItems: 'center' }}>
        <Text style={{ fontSize: s(10), fontFamily, color: '#555', letterSpacing: s(3) }}>LOCKIN</Text>
        {streak > 0 && <Text style={{ fontSize: s(11), fontFamily, color: '#888', marginTop: s(4) }}>🔥 {streak} day streak  ·  @{userName}</Text>}
        {timeStr && <Text style={{ fontSize: s(11), fontFamily, color: '#aaa', marginTop: s(3) }}>{timeStr}</Text>}
      </View>
    </View>
  );
}

// 12 — Glass Card
export function Glass({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ width: w * 0.82, backgroundColor: 'rgba(8,11,16,0.82)', borderRadius: s(24), padding: s(28), borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
        <Text style={{ fontSize: s(11), fontFamily, color: ACCENT, letterSpacing: s(4), marginBottom: s(14) }}>LOCK<Text style={{ color: '#fff' }}>IN</Text></Text>
        <Text style={{ fontSize: fs(42), fontFamily, color: '#fff', letterSpacing: fs(-2) }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {streak > 0 && <Text style={{ fontSize: s(12), fontFamily, color: 'rgba(255,255,255,0.7)', marginTop: s(6) }}>🔥 {streak} day streak</Text>}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: s(18) }} />
        <View style={{ flexDirection: 'row', gap: s(16) }}>
          {[timeStr && { v: timeStr, l: 'TIME' }, calStr && { v: calStr, l: 'KCAL' }, exCount && { v: String(exCount), l: 'EX' }].filter(Boolean).map((st, i) => (
            <View key={i}>
              <Text style={{ fontSize: s(22), fontFamily, color: '#fff' }}>{st.v}</Text>
              <Text style={{ fontSize: s(9), fontFamily, color: ACCENT, letterSpacing: s(2) }}>{st.l}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.35)', marginTop: s(18) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 13 — Streak Hero
export function StreakHero({ photoUri, workout, streak, userName, dateStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#05070b', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <Text style={{ fontSize: s(110), lineHeight: s(110) }}>🔥</Text>
      <Text style={{ fontSize: s(72), fontFamily, color: '#fff', letterSpacing: s(-3), ...TS }}>{streak}</Text>
      <Text style={{ fontSize: s(13), fontFamily, color: ACCENT, letterSpacing: s(4), marginTop: s(4), ...TS }}>DAY STREAK</Text>
      <View style={{ height: 1, width: s(80), backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: s(24) }} />
      <Text style={{ fontSize: fs(22), fontFamily, color: '#fff', letterSpacing: fs(-1), ...TS }}>{workout.type.toUpperCase()}</Text>
      <Text style={{ fontSize: s(11), fontFamily, color: 'rgba(255,255,255,0.5)', marginTop: s(8), ...TS }}>{dateStr}  ·  @{userName}</Text>
      <View style={{ position: 'absolute', top: s(54), alignItems: 'center' }}>
        <Text style={{ fontSize: s(13), fontFamily, color: '#fff', letterSpacing: s(5), ...TS }}>LOCK<Text style={{ color: ACCENT }}>IN</Text></Text>
      </View>
    </View>
  );
}

// 14 — Split
export function Split({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#080b10', overflow: 'hidden' }}>
      <View style={{ height: h * 0.5, backgroundColor: '#0e1219', overflow: 'hidden' }}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(48) }}>💪</Text></View>}
        <View style={{ position: 'absolute', top: s(48), left: s(24) }}>
          <Text style={{ fontSize: s(14), fontFamily, color: '#fff', letterSpacing: s(5), ...TS }}>LOCK<Text style={{ color: ACCENT }}>IN</Text></Text>
        </View>
      </View>
      <View style={{ flex: 1, padding: s(24), justifyContent: 'center' }}>
        <Text style={{ fontSize: fs(38), fontFamily, color: '#fff', letterSpacing: fs(-2) }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {streak > 0 && <Text style={{ fontSize: s(12), fontFamily, color: ACCENT, marginTop: s(6), letterSpacing: s(1) }}>🔥 {streak} day streak</Text>}
        <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(18), flexWrap: 'wrap' }}>
          {[timeStr && { v: timeStr, l: 'TIME' }, calStr && { v: calStr, l: 'KCAL' }, exCount && { v: String(exCount), l: 'EX' }].filter(Boolean).map((st, i) => (
            <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: s(12), paddingHorizontal: s(14), paddingVertical: s(10) }}>
              <Text style={{ fontSize: s(22), fontFamily, color: '#fff' }}>{st.v}</Text>
              <Text style={{ fontSize: s(9), fontFamily, color: ACCENT, letterSpacing: s(2), marginTop: s(2) }}>{st.l}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.35)', marginTop: s(18) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 15 — Typography
export function Typography({ workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'center', padding: s(36) }}>
      <Text style={{ fontSize: s(9), fontFamily, color: '#aaa', letterSpacing: s(4), marginBottom: s(24) }}>LOCKIN  ·  {dateStr}</Text>
      <Text style={{ fontSize: fs(72), fontFamily, color: '#000', letterSpacing: fs(-4), lineHeight: fs(68) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
      <View style={{ height: s(4), backgroundColor: ACCENT, marginVertical: s(20), width: s(60) }} />
      {[timeStr && `${timeStr} duration`, calStr && `${calStr} kcal burned`, exCount && `${exCount} exercises`, streak > 0 && `🔥 ${streak} day streak`].filter(Boolean).map((line, i) => (
        <Text key={i} style={{ fontSize: s(15), fontFamily, color: '#333', marginBottom: s(6) }}>{line}</Text>
      ))}
      <Text style={{ position: 'absolute', bottom: s(48), right: s(36), fontSize: s(11), fontFamily, color: '#ccc', letterSpacing: s(2) }}>@{userName}</Text>
    </View>
  );
}

// 16 — Top Heavy
export function TopHeavy({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ position: 'absolute', top: s(70), left: s(28), right: s(28) }}>
        <Text style={{ fontSize: s(9), fontFamily, color: ACCENT, letterSpacing: s(4), marginBottom: s(14) }}>LOCKIN  ·  {streak > 0 ? `🔥 ${streak} DAY STREAK` : dateStr}</Text>
        <Text style={{ fontSize: fs(64), fontFamily, color: '#fff', letterSpacing: fs(-3), lineHeight: fs(62), ...TS }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', padding: s(24), flexDirection: 'row', justifyContent: 'space-around' }}>
        {[{ v: timeStr || '—', l: 'TIME' }, { v: calStr || '—', l: 'KCAL' }, { v: exCount ? String(exCount) : '—', l: 'EX' }].map((st, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: s(26), fontFamily, color: '#fff' }}>{st.v}</Text>
            <Text style={{ fontSize: s(9), fontFamily, color: ACCENT, letterSpacing: s(2), marginTop: s(3) }}>{st.l}</Text>
          </View>
        ))}
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: s(11), fontFamily, color: 'rgba(255,255,255,0.5)' }}>@{userName}</Text>
        </View>
      </View>
    </View>
  );
}

// 17 — Polaroid Stack (multiple overlapping polaroids)
export function PolaroidStack({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#d6cfc6', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Back card — rotated right */}
      <View style={{ position: 'absolute', backgroundColor: '#fff', padding: s(10), paddingBottom: s(28), transform: [{ rotate: '6deg' }, { translateX: s(18) }, { translateY: s(10) }], shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: s(8), elevation: 4 }}>
        <View style={{ width: w * 0.62, height: w * 0.62, backgroundColor: '#c8c2bb' }} />
        <Text style={{ fontSize: fs(12), fontFamily, color: '#bbb', textAlign: 'center', marginTop: s(10) }}>– – –</Text>
      </View>
      {/* Middle card — rotated left */}
      <View style={{ position: 'absolute', backgroundColor: '#fff', padding: s(10), paddingBottom: s(28), transform: [{ rotate: '-4deg' }, { translateX: s(-10) }, { translateY: s(6) }], shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: s(10), elevation: 6 }}>
        <View style={{ width: w * 0.62, height: w * 0.62, backgroundColor: '#b8b2ab' }} />
        <Text style={{ fontSize: fs(12), fontFamily, color: '#bbb', textAlign: 'center', marginTop: s(10) }}>– – –</Text>
      </View>
      {/* Front card */}
      <View style={{ backgroundColor: '#fff', padding: s(10), paddingBottom: s(32), transform: [{ rotate: '-1.5deg' }], shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: s(14), elevation: 10 }}>
        <View style={{ width: w * 0.64, height: w * 0.64, backgroundColor: '#ccc', overflow: 'hidden' }}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
            : <View style={{ flex: 1, backgroundColor: '#c8c2bb', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(36) }}>💪</Text></View>}
        </View>
        <Text style={{ fontSize: fs(17), fontFamily, color: '#1a1a1a', marginTop: s(12), textAlign: 'center', letterSpacing: fs(-0.5) }}>{workout.type}</Text>
        <Text style={{ fontSize: s(10), fontFamily, color: '#999', textAlign: 'center', marginTop: s(3) }}>{dateStr}</Text>
      </View>
      {/* Footer */}
      <View style={{ position: 'absolute', bottom: s(28), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(9), fontFamily, color: '#888', letterSpacing: s(3) }}>LOCKIN</Text>
        {streak > 0 && <Text style={{ fontSize: s(10), fontFamily, color: '#aaa', marginTop: s(3) }}>🔥 {streak} day streak  ·  @{userName}</Text>}
        {(timeStr || calStr) && (
          <Text style={{ fontSize: s(10), fontFamily, color: '#bbb', marginTop: s(2) }}>
            {[timeStr, calStr && `${calStr} kcal`].filter(Boolean).join('  ·  ')}
          </Text>
        )}
      </View>
    </View>
  );
}

// 18 — Polaroid Night (dark background, neon accent tape)
export function PolaroidNight({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#0e0e12', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Scattered dot texture */}
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={{ position: 'absolute', width: s(2), height: s(2), borderRadius: s(1), backgroundColor: 'rgba(255,255,255,0.04)', top: (i * 73) % h, left: (i * 137) % w }} />
      ))}
      {/* Tape strip top */}
      <View style={{ position: 'absolute', top: h * 0.18, left: w * 0.5 - s(30), width: s(60), height: s(18), backgroundColor: 'rgba(0,245,196,0.25)', transform: [{ rotate: '-2deg' }], zIndex: 10 }} />
      {/* Polaroid */}
      <View style={{ backgroundColor: '#1c1c22', padding: s(10), paddingBottom: s(36), transform: [{ rotate: '2deg' }], shadowColor: ACCENT, shadowOpacity: 0.2, shadowRadius: s(18), elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
        <View style={{ width: w * 0.66, height: w * 0.66, backgroundColor: '#111', overflow: 'hidden' }}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(38) }}>🌙</Text></View>}
        </View>
        <Text style={{ fontSize: fs(18), fontFamily, color: ACCENT, marginTop: s(14), textAlign: 'center', letterSpacing: fs(-0.5) }}>{workout.type}</Text>
        <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: s(4), letterSpacing: s(2) }}>{dateStr}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: s(32), alignItems: 'center' }}>
        <Text style={{ fontSize: s(10), fontFamily, color: ACCENT, letterSpacing: s(4) }}>LOCKIN</Text>
        {streak > 0 && <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.4)', marginTop: s(4) }}>🔥 {streak} streak  ·  @{userName}</Text>}
        {timeStr && <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.25)', marginTop: s(2) }}>{timeStr}</Text>}
      </View>
    </View>
  );
}

// 19 — Polaroid Scrapbook (craft paper bg, handwritten-feel, washi tape)
export function PolaroidScrapbook({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const tapeColors = ['rgba(255,220,100,0.55)', 'rgba(180,220,255,0.55)', 'rgba(255,180,200,0.55)'];
  return (
    <View style={{ width: w, height: h, backgroundColor: '#f0e8d8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Paper grain lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * (h / 12), height: 1, backgroundColor: 'rgba(0,0,0,0.03)' }} />
      ))}
      {/* Washi tape top-left corner */}
      <View style={{ position: 'absolute', top: h * 0.17, left: w * 0.12, width: s(52), height: s(16), backgroundColor: tapeColors[0], transform: [{ rotate: '-8deg' }] }} />
      {/* Washi tape bottom-right */}
      <View style={{ position: 'absolute', top: h * 0.61, right: w * 0.1, width: s(44), height: s(16), backgroundColor: tapeColors[2], transform: [{ rotate: '5deg' }] }} />
      {/* Polaroid */}
      <View style={{ backgroundColor: '#fff', padding: s(10), paddingBottom: s(40), transform: [{ rotate: '1.5deg' }], shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: s(10), elevation: 6 }}>
        <View style={{ width: w * 0.65, height: w * 0.65, backgroundColor: '#ddd', overflow: 'hidden' }}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
            : <View style={{ flex: 1, backgroundColor: '#e8e0d0', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(38) }}>✨</Text></View>}
        </View>
        {/* Handwritten-feel caption area */}
        <View style={{ marginTop: s(10), alignItems: 'center' }}>
          <Text style={{ fontSize: fs(15), fontFamily: 'PlayfairDisplay-ExtraBold', color: '#3d2b1f', textAlign: 'center', letterSpacing: fs(-0.5) }}>{workout.type}</Text>
          {(timeStr || calStr) && (
            <Text style={{ fontSize: s(10), fontFamily, color: '#a08070', marginTop: s(4) }}>
              {[timeStr, calStr && `${calStr} cal`].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </View>
      {/* Footer sticker-style */}
      <View style={{ position: 'absolute', bottom: s(24), alignItems: 'center' }}>
        <View style={{ backgroundColor: tapeColors[1], paddingHorizontal: s(14), paddingVertical: s(4), transform: [{ rotate: '-1deg' }] }}>
          <Text style={{ fontSize: s(9), fontFamily, color: '#2a4a6a', letterSpacing: s(2) }}>LOCKIN · {dateStr}</Text>
        </View>
        {streak > 0 && <Text style={{ fontSize: s(10), fontFamily, color: '#a08070', marginTop: s(6) }}>🔥 {streak} day streak  ·  @{userName}</Text>}
      </View>
    </View>
  );
}

// 20 — Zine (cut-paste collage, black & white, raw energy)
export function Zine({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#f2f0eb', overflow: 'hidden' }}>
      {/* Full bleed photo top half */}
      <View style={{ height: h * 0.48, backgroundColor: '#222', overflow: 'hidden' }}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', opacity: 0.85 }} resizeMode="cover" onLoad={onImageLoad} />
          : <View style={{ flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(52) }}>⚡</Text></View>}
        {/* Diagonal slash overlay */}
        <View style={{ position: 'absolute', bottom: -s(2), left: 0, right: 0, height: s(28), backgroundColor: '#f2f0eb', transform: [{ skewY: '-3deg' }] }} />
      </View>
      {/* Text block */}
      <View style={{ paddingHorizontal: s(20), paddingTop: s(18) }}>
        <Text style={{ fontSize: s(8), fontFamily: 'BarlowCondensed-Black', color: '#888', letterSpacing: s(5), marginBottom: s(6) }}>NO. 001  ·  {dateStr}</Text>
        <Text style={{ fontSize: fs(58), fontFamily: 'BarlowCondensed-Black', color: '#111', letterSpacing: fs(-3), lineHeight: fs(52) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        {/* Thick rule */}
        <View style={{ height: s(5), backgroundColor: '#111', marginTop: s(12), width: s(48) }} />
        <View style={{ flexDirection: 'row', gap: s(20), marginTop: s(12) }}>
          {[timeStr && { v: timeStr, l: 'TIME' }, calStr && { v: calStr, l: 'KCAL' }, streak > 0 && { v: `${streak}`, l: 'STREAK' }].filter(Boolean).map((st, i) => (
            <View key={i}>
              <Text style={{ fontSize: s(22), fontFamily: 'BarlowCondensed-Black', color: '#111' }}>{st.v}</Text>
              <Text style={{ fontSize: s(8), fontFamily, color: '#888', letterSpacing: s(2) }}>{st.l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: s(28), left: s(20), right: s(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: s(9), fontFamily: 'BarlowCondensed-Black', color: '#111', letterSpacing: s(4) }}>LOCKIN ZINE</Text>
        <Text style={{ fontSize: s(9), fontFamily, color: '#888' }}>@{userName}</Text>
      </View>
    </View>
  );
}

// 21 — Neon Sign (dark bg, glowing neon text)
export function NeonSign({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const neon = (color) => ({ textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: s(12) });
  return (
    <View style={{ width: w, height: h, backgroundColor: '#06080f', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      {/* Background glow blobs */}
      <View style={{ position: 'absolute', top: h * 0.1, left: w * 0.1, width: w * 0.5, height: w * 0.5, borderRadius: w * 0.25, backgroundColor: 'rgba(255,0,180,0.06)' }} />
      <View style={{ position: 'absolute', bottom: h * 0.1, right: w * 0.05, width: w * 0.4, height: w * 0.4, borderRadius: w * 0.2, backgroundColor: 'rgba(0,245,196,0.07)' }} />
      <View style={{ alignItems: 'center', paddingHorizontal: s(24) }}>
        <Text style={{ fontSize: s(11), fontFamily, color: '#ff00c8', letterSpacing: s(6), ...neon('#ff00c8') }}>✦ LOCKIN ✦</Text>
        <View style={{ height: 1, width: s(80), backgroundColor: 'rgba(255,0,200,0.3)', marginVertical: s(16) }} />
        <Text style={{ fontSize: fs(56), fontFamily, color: '#fff', letterSpacing: fs(-2), textAlign: 'center', lineHeight: fs(54), textShadowColor: '#fff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: s(8) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        <View style={{ height: 1, width: s(80), backgroundColor: 'rgba(0,245,196,0.3)', marginVertical: s(16) }} />
        <View style={{ flexDirection: 'row', gap: s(20) }}>
          {[timeStr && { v: timeStr, l: 'TIME', c: ACCENT }, calStr && { v: calStr, l: 'KCAL', c: '#ff6af5' }, streak > 0 && { v: `${streak}`, l: 'STREAK', c: '#ff00c8' }].filter(Boolean).map((st, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: s(24), fontFamily, color: st.c, ...neon(st.c) }}>{st.v}</Text>
              <Text style={{ fontSize: s(8), fontFamily, color: 'rgba(255,255,255,0.4)', letterSpacing: s(2), marginTop: s(2) }}>{st.l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: s(36), left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.25)', letterSpacing: s(2) }}>{dateStr}  ·  @{userName}</Text>
      </View>
    </View>
  );
}

// 22 — Receipt (thermal printer aesthetic)
export function Receipt({ workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  const Row = ({ label, value }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(5) }}>
      <Text style={{ fontSize: s(11), fontFamily: 'JetBrainsMono-Regular', color: '#1a1a1a' }}>{label}</Text>
      <Text style={{ fontSize: s(11), fontFamily: 'JetBrainsMono-Bold', color: '#1a1a1a' }}>{value}</Text>
    </View>
  );
  const Dashes = () => <Text style={{ fontSize: s(9), fontFamily: 'JetBrainsMono-Regular', color: '#aaa', letterSpacing: s(1) }}>{'- - - - - - - - - - - - - - -'}</Text>;
  return (
    <View style={{ width: w, height: h, backgroundColor: '#1a1a1a', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Receipt paper */}
      <View style={{ width: w * 0.78, backgroundColor: '#faf8f4', paddingHorizontal: s(18), paddingVertical: s(22), shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: s(20), elevation: 12 }}>
        {/* Torn edge top */}
        <View style={{ position: 'absolute', top: -s(6), left: 0, right: 0, height: s(8), backgroundColor: '#1a1a1a' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', bottom: 0, left: i * (w * 0.78 / 14), width: w * 0.78 / 14, height: s(8), backgroundColor: '#faf8f4', borderTopLeftRadius: s(4), borderTopRightRadius: s(4) }} />
          ))}
        </View>
        <Text style={{ fontSize: s(14), fontFamily: 'JetBrainsMono-ExtraBold', color: '#111', textAlign: 'center', letterSpacing: s(3), marginBottom: s(4) }}>LOCKIN GYM</Text>
        <Text style={{ fontSize: s(9), fontFamily: 'JetBrainsMono-Regular', color: '#888', textAlign: 'center', marginBottom: s(14) }}>{dateStr}</Text>
        <Dashes />
        <View style={{ marginVertical: s(10) }}>
          <Text style={{ fontSize: fs(22), fontFamily: 'JetBrainsMono-ExtraBold', color: '#111', textAlign: 'center', letterSpacing: fs(-1) }}>{workout.type.toUpperCase()}</Text>
        </View>
        <Dashes />
        <View style={{ marginTop: s(10) }}>
          {timeStr && <Row label="DURATION" value={timeStr} />}
          {calStr && <Row label="CALORIES" value={`${calStr} kcal`} />}
          {exCount > 0 && <Row label="EXERCISES" value={String(exCount)} />}
          {streak > 0 && <Row label="STREAK" value={`${streak} days 🔥`} />}
        </View>
        <Dashes />
        <View style={{ marginTop: s(10) }}>
          <Row label="ATHLETE" value={`@${userName}`} />
        </View>
        <Dashes />
        <Text style={{ fontSize: s(9), fontFamily: 'JetBrainsMono-Regular', color: '#bbb', textAlign: 'center', marginTop: s(14), lineHeight: s(14) }}>THANK YOU FOR SHOWING UP{'\n'}SEE YOU NEXT SESSION</Text>
        {/* Torn edge bottom */}
        <View style={{ position: 'absolute', bottom: -s(6), left: 0, right: 0, height: s(8), backgroundColor: '#1a1a1a' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', top: 0, left: i * (w * 0.78 / 14), width: w * 0.78 / 14, height: s(8), backgroundColor: '#faf8f4', borderBottomLeftRadius: s(4), borderBottomRightRadius: s(4) }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// 23 — Magazine Cover (editorial, bold masthead)
export function Magazine({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#e8e0d5', overflow: 'hidden' }}>
      {/* Red masthead bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(52), backgroundColor: '#d42b2b', justifyContent: 'center', paddingHorizontal: s(16), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: s(22), fontFamily: 'BarlowCondensed-Black', color: '#fff', letterSpacing: s(3) }}>LOCKIN</Text>
        <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(255,255,255,0.7)', letterSpacing: s(1) }}>FITNESS · {dateStr}</Text>
      </View>
      {/* Hero photo */}
      <View style={{ position: 'absolute', top: s(52), left: 0, right: 0, bottom: h * 0.32, backgroundColor: '#888', overflow: 'hidden' }}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onLoad={onImageLoad} />
          : <View style={{ flex: 1, backgroundColor: '#5a5a5a', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(56) }}>🏋️</Text></View>}
        {/* Overlay gradient */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(232,224,213,0.0)' }} />
      </View>
      {/* Cover lines bottom section */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.32, backgroundColor: '#e8e0d5', paddingHorizontal: s(16), paddingTop: s(12) }}>
        <Text style={{ fontSize: fs(42), fontFamily: 'BarlowCondensed-Black', color: '#111', letterSpacing: fs(-2), lineHeight: fs(38) }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
        <View style={{ height: s(3), backgroundColor: '#d42b2b', width: s(40), marginVertical: s(8) }} />
        <View style={{ flexDirection: 'row', gap: s(16), flexWrap: 'wrap' }}>
          {[timeStr && `⏱ ${timeStr}`, calStr && `🔥 ${calStr} kcal`, streak > 0 && `✦ ${streak}-DAY STREAK`, exCount > 0 && `${exCount} EXERCISES`].filter(Boolean).map((line, i) => (
            <Text key={i} style={{ fontSize: s(10), fontFamily, color: '#555' }}>{line}</Text>
          ))}
        </View>
        <View style={{ position: 'absolute', bottom: s(16), right: s(16) }}>
          <Text style={{ fontSize: s(9), fontFamily, color: '#999' }}>@{userName}</Text>
        </View>
      </View>
      {/* Streak badge */}
      {streak > 0 && (
        <View style={{ position: 'absolute', top: s(62), right: s(12), backgroundColor: '#d42b2b', width: s(48), height: s(48), borderRadius: s(24), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: s(16), fontWeight: '900', color: '#fff', lineHeight: s(17) }}>{streak}</Text>
          <Text style={{ fontSize: s(7), fontFamily, color: 'rgba(255,255,255,0.8)', letterSpacing: s(0.5) }}>DAYS</Text>
        </View>
      )}
    </View>
  );
}

// 24 — Ticket Stub (event ticket, perforated edge)
export function TicketStub({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1, onImageLoad }) {
  const fs = (n) => Math.round(s(n) * sizeScale);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#0f0f0f', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.08 }]} resizeMode="cover" onLoad={onImageLoad} /> : null}
      <View style={{ width: w * 0.86, overflow: 'hidden' }}>
        {/* Main ticket body */}
        <View style={{ backgroundColor: '#f5c842', padding: s(20) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: s(8), fontFamily: 'BarlowCondensed-Black', color: '#1a1a00', letterSpacing: s(4), marginBottom: s(6) }}>ADMIT ONE</Text>
              <Text style={{ fontSize: fs(36), fontFamily: 'BarlowCondensed-Black', color: '#1a1a00', letterSpacing: fs(-2), lineHeight: fs(34) }} numberOfLines={2} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
              <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(0,0,0,0.5)', marginTop: s(8) }}>{dateStr}</Text>
            </View>
            <View style={{ alignItems: 'center', marginLeft: s(12) }}>
              <Text style={{ fontSize: s(28) }}>🏆</Text>
              {streak > 0 && <Text style={{ fontSize: s(11), fontFamily: 'BarlowCondensed-Black', color: '#1a1a00', marginTop: s(4) }}>{streak}🔥</Text>}
            </View>
          </View>
          <View style={{ height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', marginVertical: s(14) }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[timeStr && { v: timeStr, l: 'DURATION' }, calStr && { v: calStr, l: 'KCAL BURNED' }].filter(Boolean).map((st, i) => (
              <View key={i}>
                <Text style={{ fontSize: s(18), fontFamily: 'BarlowCondensed-Black', color: '#1a1a00' }}>{st.v}</Text>
                <Text style={{ fontSize: s(8), fontFamily, color: 'rgba(0,0,0,0.5)', letterSpacing: s(1) }}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Perforation line */}
        <View style={{ height: s(20), backgroundColor: '#1a1a00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(4) }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: s(2), backgroundColor: '#f5c842', marginHorizontal: s(2), borderRadius: 1, opacity: 0.6 }} />
          ))}
        </View>
        {/* Stub */}
        <View style={{ backgroundColor: '#1a1a00', padding: s(14), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: s(9), fontFamily: 'BarlowCondensed-Black', color: '#f5c842', letterSpacing: s(3) }}>LOCKIN GYM</Text>
          <Text style={{ fontSize: s(9), fontFamily, color: 'rgba(245,200,66,0.5)' }}>@{userName}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Preset registry — add new presets here ───────────────────────────────────
// To add a new preset: create the function above, export it, then add it to
// PRESETS and PRESET_NAMES at the same index.
export const PRESETS = [
  Raw, Statement, Stripped, Classic, Minimal, GenZ, Retro,
  Brutalist, Pastel, Cinematic, Military, Polaroid, Glass,
  StreakHero, Split, Typography, TopHeavy,
  // New presets — add more below this line
  PolaroidStack, PolaroidNight, PolaroidScrapbook,
  Zine, NeonSign, Receipt, Magazine, TicketStub,
];

export const PRESET_NAMES = [
  'Raw', 'Statement', 'Stripped',
  'Classic', 'Minimal', 'Gen Z', 'Retro 80s',
  'Brutalist', 'Pastel', 'Cinematic', 'Military',
  'Polaroid', 'Glass', 'Streak Hero', 'Split',
  'Typography', 'Top Heavy',
  // New preset names — keep in sync with PRESETS above
  'Polaroid Stack', 'Polaroid Night', 'Polaroid Scrapbook',
  'Zine', 'Neon Sign', 'Receipt', 'Magazine', 'Ticket Stub',
];
