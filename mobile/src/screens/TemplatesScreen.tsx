import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ActivityIndicator, Text, TextInput, Button, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { listTemplateTypes, generateTemplate } from '../api/templates';
import { extractErrorMessage } from '../api/client';
import { TemplateTypeOption } from '../api/types';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import UpgradeGate from '../components/UpgradeGate';

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
  RENTAL_AGREEMENT_US: [
    'Landlord Name',
    'Tenant Name',
    'Property Address',
    'Monthly Rent',
    'Security Deposit',
    'Lease Start Date',
    'Lease Duration',
    'State',
  ],
  RENTAL_AGREEMENT_UK: [
    'Landlord Name',
    'Tenant Name',
    'Property Address',
    'Monthly Rent',
    'Deposit Amount',
    'Tenancy Start Date',
    'Tenancy Duration',
  ],
  NDA: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration'],
  NDA_US: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration', 'Governing State'],
  FREELANCE_CONTRACT: ['Client Name', 'Freelancer Name', 'Scope of Work', 'Payment Amount', 'Payment Terms', 'Start Date'],
  FREELANCE_CONTRACT_US: [
    'Client Name',
    'Contractor Name',
    'Scope of Work',
    'Payment Amount',
    'Payment Terms',
    'Start Date',
    'Governing State',
  ],
  EMPLOYMENT_OFFER_LETTER: [
    'Company Name',
    'Candidate Name',
    'Job Title',
    'Annual CTC',
    'Joining Date',
    'Probation Period',
    'Reporting Manager',
  ],
  CONSULTING_AGREEMENT: ['Client Name', 'Consultant Name', 'Scope of Services', 'Fees', 'Payment Terms', 'Start Date', 'Term'],
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function TemplatesScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const isPaid = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [types, setTypes] = useState<TemplateTypeOption[] | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!isPaid) return;
    listTemplateTypes()
      .then(setTypes)
      .catch((e) => setError(extractErrorMessage(e)));
  }, [isPaid]);

  const selectType = (key: string) => {
    setSelectedType(key);
    setFields({});
    setContent(null);
    setError(null);
    setConsent(false);
  };

  const onGenerate = async () => {
    if (!selectedType || !consent) return;
    setError(null);
    setContent(null);
    setLoading(true);
    try {
      const res = await generateTemplate(selectedType, fields, consent);
      setContent(res.content);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    if (!content) return;
    const label = types?.find((t2) => t2.key === selectedType)?.label || 'Document';
    setExporting(true);
    try {
      const html = `<html><head><meta charset="utf-8" /></head><body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:32px;color:#111827;white-space:pre-wrap;line-height:1.6;font-size:13px;"><h2 style="color:#0B1220;">${escapeHtml(
        label,
      )}</h2>${escapeHtml(content)}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      const destUri = `${FileSystem.documentDirectory}ClauzeraAI-${selectedType}.pdf`;
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

  if (!isPaid) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.subtitle}>
          Generate a draft document from a template. This is a starting point, not a final legal document.
        </Text>
        <UpgradeGate feature="Document Templates" />
      </ScrollView>
    );
  }

  if (types === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.text} />
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
          Every generated document must be reviewed by a qualified lawyer before you sign or use it. Each template is
          drafted for the country shown in its name — laws vary by state/region within that country too, so confirm
          it fits your specific situation.
        </Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!selectedType && (
        <View style={styles.typeGrid}>
          {types.map((tt) => (
            <Pressable key={tt.key} style={[styles.typeCard, t.cardShadow]} onPress={() => selectType(tt.key)}>
              <View style={styles.typeIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={t.text} />
              </View>
              <Text style={styles.typeTitle}>{tt.label}</Text>
              <Text style={styles.typeSub}>Generate a draft</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selectedType && !content && (
        <View style={[styles.formCard, t.cardShadow]}>
          <Pressable onPress={() => selectType('')}>
            <Text style={styles.backLink}>← Choose a different template</Text>
          </Pressable>
          {activeFields.map((label) => (
            <TextInput
              key={label}
              mode="outlined"
              label={label}
              style={styles.input}
              activeOutlineColor={t.text}
              value={fields[label] || ''}
              onChangeText={(v) => setFields((f) => ({ ...f, [label]: v }))}
            />
          ))}
          <Pressable style={styles.consentRow} onPress={() => setConsent((c) => !c)}>
            <Checkbox status={consent ? 'checked' : 'unchecked'} color={t.text} onPress={() => setConsent((c) => !c)} />
            <Text style={styles.consentText}>
              I understand this is a Clauzera-generated draft, not legal advice, and I will have it reviewed by a
              qualified lawyer before signing or using it.
            </Text>
          </Pressable>
          <Button
            mode="contained"
            buttonColor={t.buttonColor}
            textColor={t.onAccent}
            style={styles.generateButton}
            onPress={onGenerate}
            loading={loading}
            disabled={loading || !consent}
          >
            Generate Draft
          </Button>
        </View>
      )}

      {content && (
        <View style={[styles.formCard, t.cardShadow]}>
          <Text style={styles.contentText}>{content}</Text>
          <Button
            mode="contained"
            buttonColor={t.buttonColor}
            textColor={t.onAccent}
            style={styles.generateButton}
            onPress={onDownload}
            loading={exporting}
            disabled={exporting}
          >
            Download as PDF
          </Button>
          <Button mode="outlined" textColor={t.text} style={{ marginTop: 10, borderRadius: 10 }} onPress={() => setContent(null)}>
            Edit Details
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    subtitle: { color: t.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
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
    typeCard: { backgroundColor: t.surface, borderRadius: 16, padding: 16 },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: t.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    typeTitle: { fontWeight: '700', color: t.text, fontSize: 14.5 },
    typeSub: { color: t.textMuted, fontSize: 12, marginTop: 3 },
    formCard: { backgroundColor: t.surface, borderRadius: 16, padding: 18 },
    backLink: { color: t.text, fontWeight: '600', fontSize: 12.5, marginBottom: 14 },
    input: { marginBottom: 12, backgroundColor: t.surface },
    consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
    consentText: { flex: 1, color: t.textMuted, fontSize: 12, lineHeight: 17, marginTop: 10 },
    generateButton: { marginTop: 6, borderRadius: 10 },
    contentText: { color: t.bodyText, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  });
