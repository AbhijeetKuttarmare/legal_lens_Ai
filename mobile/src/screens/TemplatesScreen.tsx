import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ActivityIndicator, Text, TextInput, Button, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { listTemplateTypes, generateTemplate } from '../api/templates';
import {
  listPersonalTemplates,
  uploadPersonalTemplate,
  generateFromPersonalTemplate,
  deletePersonalTemplate,
} from '../api/personalTemplates';
import { PickedFile } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { TemplateTypeOption, PersonalTemplateSummary } from '../api/types';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import UpgradeGate from '../components/UpgradeGate';
import KeyboardAwareForm from '../components/KeyboardAwareForm';

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

async function exportContentAsPdf(title: string, fileSlug: string, content: string) {
  const html = `<html><head><meta charset="utf-8" /></head><body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:32px;color:#111827;white-space:pre-wrap;line-height:1.6;font-size:13px;"><h2 style="color:#0B1220;">${escapeHtml(
    title,
  )}</h2>${escapeHtml(content)}</body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  const destUri = `${FileSystem.documentDirectory}ClauzeraAI-${fileSlug}.pdf`;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: 'Download Document' });
  } else {
    Alert.alert('Ready', `PDF saved to ${destUri}`);
  }
}

export default function TemplatesScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const isPaid = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [mode, setMode] = useState<'ai' | 'personal'>('ai');

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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, mode === 'ai' && styles.tabActive]} onPress={() => setMode('ai')}>
          <Text style={[styles.tabText, mode === 'ai' && styles.tabTextActive]}>AI Templates</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'personal' && styles.tabActive]} onPress={() => setMode('personal')}>
          <Text style={[styles.tabText, mode === 'personal' && styles.tabTextActive]}>My Templates</Text>
        </Pressable>
      </View>
      {mode === 'ai' ? <AiTemplatesTab /> : <PersonalTemplatesTab />}
    </View>
  );
}

function AiTemplatesTab() {
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
    listTemplateTypes()
      .then(setTypes)
      .catch((e) => setError(extractErrorMessage(e)));
  }, []);

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
      await exportContentAsPdf(label, selectedType, content);
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
        <ActivityIndicator size="large" color={t.text} />
      </View>
    );
  }

  return (
    <KeyboardAwareForm style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
    </KeyboardAwareForm>
  );
}

type PersonalMode = 'list' | 'fill' | 'result';

function PersonalTemplatesTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [mode, setMode] = useState<PersonalMode>('list');
  const [templates, setTemplates] = useState<PersonalTemplateSummary[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState<PersonalTemplateSummary | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = () => {
    listPersonalTemplates()
      .then(setTemplates)
      .catch((e) => setError(extractErrorMessage(e)));
  };

  useEffect(loadList, []);

  const openFillMode = (template: PersonalTemplateSummary) => {
    setActive(template);
    const initial: Record<string, string> = {};
    for (const f of template.fields) initial[f.key] = f.originalValue;
    setFieldValues(initial);
    setContent(null);
    setError(null);
    setMode('fill');
  };

  const uploadFile = async (file: PickedFile) => {
    setUploading(true);
    setError(null);
    try {
      const saved = await uploadPersonalTemplate(file);
      setTemplates((prev) => [saved, ...(prev || [])]);
      openFillMode(saved);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

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
    await uploadFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/pdf' });
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to scan a document.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await uploadFile({ uri: asset.uri, name: asset.fileName || 'scan.jpg', mimeType: asset.mimeType || 'image/jpeg' });
  };

  const onGenerate = async () => {
    if (!active) return;
    setError(null);
    setLoading(true);
    try {
      const res = await generateFromPersonalTemplate(active.id, fieldValues);
      setContent(res.content);
      setMode('result');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    if (!content || !active) return;
    setExporting(true);
    try {
      await exportContentAsPdf(active.name, active.name.replace(/\s+/g, '-'), content);
    } catch (e) {
      Alert.alert('Export failed', extractErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete template?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePersonalTemplate(id);
            setTemplates((prev) => (prev || []).filter((tpl) => tpl.id !== id));
          } catch (e) {
            Alert.alert('Could not delete', extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (mode === 'fill' && active) {
    return (
      <KeyboardAwareForm style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => setMode('list')}>
          <Text style={styles.backLink}>← Back to My Templates</Text>
        </Pressable>
        <View style={[styles.formCard, t.cardShadow]}>
          <Text style={styles.formTitle}>{active.name}</Text>
          <Text style={styles.subtitle}>
            Update the details below for this new case, then generate. Anything you leave unchanged stays as it was.
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {active.fields.length === 0 && (
            <Text style={styles.subtitle}>No case-specific fields were detected — generating will return it unchanged.</Text>
          )}
          {active.fields.map((f) => (
            <TextInput
              key={f.key}
              mode="outlined"
              label={f.label}
              style={styles.input}
              activeOutlineColor={t.text}
              value={fieldValues[f.key] ?? ''}
              onChangeText={(v) => setFieldValues((prev) => ({ ...prev, [f.key]: v }))}
            />
          ))}
          <Button
            mode="contained"
            buttonColor={t.buttonColor}
            textColor={t.onAccent}
            style={styles.generateButton}
            onPress={onGenerate}
            loading={loading}
            disabled={loading}
          >
            Generate Document
          </Button>
        </View>
      </KeyboardAwareForm>
    );
  }

  if (mode === 'result' && content && active) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
          <Button mode="outlined" textColor={t.text} style={{ marginTop: 10, borderRadius: 10 }} onPress={() => openFillMode(active)}>
            Edit Details
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.subtitle}>
        Save a document you've used before (like your standard NDA or client agreement) as a personal template. Next
        time, just swap in the new names, dates, and amounts instead of starting from scratch.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={[styles.uploadRow, t.cardShadow]}>
        <View style={styles.typeIcon}>
          <MaterialCommunityIcons name="upload-outline" size={22} color={t.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Pressable onPress={pickAndUploadFile} disabled={uploading}>
            <Text style={styles.typeTitle}>{uploading ? 'Analyzing document…' : 'Upload PDF / DOCX'}</Text>
          </Pressable>
          <Pressable onPress={pickAndUploadPhoto} disabled={uploading}>
            <Text style={[styles.backLink, { marginTop: 6, marginBottom: 0 }]}>Or scan with camera</Text>
          </Pressable>
        </View>
        {uploading && <ActivityIndicator size="small" color={t.text} />}
      </View>

      {templates === null && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.text} />
        </View>
      )}

      {templates !== null && templates.length === 0 && (
        <Text style={[styles.subtitle, { marginTop: 16 }]}>No personal templates yet — upload one above to get started.</Text>
      )}

      {templates !== null && templates.length > 0 && (
        <View style={{ marginTop: 16, gap: 10 }}>
          {templates.map((tpl) => (
            <View key={tpl.id} style={[styles.templateRow, t.cardShadow]}>
              <View style={styles.typeIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={t.text} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.typeTitle}>{tpl.name}</Text>
                <Text style={styles.typeSub}>{tpl.fields.length} fields detected</Text>
              </View>
              <Pressable style={styles.useButton} onPress={() => openFillMode(tpl)}>
                <Text style={styles.useButtonText}>Use</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => onDelete(tpl.id)}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    tabActive: { backgroundColor: t.surfaceAlt },
    tabText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
    tabTextActive: { color: t.text },
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
    formTitle: { fontWeight: '700', color: t.text, fontSize: 16, marginBottom: 4 },
    backLink: { color: t.text, fontWeight: '600', fontSize: 12.5, marginBottom: 14 },
    input: { marginBottom: 12, backgroundColor: t.surface },
    consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
    consentText: { flex: 1, color: t.textMuted, fontSize: 12, lineHeight: 17, marginTop: 10 },
    generateButton: { marginTop: 6, borderRadius: 10 },
    contentText: { color: t.bodyText, fontSize: 13, lineHeight: 20, marginBottom: 18 },
    uploadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: t.border,
      borderStyle: 'dashed',
    },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 14,
    },
    useButton: { backgroundColor: t.buttonColor, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    useButtonText: { color: t.onAccent, fontWeight: '700', fontSize: 12.5 },
  });
