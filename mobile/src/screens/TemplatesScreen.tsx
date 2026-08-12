import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ActivityIndicator, Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { listTemplateTypes, generateTemplate } from '../api/templates';
import { extractErrorMessage } from '../api/client';
import { TemplateTypeOption } from '../api/types';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';

const FIELD_SETS: Record<string, string[]> = {
  RENTAL_AGREEMENT: [
    'Landlord Name',
    'Tenant Name',
    'Property Address',
    'Monthly Rent',
    'Security Deposit',
    'Lease Start Date',
    'Lease Duration',
  ],
  NDA: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration'],
  FREELANCE_CONTRACT: ['Client Name', 'Freelancer Name', 'Scope of Work', 'Payment Amount', 'Payment Terms', 'Start Date'],
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function TemplatesScreen() {
  const [types, setTypes] = useState<TemplateTypeOption[] | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    listTemplateTypes()
      .then(setTypes)
      .catch((e) => setError(extractErrorMessage(e)));
  }, []);

  const selectType = (key: string) => {
    setSelectedType(key);
    setFields({});
    setContent(null);
    setError(null);
  };

  const onGenerate = async () => {
    if (!selectedType) return;
    setError(null);
    setContent(null);
    setLoading(true);
    try {
      const res = await generateTemplate(selectedType, fields);
      setContent(res.content);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    if (!content) return;
    const label = types?.find((t) => t.key === selectedType)?.label || 'Document';
    setExporting(true);
    try {
      const html = `<html><head><meta charset="utf-8" /></head><body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:32px;color:#111827;white-space:pre-wrap;line-height:1.6;font-size:13px;"><h2 style="color:#0B1220;">${escapeHtml(
        label,
      )}</h2>${escapeHtml(content)}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      const destUri = `${FileSystem.documentDirectory}LegalLensAI-${selectedType}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: destUri });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: 'Download Template' });
      } else {
        Alert.alert('Ready', `PDF saved to ${destUri}`);
      }
    } catch (e) {
      Alert.alert('Export failed', extractErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const activeFields = selectedType ? FIELD_SETS[selectedType] || [] : [];

  if (types === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.subtitle}>
        Generate a draft document from a template. This is a starting point, not a final legal document.
      </Text>

      <View style={styles.warningBanner}>
        <MaterialCommunityIcons name="alert-outline" size={18} color="#92400E" />
        <Text style={styles.warningText}>
          <Text style={{ fontWeight: '700' }}>Draft only — not legal advice. </Text>
          Every generated document must be reviewed by a qualified lawyer before you sign or use it.
        </Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!selectedType && (
        <View style={styles.typeGrid}>
          {types.map((t) => (
            <Pressable key={t.key} style={[styles.typeCard, cardShadow]} onPress={() => selectType(t.key)}>
              <View style={styles.typeIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={NAVY} />
              </View>
              <Text style={styles.typeTitle}>{t.label}</Text>
              <Text style={styles.typeSub}>Generate a draft</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selectedType && !content && (
        <View style={[styles.formCard, cardShadow]}>
          <Pressable onPress={() => selectType('')}>
            <Text style={styles.backLink}>← Choose a different template</Text>
          </Pressable>
          {activeFields.map((label) => (
            <TextInput
              key={label}
              mode="outlined"
              label={label}
              style={styles.input}
              activeOutlineColor={NAVY}
              value={fields[label] || ''}
              onChangeText={(v) => setFields((f) => ({ ...f, [label]: v }))}
            />
          ))}
          <Button
            mode="contained"
            buttonColor={GOLD}
            textColor={NAVY}
            style={styles.generateButton}
            onPress={onGenerate}
            loading={loading}
            disabled={loading}
          >
            Generate Draft
          </Button>
        </View>
      )}

      {content && (
        <View style={[styles.formCard, cardShadow]}>
          <Text style={styles.contentText}>{content}</Text>
          <Button
            mode="contained"
            buttonColor={GOLD}
            textColor={NAVY}
            style={styles.generateButton}
            onPress={onDownload}
            loading={exporting}
            disabled={exporting}
          >
            Download as PDF
          </Button>
          <Button mode="outlined" textColor={NAVY} style={{ marginTop: 10, borderRadius: 10 }} onPress={() => setContent(null)}>
            Edit Details
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F5F9' },
  subtitle: { color: TEXT_MUTED, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  warningBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  warningText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17 },
  errorText: { color: '#DC2626', marginBottom: 14, fontSize: 12.5 },
  typeGrid: { gap: 12 },
  typeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeTitle: { fontWeight: '700', color: NAVY, fontSize: 14.5 },
  typeSub: { color: TEXT_MUTED, fontSize: 12, marginTop: 3 },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 18 },
  backLink: { color: NAVY, fontWeight: '600', fontSize: 12.5, marginBottom: 14 },
  input: { marginBottom: 12, backgroundColor: 'white' },
  generateButton: { marginTop: 6, borderRadius: 10 },
  contentText: { color: '#1F2937', fontSize: 13, lineHeight: 20, marginBottom: 18 },
});
