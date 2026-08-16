import React, { useMemo, useState } from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OCCUPATION_CATEGORIES } from '../config/occupations';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';

interface Props {
  value: string;
  onChange: (occupation: string) => void;
  // Forces the trigger button to fixed light colors instead of following
  // the theme — for screens with permanently-light chrome (e.g. the signup
  // card in CompleteProfileScreen, which stays white in dark mode too).
  light?: boolean;
}

// Two-step picker (category, then occupation within it) instead of one long
// scrolling list of 30+ options — see config/occupations.ts for the grouping.
// React Native has no native <select>, so this is a custom bottom-sheet modal.
export default function OccupationPicker({ value, onChange, light }: Props) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'category' | 'occupation'>('category');
  const [category, setCategory] = useState<string | null>(null);

  function open() {
    setStep('category');
    setCategory(OCCUPATION_CATEGORIES.find((c) => c.occupations.includes(value))?.category || null);
    setVisible(true);
  }

  function selectCategory(cat: string) {
    setCategory(cat);
    setStep('occupation');
  }

  function selectOccupation(occ: string) {
    onChange(occ);
    setVisible(false);
  }

  const occupationsInCategory = OCCUPATION_CATEGORIES.find((c) => c.category === category)?.occupations || [];

  return (
    <>
      <Pressable style={[styles.trigger, light && styles.triggerLight]} onPress={open}>
        <Text style={value ? [styles.triggerText, light && styles.triggerTextLight] : [styles.placeholder, light && styles.placeholderLight]}>
          {value || 'Select occupation (optional)'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={light ? '#6B7280' : t.textMuted} />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            {step === 'occupation' ? (
              <Pressable onPress={() => setStep('category')} hitSlop={8}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={t.text} />
              </Pressable>
            ) : (
              <View style={{ width: 22 }} />
            )}
            <Text style={styles.sheetTitle}>{step === 'category' ? 'Select field' : category}</Text>
            <Pressable onPress={() => setVisible(false)} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={t.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetBody} contentContainerStyle={{ paddingBottom: 24 }}>
            {step === 'category'
              ? OCCUPATION_CATEGORIES.map((c) => (
                  <Pressable key={c.category} style={styles.row} onPress={() => selectCategory(c.category)}>
                    <Text style={styles.rowText}>{c.category}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={t.textMuted} />
                  </Pressable>
                ))
              : occupationsInCategory.map((o) => (
                  <Pressable key={o} style={styles.row} onPress={() => selectOccupation(o)}>
                    <Text style={styles.rowText}>{o}</Text>
                    {value === o && <MaterialCommunityIcons name="check" size={18} color={t.accent} />}
                  </Pressable>
                ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.surface,
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 16,
    },
    triggerText: { fontSize: 14.5, color: t.text },
    placeholder: { fontSize: 14.5, color: t.textMuted },
    triggerLight: { backgroundColor: 'white', borderColor: '#E5E7EB' },
    triggerTextLight: { color: '#0B1220' },
    placeholderLight: { color: '#6B7280' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
      backgroundColor: t.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      paddingBottom: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    sheetTitle: { fontWeight: '700', fontSize: 15, color: t.text },
    sheetBody: { paddingHorizontal: 18 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    rowText: { fontSize: 14, color: t.text, flex: 1, paddingRight: 8 },
  });
