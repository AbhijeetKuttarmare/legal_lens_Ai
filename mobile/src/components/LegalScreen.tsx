import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';

export interface LegalSection {
  heading: string;
  body: string;
}

interface Props {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
}

export default function LegalScreen({ title, updatedLabel, sections }: Props) {
  const navigation = useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable hitSlop={10} style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.textOnHeader} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.updated}>{updatedLabel}</Text>
        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.text}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

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
    headerTitle: { color: t.textOnHeader, fontSize: 18, fontWeight: '700' },
    body: { padding: 20, paddingBottom: 40 },
    updated: { color: t.textMuted, fontSize: 12, marginBottom: 16 },
    section: { marginBottom: 20 },
    heading: { fontWeight: '700', color: t.text, fontSize: 15, marginBottom: 6 },
    text: { color: t.bodyText, fontSize: 13.5, lineHeight: 20 },
  });
