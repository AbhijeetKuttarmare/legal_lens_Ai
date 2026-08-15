import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { ACCENT_SWATCHES, DEFAULT_THEME_PREFS, useAppTheme, useThemePrefs, AppTheme } from '../theme/ThemeContext';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

function Swatch({ color, active, onPress }: { color: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.swatch,
        { backgroundColor: color },
        active && styles.swatchActive,
      ]}
    />
  );
}

export default function ThemeSettingsScreen({ navigation }: Props) {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { prefs, setPrefs } = useThemePrefs();

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Pressable hitSlop={10} style={s.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.textOnHeader} />
        </Pressable>
        <Text style={s.headerTitle}>Appearance</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.sectionTitle}>Theme</Text>
          <View style={s.toggleRow}>
            <Pressable
              style={[s.toggleBtn, prefs.mode === 'light' && s.toggleBtnActive]}
              onPress={() => setPrefs({ ...prefs, mode: 'light' })}
            >
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={16}
                color={prefs.mode === 'light' ? t.text : t.textMuted}
              />
              <Text style={[s.toggleText, prefs.mode === 'light' && s.toggleTextActive]}>Light</Text>
            </Pressable>
            <Pressable
              style={[s.toggleBtn, prefs.mode === 'dark' && s.toggleBtnActive]}
              onPress={() => setPrefs({ ...prefs, mode: 'dark' })}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={16}
                color={prefs.mode === 'dark' ? t.text : t.textMuted}
              />
              <Text style={[s.toggleText, prefs.mode === 'dark' && s.toggleTextActive]}>Dark</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Theme Color</Text>
          <Text style={s.sectionSub}>Used for highlights, badges, and accents throughout the app.</Text>
          <View style={s.swatchRow}>
            {ACCENT_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                active={prefs.accent === color}
                onPress={() => setPrefs({ ...prefs, accent: color })}
              />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Button Color</Text>
          <Text style={s.sectionSub}>Used for primary action buttons like Send and Analyze.</Text>
          <View style={s.swatchRow}>
            {ACCENT_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                active={prefs.buttonColor === color}
                onPress={() => setPrefs({ ...prefs, buttonColor: color })}
              />
            ))}
          </View>
        </View>

        <Pressable style={s.resetButton} onPress={() => setPrefs(DEFAULT_THEME_PREFS)}>
          <Text style={s.resetButtonText}>Reset to default</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: 'rgba(255,255,255,0.9)',
  },
});

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.headerBg,
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { color: t.textOnHeader, fontSize: 17, fontWeight: '700' },
    body: { padding: 20, paddingBottom: 40 },
    card: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    sectionTitle: { fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 4 },
    sectionSub: { fontSize: 12, color: t.textMuted, marginBottom: 14 },
    toggleRow: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: t.surfaceAlt,
      borderRadius: 10,
      padding: 4,
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    toggleBtnActive: { backgroundColor: t.surface },
    toggleText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
    toggleTextActive: { color: t.text },
    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    resetButton: {
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
    },
    resetButtonText: { color: t.textMuted, fontWeight: '600', fontSize: 13 },
  });
