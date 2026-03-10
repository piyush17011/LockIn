import { useState } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet,
  Modal, Pressable, ScrollView,
} from 'react-native';
import { useTheme } from '../../hooks/ThemeContext';

export default function ColorSwitcher() {
  const {
    scheme: C, font: F,
    schemeId, setSchemeId, ColorSchemes,
    fontId,   setFontId,   FontSchemes,
  } = useTheme();

  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState('COLOR'); // 'COLOR' | 'FONT'

  const colorList = Object.values(ColorSchemes);
  const fontList  = Object.values(FontSchemes);

  return (
    <>
      {/* ── Circular trigger ── */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={[s.trigger, { backgroundColor: C.surface, borderColor: C.accent }]}
      >
        <View style={s.triggerDots}>
          {['#FF2D2D','#00FF6A','#0057FF','#DDFF00'].map((col, i) => (
            <View key={i} style={[s.triggerDot, { backgroundColor: col }]} />
          ))}
        </View>
      </TouchableOpacity>

      {/* ── Bottom sheet ── */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[s.panel, { backgroundColor: C.card, borderColor: C.border, borderTopColor: C.accent }]}
            onPress={e => e.stopPropagation()}
          >

            {/* Handle bar */}
            <View style={[s.handle, { backgroundColor: C.border }]} />

            {/* Tab switcher */}
            <View style={[s.tabs, { borderColor: C.border }]}>
              {['COLOR', 'FONT'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  style={[
                    s.tabBtn,
                    { borderColor: C.border },
                    tab === t && { backgroundColor: C.accent },
                  ]}
                >
                  <Text style={[
                    s.tabText,
                    { color: tab === t ? C.btnText : C.textSub },
                    { fontFamily: F.heading },
                  ]}>
                    {t === 'COLOR' ? '🎨  COLORS' : '✏️  FONTS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Active label */}
            <View style={s.activeRow}>
              <Text style={[s.activeLabel, { color: C.textSub, fontFamily: F.body }]}>
                {tab === 'COLOR' ? 'COLORWAY' : 'FONT'}
              </Text>
              <Text style={[s.activeValue, { color: C.accent, fontFamily: F.heading }]}>
                {tab === 'COLOR' ? schemeId : fontId}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
                <Text style={[s.closeX, { color: C.textSub, fontFamily: F.heading }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── COLOR TAB ── */}
            {tab === 'COLOR' && (
              <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 280 }}
              >
                <View style={s.colorGrid}>
                  {colorList.map(cs => {
                    const selected = schemeId === cs.id;
                    return (
                      <TouchableOpacity
                        key={cs.id}
                        onPress={() => { setSchemeId(cs.id); setOpen(false); }}
                        activeOpacity={0.75}
                        style={[
                          s.colorSwatch,
                          { backgroundColor: cs.bg, borderColor: selected ? cs.accent : cs.border },
                          selected && { borderWidth: 2.5 },
                        ]}
                      >
                        <View style={[s.swatchDot, { backgroundColor: cs.accent }]} />
                        <Text style={[s.swatchLabel, { color: cs.textSub, fontFamily: F.body }]} numberOfLines={1}>
                          {cs.label}
                        </Text>
                        {selected && (
                          <View style={[s.checkBadge, { backgroundColor: cs.accent }]}>
                            <Text style={[s.checkText, { color: cs.btnText }]}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* ── FONT TAB ── */}
            {tab === 'FONT' && (
              <View style={s.fontList}>
                {fontList.map(fs => {
                  const selected = fontId === fs.id;
                  return (
                    <TouchableOpacity
                      key={fs.id}
                      onPress={() => { setFontId(fs.id); setOpen(false); }}
                      activeOpacity={0.8}
                      style={[
                        s.fontRow,
                        { borderColor: selected ? C.accent : C.border, backgroundColor: C.surface },
                        selected && { borderLeftWidth: 3, borderLeftColor: C.accent },
                      ]}
                    >
                      {/* Preview text in that font */}
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fontPreview, { color: C.text, fontFamily: fs.display }]}>
                          Aa
                        </Text>
                        <Text style={[s.fontName, { color: C.textSub, fontFamily: fs.body }]}>
                          {fs.label}  ·  {fs.desc}
                        </Text>
                      </View>
                      {selected && (
                        <View style={[s.fontCheck, { backgroundColor: C.accent }]}>
                          <Text style={{ color: C.btnText, fontSize: 11, fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  // Trigger
  trigger: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  triggerDots: { flexDirection: 'row', flexWrap: 'wrap', width: 18, height: 18, gap: 3 },
  triggerDot:  { width: 7, height: 7 },

  // Overlay + panel
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  panel: {
    borderWidth: 1.5, borderTopWidth: 3,
    padding: 20, paddingBottom: 40,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // Tabs
  tabs:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  tabText: { fontSize: 12, letterSpacing: 1 },

  // Active row
  activeRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  activeLabel:{ flex: 1, fontSize: 10, letterSpacing: 2 },
  activeValue:{ fontSize: 14, letterSpacing: 1 },
  closeX:     { fontSize: 14, paddingLeft: 8 },

  // Color grid
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: {
    width: 58, height: 58, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', gap: 4,
  },
  swatchDot:   { width: 18, height: 18 },
  swatchLabel: { fontSize: 8, letterSpacing: 0.5 },
  checkBadge: {
    position: 'absolute', top: 3, right: 3,
    width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 9, fontWeight: '900' },

  // Font list
  fontList: { gap: 8 },
  fontRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, padding: 12, gap: 12,
  },
  fontPreview: { fontSize: 28, lineHeight: 34 },
  fontName:    { fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  fontCheck: {
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
});
