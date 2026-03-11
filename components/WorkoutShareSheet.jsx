import { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, TextInput, Dimensions, ScrollView,
  BackHandler, Modal, StatusBar,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { createPost } from '../../services/socialService';
import { useTheme } from '../../hooks/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');
const STORY_W = SW;
const STORY_H = SW * (16 / 9);
const THUMB_H = SH * 0.42;
const THUMB_W = THUMB_H * (9 / 16);
const SIDE_PAD = (SW - THUMB_W) / 2;
const ACCENT = '#00f5c4';
const TS = { textShadowColor: '#000', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 };

// ─── Font options ─────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { key: 'barlow',    label: 'Barlow',    family: 'Barlow-SemiBold',          weight: '700' },
  { key: 'condensed', label: 'Condensed', family: 'BarlowCondensed-Black',    weight: '900' },
  { key: 'dm',        label: 'DM Sans',   family: 'DMSans-ExtraBold',         weight: '800' },
  { key: 'mono',      label: 'Mono',      family: 'JetBrainsMono-ExtraBold',  weight: '800' },
  { key: 'nunito',    label: 'Nunito',    family: 'Nunito-ExtraBold',         weight: '800' },
  { key: 'playfair',  label: 'Playfair',  family: 'PlayfairDisplay-ExtraBold',weight: '800' },
];
const SIZE_OPTIONS  = [
  { key: 'xs',  label: 'XS',  scale: 0.72 },
  { key: 'sm',  label: 'S',   scale: 0.86 },
  { key: 'md',  label: 'M',   scale: 1.00 },
  { key: 'lg',  label: 'L',   scale: 1.16 },
  { key: 'xl',  label: 'XL',  scale: 1.32 },
];
const SPACE_OPTIONS = [
  { key: 'tight',  label: 'Tight',  letter: -3, line: -0.05 },
  { key: 'normal', label: 'Normal', letter: -1, line: 0     },
  { key: 'wide',   label: 'Wide',   letter:  2, line: 0.04  },
  { key: 'wider',  label: 'Wider',  letter:  5, line: 0.09  },
];

// ─── Time formatting — single line ───────────────────────────────────────────
function fmtTime(sec) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
function fmtCal(c) {
  if (!c) return null;
  return c >= 1000 ? `${(c / 1000).toFixed(1)}k` : `${c}`;
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const PRESETS = [

  // 0 — Raw
  function Raw({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
    fontFamily, sizeScale, letterMult, lineMult }) {
    const fs  = (n) => Math.round(s(n) * sizeScale);
    const ls  = (n) => Math.round(s(n) * letterMult);
    const lh  = (n, fSize) => Math.round(fSize * (1 + lineMult));
    const statItems = [
      streak > 0 && { v: `${streak}`, l: 'STREAK' },
      calStr       && { v: calStr,    l: 'CAL'    },
      timeStr      && { v: timeStr,   l: 'TIME'   },
    ].filter(Boolean);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.24 }]} resizeMode="cover" /> : null}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.22, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: s(8) }}>
          <Text style={{ fontSize: fs(30), fontFamily, color: '#fff', letterSpacing: ls(-1), ...TS }}>LockIn</Text>
        </View>
        <View style={{ position: 'absolute', top: h * 0.22, left: s(24), right: s(24), height: h * 0.44, justifyContent: 'center' }}>
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
                    <Text style={{ fontSize: fs(8), color: 'rgba(255,255,255,0.45)', letterSpacing: ls(2), marginTop: s(2), fontFamily }}>{st.l}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Text style={{ fontSize: fs(10), color: 'rgba(255,255,255,0.38)', marginTop: s(10), letterSpacing: ls(1), fontFamily }}>@{userName}  ·  {dateStr}</Text>
        </View>
      </View>
    );
  },

  // 1 — Statement
  function Statement({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
    fontFamily, sizeScale, letterMult, lineMult }) {
    const fs  = (n) => Math.round(s(n) * sizeScale);
    const ls  = (n) => Math.round(s(n) * letterMult);
    const lh  = (n, fSize) => Math.round(fSize * (1 + lineMult));
    const statItems = [
      streak > 0 && { v: `${streak}`, l: 'STREAK' },
      calStr       && { v: calStr,    l: 'CAL'    },
      timeStr      && { v: timeStr,   l: 'TIME'   },
    ].filter(Boolean);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.22 }]} resizeMode="cover" /> : null}
        <View style={{ position: 'absolute', top: 0, left: s(24), right: s(24), height: h * 0.28, justifyContent: 'flex-end', paddingBottom: s(6) }}>
          <Text style={{ fontSize: fs(48), fontFamily, color: '#fff', letterSpacing: ls(-2), lineHeight: lh(0, fs(48)), ...TS }}>LOCKIN</Text>
        </View>
        <View style={{ position: 'absolute', top: h * 0.28, left: 0, right: 0, height: h * 0.38, justifyContent: 'center', paddingHorizontal: s(24) }}>
          {statItems.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {statItems.map((st, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {i > 0 && <View style={{ width: 1, height: fs(28), backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: s(10) }} />}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: fs(22), fontFamily, color: '#fff', ...TS }}>{st.v}</Text>
                    <Text style={{ fontSize: fs(9), color: 'rgba(255,255,255,0.45)', letterSpacing: ls(2), marginTop: s(2), fontFamily }}>{st.l}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ position: 'absolute', top: h * 0.66, left: s(24), right: s(24), bottom: 0, justifyContent: 'center' }}>
          <Text style={{ fontSize: fs(44), fontFamily, color: '#fff', letterSpacing: ls(-2), lineHeight: lh(0, fs(44)), ...TS }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
          <Text style={{ fontSize: fs(10), color: 'rgba(255,255,255,0.38)', marginTop: s(8), letterSpacing: ls(1), fontFamily }}>@{userName}  ·  {dateStr}</Text>
        </View>
      </View>
    );
  },

  // 2 — Stripped
  function Stripped({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s,
    fontFamily, sizeScale, letterMult, lineMult }) {
    const fs  = (n) => Math.round(s(n) * sizeScale);
    const ls  = (n) => Math.round(s(n) * letterMult);
    const lh  = (n, fSize) => Math.round(fSize * (1 + lineMult));
    const statParts = [
      calStr       && { v: calStr,      l: 'CAL'    },
      timeStr      && { v: timeStr,     l: 'TIME'   },
      streak > 0   && { v: `${streak}`, l: 'STREAK' },
    ].filter(Boolean);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.22 }]} resizeMode="cover" /> : null}
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
                    <Text style={{ fontSize: fs(8), color: 'rgba(255,255,255,0.45)', letterSpacing: ls(1), marginTop: s(2), fontFamily }}>{st.l}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Text style={{ fontSize: fs(10), color: 'rgba(255,255,255,0.38)', marginTop: s(10), letterSpacing: ls(1), fontFamily }}>@{userName}  ·  {dateStr}</Text>
        </View>
      </View>
    );
  },

  // 3 — Classic
  function Classic({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s,
    fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    const hero = timeStr ? { v: timeStr, l: null } : calStr ? { v: calStr, l: 'KCAL' } : exCount ? { v: String(exCount), l: 'EXERCISES' } : null;
    const sec2 = [calStr && timeStr && { v: calStr, l: 'KCAL' }, exCount && { v: String(exCount), l: 'EXERCISES' }].filter(Boolean);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#0e1219', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: s(60), alignItems: 'center' }}>
          <Text style={{ fontSize: s(22), fontFamily, color: '#fff', letterSpacing: s(6), ...TS }}>LOCK<Text style={{ color: ACCENT }}>IN</Text></Text>
          {streak > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(5), marginTop: s(10) }}><Text style={{ fontSize: s(14) }}>🔥</Text><Text style={{ fontSize: s(11), fontFamily, color: 'rgba(255,255,255,0.95)', letterSpacing: s(2), ...TS }}>{streak} DAY STREAK</Text></View>}
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
  },

  // 4 — Minimal
  function Minimal({ photoUri, workout, userName, dateStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: s(40), paddingBottom: s(60) }}>
          <Text style={{ fontSize: s(11), fontFamily, color: ACCENT, letterSpacing: s(4), marginBottom: s(8), ...TS }}>LOCKIN</Text>
          <Text style={{ fontSize: fs(52), fontFamily, color: '#fff', letterSpacing: fs(-2), lineHeight: fs(54), ...TS }}>{workout.type.toUpperCase()}</Text>
          <Text style={{ fontSize: s(13), fontFamily, color: 'rgba(255,255,255,0.7)', marginTop: s(12), letterSpacing: s(1), ...TS }}>{dateStr}  ·  @{userName}</Text>
        </View>
      </View>
    );
  },

  // 5 — Gen Z
  function GenZ({ photoUri, workout, streak, userName, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} resizeMode="cover" /> : null}
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
  },

  // 6 — Retro 80s
  function Retro({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#1a0033', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} resizeMode="cover" /> : null}
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
  },

  // 7 — Brutalist
  function Brutalist({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#f5f0e8', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} resizeMode="cover" /> : null}
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
  },

  // 8 — Pastel
  function Pastel({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#fef6f0', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" /> : null}
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
  },

  // 9 — Cinematic
  function Cinematic({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
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
  },

  // 10 — Military
  function Military({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#1a1f10', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} resizeMode="cover" /> : null}
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
  },

  // 11 — Polaroid
  function Polaroid({ photoUri, workout, streak, userName, dateStr, timeStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#e8e0d8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#fff', padding: s(10), paddingBottom: s(32), shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: s(12), elevation: 8, transform: [{ rotate: '-2deg' }] }}>
          <View style={{ width: w * 0.72, height: w * 0.72, backgroundColor: '#ccc', overflow: 'hidden' }}>
            {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <View style={{ flex: 1, backgroundColor: '#d4cfc9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(40) }}>💪</Text></View>}
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
  },

  // 12 — Glass Card
  function Glass({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={{ width: w * 0.82, backgroundColor: 'rgba(8,11,16,0.82)', borderRadius: s(24), padding: s(28), borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Text style={{ fontSize: s(11), fontFamily, color: ACCENT, letterSpacing: s(4), marginBottom: s(14) }}>LOCK<Text style={{ color: '#fff' }}>IN</Text></Text>
          <Text style={{ fontSize: fs(42), fontFamily, color: '#fff', letterSpacing: fs(-2) }} numberOfLines={1} adjustsFontSizeToFit>{workout.type.toUpperCase()}</Text>
          {streak > 0 && <Text style={{ fontSize: s(12), fontFamily, color: 'rgba(255,255,255,0.7)', marginTop: s(6) }}>🔥 {streak} day streak</Text>}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: s(18) }} />
          <View style={{ flexDirection: 'row', gap: s(16) }}>
            {[timeStr && { v: timeStr, l: 'TIME' }, calStr && { v: calStr, l: 'KCAL' }, exCount && { v: String(exCount), l: 'EX' }].filter(Boolean).map((st, i) => (
              <View key={i}><Text style={{ fontSize: s(22), fontFamily, color: '#fff' }}>{st.v}</Text><Text style={{ fontSize: s(9), fontFamily, color: ACCENT, letterSpacing: s(2) }}>{st.l}</Text></View>
            ))}
          </View>
          <Text style={{ fontSize: s(10), fontFamily, color: 'rgba(255,255,255,0.35)', marginTop: s(18) }}>{dateStr}  ·  @{userName}</Text>
        </View>
      </View>
    );
  },

  // 13 — Streak Hero
  function StreakHero({ photoUri, workout, streak, userName, dateStr, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#05070b', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} resizeMode="cover" /> : null}
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
  },

  // 14 — Split
  function Split({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#080b10', overflow: 'hidden' }}>
        <View style={{ height: h * 0.5, backgroundColor: '#0e1219', overflow: 'hidden' }}>
          {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(48) }}>💪</Text></View>}
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
  },

  // 15 — Typography
  function Typography({ workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1 }) {
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
  },

  // 16 — Top Heavy
  function TopHeavy({ photoUri, workout, streak, userName, dateStr, timeStr, calStr, exCount, w, h, s, fontFamily, sizeScale = 1 }) {
    const fs = (n) => Math.round(s(n) * sizeScale);
    return (
      <View style={{ width: w, height: h, backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} resizeMode="cover" /> : null}
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
          <View style={{ justifyContent: 'center' }}><Text style={{ fontSize: s(11), fontFamily, color: 'rgba(255,255,255,0.5)' }}>@{userName}</Text></View>
        </View>
      </View>
    );
  },
];

const PRESET_NAMES = [
  'Raw', 'Statement', 'Stripped',
  'Classic', 'Minimal', 'Gen Z', 'Retro 80s',
  'Brutalist', 'Pastel', 'Cinematic', 'Military',
  'Polaroid', 'Glass', 'Streak Hero', 'Split',
  'Typography', 'Top Heavy',
];

// ─── Thumbnail renderer ───────────────────────────────────────────────────────
function PresetCard({ index, photoUri, workout, streak, userName, fontOpts }) {
  const dateStr = workout.date ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase() : format(new Date(), 'MMM d · yyyy').toUpperCase();
  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const exCount = workout.exercises?.length || 0;
  const scale   = THUMB_W / STORY_W;
  const s       = (n) => Math.round(n * scale);
  const Layout  = PRESETS[index];
  return (
    <Layout
      photoUri={photoUri} workout={workout} streak={streak} userName={userName}
      dateStr={dateStr} timeStr={timeStr} calStr={calStr} exCount={exCount}
      w={THUMB_W} h={THUMB_H} s={s}
      fontFamily={fontOpts.family}
      sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
    />
  );
}

// ─── Off-screen capture target ────────────────────────────────────────────────
function StoryCard({ cardRef, photoUri, workout, streak, userName, presetIndex, fontOpts }) {
  const dateStr = workout.date ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase() : format(new Date(), 'MMM d · yyyy').toUpperCase();
  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const exCount = workout.exercises?.length || 0;
  const Layout  = PRESETS[presetIndex];
  return (
    <View ref={cardRef} collapsable={false} pointerEvents="none"
      style={{ position: 'absolute', top: -STORY_H - 100, left: 0, width: STORY_W, height: STORY_H, overflow: 'hidden' }}>
      <Layout
        photoUri={photoUri} workout={workout} streak={streak} userName={userName}
        dateStr={dateStr} timeStr={timeStr} calStr={calStr} exCount={exCount}
        w={STORY_W} h={STORY_H} s={(n) => n}
        fontFamily={fontOpts.family}
        sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
      />
    </View>
  );
}

// ─── Camera ───────────────────────────────────────────────────────────────────
function CameraScreen({ onCapture, onClose }) {
  const camRef = useRef(null);
  const [facing, setFacing] = useState('front');
  const [perm, requestPerm] = useCameraPermissions();
  if (!perm) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!perm.granted) {
    return (
      <View style={cam.permRoot}>
        <Ionicons name="camera-outline" size={48} color={ACCENT} />
        <Text style={cam.permText}>Camera access needed</Text>
        <TouchableOpacity style={cam.permBtn} onPress={requestPerm}><Text style={cam.permBtnText}>Allow Camera</Text></TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 14 }}><Text style={{ color: '#6b7a99', fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={camRef} style={{ flex: 1 }} facing={facing}>
        <TouchableOpacity style={cam.backBtn} onPress={onClose}><Ionicons name="chevron-back" size={22} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={cam.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}><Ionicons name="camera-reverse-outline" size={24} color="#fff" /></TouchableOpacity>
        <View style={cam.shutterWrap}>
          <TouchableOpacity style={cam.shutter} onPress={async () => {
            if (!camRef.current) return;
            const p = await camRef.current.takePictureAsync({ quality: 0.9 });
            onCapture(p.uri);
          }}><View style={cam.shutterInner} /></TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

// ─── Font Picker Panel ────────────────────────────────────────────────────────
function FontPanel({ fontKey, sizeKey, spaceKey, onFont, onSize, onSpace }) {
  return (
    <View style={fp.panel}>
      <View style={fp.row}>
        <Text style={fp.rowLabel}>Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fp.chips}>
          {FONT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[fp.chip, fontKey === opt.key && fp.chipActive]} onPress={() => onFont(opt.key)}>
              <Text style={[fp.chipTxt, fontKey === opt.key && fp.chipTxtActive, { fontFamily: opt.family }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={fp.row}>
        <Text style={fp.rowLabel}>Size</Text>
        <View style={fp.chips}>
          {SIZE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[fp.chip, sizeKey === opt.key && fp.chipActive]} onPress={() => onSize(opt.key)}>
              <Text style={[fp.chipTxt, sizeKey === opt.key && fp.chipTxtActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={fp.row}>
        <Text style={fp.rowLabel}>Spacing</Text>
        <View style={fp.chips}>
          {SPACE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[fp.chip, spaceKey === opt.key && fp.chipActive]} onPress={() => onSpace(opt.key)}>
              <Text style={[fp.chipTxt, spaceKey === opt.key && fp.chipTxtActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutShareSheet(props) {
  const { navigation, route, onClose } = props;
  const workout  = props.workout  ?? route?.params?.workout;
  const streak   = props.streak   ?? route?.params?.streak   ?? 0;
  const userName = props.userName ?? route?.params?.userName ?? 'Athlete';
  const userId   = props.userId   ?? route?.params?.userId;
  const handleClose = onClose ?? (() => navigation?.goBack());

  const { font: F } = useTheme();
  const cardRef      = useRef(null);
  const scrollRef    = useRef(null);
  const previewScrollRef = useRef(null); // ref for the preview modal scroll

  const [photoUri,    setPhotoUri]    = useState(null);
  const [camOpen,     setCamOpen]     = useState(false);
  const [posting,     setPosting]     = useState(false);
  const [caption,     setCaption]     = useState('');
  const [imageReady,  setImageReady]  = useState(true);
  const [previewing,  setPreviewing]  = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  const [fontKey,  setFontKey]  = useState('barlow');
  const [sizeKey,  setSizeKey]  = useState('md');
  const [spaceKey, setSpaceKey] = useState('tight');

  const fontOpt  = FONT_OPTIONS.find(o => o.key === fontKey)  || FONT_OPTIONS[0];
  const sizeOpt  = SIZE_OPTIONS.find(o => o.key === sizeKey)  || SIZE_OPTIONS[2];
  const spaceOpt = SPACE_OPTIONS.find(o => o.key === spaceKey) || SPACE_OPTIONS[0];

  const fontOpts = {
    family:     fontOpt.family,
    sizeScale:  sizeOpt.scale,
    letterMult: spaceOpt.letter / 10,
    lineMult:   spaceOpt.line,
  };

  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const [fontPanelOpen, setFontPanelOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (camOpen)    { setCamOpen(false);    return true; }
      if (previewing) { setPreviewing(false); return true; }
      handleClose(); return true;
    });
    return () => sub.remove();
  }, [camOpen, previewing]));

  const capture = async () => {
    if (!imageReady) { Alert.alert('Please wait', 'Photo is still loading.'); return null; }
    try { return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' }); }
    catch { Alert.alert('Error', 'Could not capture card.'); return null; }
  };

  const handleSave = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow media access to save.');
    const uri = await capture(); if (!uri) return;
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved! 🎉', 'Story card saved to your gallery.');
  };

  const handleShare = async () => {
    const uri = await capture(); if (!uri) return;
    if (!(await Sharing.isAvailableAsync())) return Alert.alert('Sharing not available.');
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your workout' });
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
    if (!result.canceled) { setImageReady(false); setPhotoUri(result.assets[0].uri); }
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      await createPost(userId, userName, { imageUri: photoUri, workoutType: workout.type, streak, date: workout.date || format(new Date(), 'yyyy-MM-dd'), durationSeconds: workout.durationSeconds || 0, caloriesBurned: workout.caloriesBurned || 0, caption: caption.trim(), exercises: workout.exercises || [] });
      Alert.alert('Posted! 🔥', 'Your workout is live on the community feed!', [
        { text: 'View Feed', onPress: () => { handleClose(); navigation?.navigate('Feed'); } },
        { text: 'OK', onPress: handleClose },
      ]);
    } catch { Alert.alert('Error', 'Could not post. Try again.'); }
    finally { setPosting(false); }
  };

  // Sync main carousel + preset index
  const goToPreset = (i) => {
    scrollRef.current?.scrollTo({ x: i * SW, animated: true });
    setPresetIndex(i);
    if (hintVisible) setHintVisible(false);
  };

  const onScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== presetIndex && idx >= 0 && idx < PRESETS.length) {
      setPresetIndex(idx);
      if (hintVisible) setHintVisible(false);
    }
  }, [presetIndex, hintVisible]);

  // Preview modal swipe — syncs back to main carousel
  const onPreviewScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx >= 0 && idx < PRESETS.length && idx !== presetIndex) {
      setPresetIndex(idx);
      scrollRef.current?.scrollTo({ x: idx * SW, animated: false });
    }
  }, [presetIndex]);

  // When preview opens, jump to current preset position
  const openPreview = () => {
    setPreviewing(true);
    // Small delay so the modal ScrollView is mounted before we scroll
    setTimeout(() => {
      previewScrollRef.current?.scrollTo({ x: presetIndex * SW, animated: false });
    }, 50);
  };

  const dateStr = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase()
    : format(new Date(), 'MMM d · yyyy').toUpperCase();

  if (camOpen) {
    return <CameraScreen onCapture={(uri) => { setImageReady(false); setPhotoUri(uri); setCamOpen(false); }} onClose={() => setCamOpen(false)} />;
  }

  return (
    <View style={sh.root}>
      <StoryCard cardRef={cardRef} photoUri={photoUri} workout={workout} streak={streak} userName={userName} presetIndex={presetIndex} fontOpts={fontOpts} />

      {/* ─── Full-screen preview modal with swipeable presets ─── */}
      <Modal visible={previewing} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewing(false)}>
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <ScrollView
            ref={previewScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={onPreviewScroll}
            style={{ flex: 1 }}
          >
            {PRESETS.map((_, i) => {
              const Layout = PRESETS[i];
              return (
                <View key={i} style={{ width: SW, height: SH, justifyContent: 'center' }}>
                  <Layout
                    photoUri={photoUri} workout={workout} streak={streak} userName={userName}
                    dateStr={dateStr} timeStr={timeStr} calStr={calStr}
                    exCount={workout.exercises?.length || 0}
                    w={SW} h={SH} s={(n) => n}
                    fontFamily={fontOpts.family}
                    sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
                  />
                </View>
              );
            })}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setPreviewing(false)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Preset name overlay */}
          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: ACCENT, letterSpacing: 1.5 }}>{PRESET_NAMES[presetIndex]}</Text>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sh.scroll} keyboardShouldPersistTaps="handled">

        {/* HEADER */}
        <View style={sh.header}>
          <TouchableOpacity onPress={handleClose} style={sh.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[sh.title, { fontFamily: F.display }]}>Share</Text>
            <Text style={sh.sub}>{workout.type}{timeStr ? `  ·  ${timeStr}` : ''}{calStr ? `  ·  ${calStr} kcal` : ''}</Text>
          </View>
        </View>

        {/* CAROUSEL */}
        <View style={sh.cardZone}>
          <ScrollView
            ref={scrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={onScroll}
            style={{ width: SW }}
          >
            {PRESETS.map((_, i) => (
              <View key={i} style={{ width: SW, height: THUMB_H, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={openPreview}
                  style={{ width: THUMB_W, height: THUMB_H, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 }}
                >
                  <PresetCard index={i} photoUri={photoUri} workout={workout} streak={streak} userName={userName} fontOpts={fontOpts} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {hintVisible && (
            <View style={sh.swipeHint} pointerEvents="none">
              <Ionicons name="swap-horizontal-outline" size={13} color="rgba(255,255,255,0.55)" />
              <Text style={sh.swipeHintTxt}>swipe anywhere to change style</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sh.dotsRow}>
            {PRESETS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goToPreset(i)} style={[sh.dot, i === presetIndex && sh.dotActive]} />
            ))}
          </ScrollView>

          <Text style={sh.presetName}>{PRESET_NAMES[presetIndex]}</Text>
          <Text style={sh.tapHintTxt}>
            <Ionicons name="expand-outline" size={11} color="#3a4560" />{'  '}Tap card to preview full story · swipe to change
          </Text>
        </View>

        {/* FONT TOGGLE + PANEL */}
        <TouchableOpacity
          onPress={() => setFontPanelOpen(o => !o)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e2535' }}
          activeOpacity={0.75}
        >
          <Ionicons name="text-outline" size={15} color={fontPanelOpen ? ACCENT : '#4a5568'} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: fontPanelOpen ? ACCENT : '#4a5568', flex: 1 }}>Font &amp; Style</Text>
          <Text style={{ fontSize: 11, color: '#3a4560' }}>{FONT_OPTIONS.find(o => o.key === fontKey)?.label}  ·  {SIZE_OPTIONS.find(o => o.key === sizeKey)?.label}  ·  {SPACE_OPTIONS.find(o => o.key === spaceKey)?.label}</Text>
          <Ionicons name={fontPanelOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#3a4560" />
        </TouchableOpacity>
        {fontPanelOpen && (
          <FontPanel
            fontKey={fontKey} sizeKey={sizeKey} spaceKey={spaceKey}
            onFont={setFontKey} onSize={setSizeKey} onSpace={setSpaceKey}
          />
        )}

        {/* PHOTO CONTROLS */}
        <View style={sh.photoRow}>
          <TouchableOpacity style={sh.photoChip} onPress={() => setCamOpen(true)}>
            <Ionicons name="camera-outline" size={15} color={ACCENT} />
            <Text style={[sh.photoChipTxt, { color: ACCENT }]}>{photoUri ? 'Retake' : 'Camera'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sh.photoChip} onPress={pickFromGallery}>
            <Ionicons name="image-outline" size={15} color="#a78bfa" />
            <Text style={[sh.photoChipTxt, { color: '#a78bfa' }]}>{photoUri ? 'Change' : 'Gallery'}</Text>
          </TouchableOpacity>
          {photoUri && (
            <TouchableOpacity style={sh.photoChip} onPress={() => { setPhotoUri(null); setImageReady(true); }}>
              <Ionicons name="trash-outline" size={15} color="#ff6b6b" />
              <Text style={[sh.photoChipTxt, { color: '#ff6b6b' }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CAPTION */}
        <View style={sh.captionWrap}>
          <TextInput style={[sh.captionInput, { fontFamily: F.body }]} placeholder="say something… 💪" placeholderTextColor="#3a4560" value={caption} onChangeText={setCaption} multiline maxLength={200} />
          <Text style={sh.captionCount}>{caption.length}/200</Text>
        </View>

        {/* SHARE ACTIONS */}
        <View style={sh.actionsRow}>
          {[
            { icon: 'download-outline', color: ACCENT,    label: 'Save',      fn: handleSave  },
            { icon: 'logo-whatsapp',    color: '#25D366', label: 'WhatsApp',  fn: handleShare },
            { icon: 'logo-instagram',   color: '#E1306C', label: 'Instagram', fn: handleShare },
            { icon: 'share-outline',    color: '#f97316', label: 'More',      fn: handleShare },
          ].map(({ icon, color, label, fn }) => (
            <TouchableOpacity key={label} style={sh.actionBtn} onPress={fn} activeOpacity={0.75}>
              <View style={[sh.actionIcon, { backgroundColor: color + '15', borderColor: color + '28', borderWidth: 1 }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={sh.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* POST */}
        <TouchableOpacity style={[sh.postBtn, posting && { opacity: 0.5 }]} onPress={handlePost} disabled={posting} activeOpacity={0.85}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <Text style={[sh.postBtnTxt, { fontFamily: F.heading }]}>{posting ? 'Posting...' : 'Post to LockIn Community'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── Camera styles ─────────────────────────────────────────────────────────────
const cam = StyleSheet.create({
  backBtn:      { position: 'absolute', top: 52, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  flipBtn:      { position: 'absolute', top: 52, right: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  shutterWrap:  { position: 'absolute', bottom: 52, left: 0, right: 0, alignItems: 'center' },
  shutter:      { width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  permRoot:     { flex: 1, backgroundColor: '#080b10', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permText:     { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  permBtn:      { backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnText:  { color: '#080b10', fontWeight: '800', fontSize: 15 },
});

// ─── Font panel styles ─────────────────────────────────────────────────────────
const fp = StyleSheet.create({
  panel:        { backgroundColor: '#0c1018', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1e2535', paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel:     { fontSize: 10, fontWeight: '900', color: '#3a4560', letterSpacing: 1.5, textTransform: 'uppercase', width: 54 },
  chips:        { flexDirection: 'row', gap: 6, flexWrap: 'nowrap', alignItems: 'center' },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535' },
  chipActive:   { backgroundColor: ACCENT + '18', borderColor: ACCENT + '60' },
  chipTxt:      { fontSize: 12, fontWeight: '700', color: '#4a5568' },
  chipTxtActive:{ color: ACCENT },
});

// ─── Sheet styles ──────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#080b10' },
  scroll: { paddingBottom: 40 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535', alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub:     { fontSize: 12, color: '#3a4560', fontWeight: '600', marginTop: 1 },

  cardZone:     { width: SW, paddingBottom: 14, backgroundColor: '#05070b' },
  swipeHint:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 10, alignSelf: 'center' },
  swipeHintTxt: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.3 },

  dotsRow:   { flexDirection: 'row', gap: 5, marginTop: 12, alignItems: 'center', paddingHorizontal: SIDE_PAD },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 16, height: 5, borderRadius: 3, backgroundColor: ACCENT },
  presetName:  { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 1.5, marginTop: 6, textTransform: 'uppercase', textAlign: 'center' },
  tapHintTxt:  { fontSize: 11, color: '#3a4560', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  photoRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#1e2535' },
  photoChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535' },
  photoChipTxt: { fontSize: 13, fontWeight: '700' },

  captionWrap:  { marginHorizontal: 20, marginTop: 4, marginBottom: 4, backgroundColor: '#0e1219', borderRadius: 14, borderWidth: 1, borderColor: '#1e2535', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  captionInput: { fontSize: 14, color: '#fff', minHeight: 44, maxHeight: 80, textAlignVertical: 'top', lineHeight: 20 },
  captionCount: { fontSize: 10, fontWeight: '600', color: '#3a4560', textAlign: 'right', marginTop: 4 },

  actionsRow:  { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20, paddingVertical: 16 },
  actionBtn:   { alignItems: 'center', gap: 6 },
  actionIcon:  { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#3a4560' },

  postBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, borderRadius: 16, height: 52, backgroundColor: 'rgba(0,245,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.25)' },
  postBtnTxt: { fontSize: 15, fontWeight: '800', color: ACCENT },
});