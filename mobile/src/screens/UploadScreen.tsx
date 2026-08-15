import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import { MainStackParamList, RootNavigationParamList } from '../navigation/types';
import { uploadDocument, PickedFile } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<MainStackParamList, 'Upload'>;

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
];

export default function UploadScreen({ navigation }: Props) {
  const nav = navigation as unknown as NavigationProp<RootNavigationParamList>;
  const queryClient = useQueryClient();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [language, setLanguage] = useState('en');

  const mutation = useMutation({
    mutationFn: (file: PickedFile) => uploadDocument(file, language),
    onMutate: () => {
      setError(null);
      setStatusText('Extracting text and analyzing with Clauzera. This can take up to a minute...');
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigation.replace('Report', { documentId: report.id });
    },
    onError: (e) => {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        Alert.alert('Free plan limit reached', extractErrorMessage(e), [
          {
            text: 'OK',
            onPress: () => nav.navigate('Tabs', { screen: 'Subscription' } as never),
          },
        ]);
        return;
      }
      setError(extractErrorMessage(e));
    },
    onSettled: () => setStatusText(''),
  });

  const pickAndUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file: PickedFile = {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/pdf',
    };
    mutation.mutate(file);
  };

  const pickAndUploadImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to scan a document.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file: PickedFile = {
      uri: asset.uri,
      name: asset.fileName || 'scan.jpg',
      mimeType: asset.mimeType || 'image/jpeg',
    };
    mutation.mutate(file);
  };

  if (mutation.isPending) {
    return (
      <View style={styles.loadingPage}>
        <View style={styles.loadingIconWrap}>
          <ActivityIndicator animating size="large" color={t.accent} />
        </View>
        <Text style={styles.loadingTitle}>Analyzing your document</Text>
        <Text style={styles.loadingSubtitle}>{statusText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroIconWrap}>
        <MaterialCommunityIcons name="file-search-outline" size={36} color={t.accent} />
      </View>
      <Text style={styles.title}>Upload a Document</Text>
      <Text style={styles.subtitle}>
        We'll explain it in plain language and flag anything risky before you sign.
      </Text>

      <Text style={styles.languageLabel}>Explain the analysis in:</Text>
      <View style={styles.languageRow}>
        {LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.languageChip, active && styles.languageChipActive]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={[styles.optionCard, t.cardShadow]} onPress={pickAndUploadFile}>
        <View style={[styles.optionIcon, { backgroundColor: t.headerBg }]}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>Choose PDF / DOCX</Text>
          <Text style={styles.optionSub}>From your files</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={t.textMuted} />
      </Pressable>

      <Pressable style={[styles.optionCard, t.cardShadow]} onPress={pickAndUploadImage}>
        <View style={[styles.optionIcon, { backgroundColor: '#FFF7E0' }]}>
          <MaterialCommunityIcons name="camera-outline" size={24} color={t.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>Scan with Camera</Text>
          <Text style={styles.optionSub}>JPG / PNG · Read instantly by Clauzera</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={t.textMuted} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: t.bg },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: t.headerBg,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    title: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 6 },
    subtitle: { textAlign: 'center', color: t.textMuted, marginBottom: 20, paddingHorizontal: 8 },
    languageLabel: { color: t.text, fontWeight: '700', fontSize: 12.5, marginBottom: 10 },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 22,
    },
    languageChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
    },
    languageChipActive: { backgroundColor: t.headerBg, borderColor: t.headerBg },
    languageChipText: { fontSize: 12.5, fontWeight: '600', color: t.text },
    languageChipTextActive: { color: t.accent },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      gap: 14,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionTitle: { fontWeight: '700', color: t.text, fontSize: 15 },
    optionSub: { color: t.textMuted, fontSize: 12, marginTop: 2 },
    errorText: { color: '#DC2626', marginTop: 16, textAlign: 'center' },
    loadingPage: {
      flex: 1,
      backgroundColor: t.headerBg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(212,175,55,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    loadingTitle: { color: t.textOnHeader, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    loadingSubtitle: { color: t.textMutedOnHeader, textAlign: 'center' },
  });
