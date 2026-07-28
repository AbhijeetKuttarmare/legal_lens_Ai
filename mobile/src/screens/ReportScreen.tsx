import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { MainStackParamList, RootNavigationParamList } from '../navigation/types';
import { getDocumentReport } from '../api/documents';
import { riskColor, NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';
import { useAppSelector } from '../store/hooks';
import { buildReportHtml } from '../utils/reportHtml';

type Props = NativeStackScreenProps<MainStackParamList, 'Report'>;

const severityIcon = { high: 'alert-circle', medium: 'alert', low: 'information' } as const;

export default function ReportScreen({ route, navigation }: Props) {
  const { documentId } = route.params;
  const nav = navigation as unknown as NavigationProp<RootNavigationParamList>;
  const user = useAppSelector((s) => s.auth.user);
  const isPremium = user?.plan === 'ENTERPRISE';
  const [exporting, setExporting] = useState(false);
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentReport(documentId),
    refetchInterval: (query) =>
      query.state.data?.status === 'PROCESSING' ? 2000 : false,
  });

  const onExport = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium feature',
        'Exporting and downloading reports is available on the Premium plan.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => nav.navigate('Tabs', { screen: 'Subscription' } as never),
          },
        ],
      );
      return;
    }
    if (!report) return;
    setExporting(true);
    try {
      const html = buildReportHtml(report);
      const { uri } = await Print.printToFileAsync({ html });
      const destUri = `${FileSystem.documentDirectory}LegalLensAI-Report-${documentId}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: destUri });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Report',
        });
      } else {
        Alert.alert('Export ready', `PDF saved to ${destUri}`);
      }
    } catch {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.center}>
        <Text>Could not load this document.</Text>
      </View>
    );
  }

  if (report.status === 'PROCESSING') {
    return (
      <View style={styles.centerDark}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.processingText}>Still analyzing this document...</Text>
      </View>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#DC2626" />
        <Text style={{ color: '#DC2626', textAlign: 'center', marginTop: 12 }}>
          Analysis failed for this document. Check that ANTHROPIC_API_KEY is set on the backend.
        </Text>
      </View>
    );
  }

  const risk = report.riskAnalysis;

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.docTypeLabel}>Document Type</Text>
        <Text style={styles.docTypeValue}>
          {report.documentType?.replace(/_/g, ' ') || 'Document'}
        </Text>
        {risk && (
          <View style={styles.scoreRow}>
            <View style={[styles.scoreRing, { borderColor: riskColor(risk.level) }]}>
              <Text style={[styles.scoreNumber, { color: riskColor(risk.level) }]}>
                {risk.score}
              </Text>
            </View>
            <View>
              <Text style={styles.scoreLevel}>{risk.level} RISK</Text>
              <Text style={styles.scoreSub}>out of 100</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="text-box-outline" size={18} color={NAVY} />
            <Text style={styles.cardTitle}>Summary</Text>
          </View>
          <Text style={styles.summaryText}>{report.summary?.summaryText}</Text>
        </View>

        {!!risk?.flags?.length && (
          <View style={[styles.card, cardShadow]}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="shield-alert-outline" size={18} color={NAVY} />
              <Text style={styles.cardTitle}>Risk Flags</Text>
            </View>
            {risk.flags.map((flag, idx) => (
              <View key={idx} style={styles.flagRow}>
                <MaterialCommunityIcons
                  name={severityIcon[flag.severity]}
                  size={18}
                  color={riskColor(
                    flag.severity === 'high' ? 'HIGH' : flag.severity === 'medium' ? 'MEDIUM' : 'LOW',
                  )}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.flagTitle}>{flag.title}</Text>
                  <Text style={styles.flagDetail}>{flag.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!report.clauseAnalysis?.clauses?.length && (
          <>
            <Text style={styles.sectionTitle}>Clause Cards</Text>
            <View style={styles.clauseGrid}>
              {report.clauseAnalysis.clauses.map((clause, idx) => (
                <View key={idx} style={[styles.clauseCard, cardShadow]}>
                  <Text style={styles.clauseLabel}>{clause.label}</Text>
                  <Text style={styles.clauseValue}>{clause.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!!risk?.suggestions?.length && (
          <View style={[styles.card, cardShadow]}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={NAVY} />
              <Text style={styles.cardTitle}>Before Signing, Ask</Text>
            </View>
            {risk.suggestions.map((s, idx) => (
              <View key={idx} style={styles.suggestionRow}>
                <View style={styles.suggestionBullet}>
                  <Text style={styles.suggestionBulletText}>{idx + 1}</Text>
                </View>
                <Text style={styles.suggestionText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.chatButton, cardShadow]}
          onPress={() =>
            navigation.navigate('Chat', {
              documentId,
              fileName: report.fileName,
              language: report.language,
            })
          }
        >
          <MaterialCommunityIcons name="chat-processing-outline" size={20} color={NAVY} />
          <Text style={styles.chatButtonText}>Ask AI About This Document</Text>
        </Pressable>

        <Pressable
          style={[styles.exportButton, cardShadow]}
          onPress={onExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={NAVY} />
          ) : (
            <MaterialCommunityIcons
              name={isPremium ? 'download-outline' : 'lock-outline'}
              size={20}
              color={NAVY}
            />
          )}
          <Text style={styles.exportButtonText}>
            {isPremium ? 'Export / Download Report' : 'Export Report (Premium)'}
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          This is an informational explanation, not professional legal advice. Consult a
          qualified lawyer for important decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centerDark: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: NAVY,
  },
  processingText: { color: 'white', marginTop: 16 },
  header: {
    backgroundColor: NAVY,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  docTypeLabel: { color: '#B7C0D1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  docTypeValue: { color: 'white', fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 18, fontWeight: '800' },
  scoreLevel: { color: 'white', fontWeight: '700', letterSpacing: 0.5 },
  scoreSub: { color: '#B7C0D1', fontSize: 12, marginTop: 2 },
  body: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontWeight: '700', color: NAVY, fontSize: 15 },
  summaryText: { color: '#374151', lineHeight: 21 },
  flagRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  flagTitle: { fontWeight: '700', color: NAVY, fontSize: 13.5 },
  flagDetail: { color: TEXT_MUTED, fontSize: 12.5, marginTop: 2 },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: NAVY, marginBottom: 10 },
  clauseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  clauseCard: { width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 14 },
  clauseLabel: { color: TEXT_MUTED, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.3 },
  clauseValue: { color: NAVY, fontWeight: '700', fontSize: 15, marginTop: 4 },
  suggestionRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  suggestionBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  suggestionBulletText: { color: NAVY, fontSize: 11, fontWeight: '800' },
  suggestionText: { flex: 1, color: '#374151' },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  chatButtonText: { color: NAVY, fontWeight: '700', fontSize: 15 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButtonText: { color: NAVY, fontWeight: '700', fontSize: 15 },
  disclaimer: { color: '#9CA3AF', fontSize: 11.5, marginTop: 18, textAlign: 'center' },
});
