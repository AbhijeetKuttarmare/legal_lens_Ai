import React, { useMemo, useState } from 'react';
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
import { getDocumentReport, getKeyDates, suggestFix } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { KeyDate } from '../api/types';
import { riskColor, useAppTheme, AppTheme } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { buildReportHtml } from '../utils/reportHtml';
import Markdown from '../components/Markdown';

type Props = NativeStackScreenProps<MainStackParamList, 'Report'>;

const severityIcon = { high: 'alert-circle', medium: 'alert', low: 'information' } as const;

interface FixState {
  loading: boolean;
  text: string | null;
  error: string | null;
}

export default function ReportScreen({ route, navigation }: Props) {
  const { documentId } = route.params;
  const nav = navigation as unknown as NavigationProp<RootNavigationParamList>;
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const user = useAppSelector((s) => s.auth.user);
  const isPremium = user?.plan === 'ENTERPRISE';
  const [exporting, setExporting] = useState(false);
  const [keyDates, setKeyDates] = useState<KeyDate[] | null>(null);
  const [keyDatesLoading, setKeyDatesLoading] = useState(false);
  const [keyDatesError, setKeyDatesError] = useState<string | null>(null);
  const [expandedFix, setExpandedFix] = useState<Set<number>>(new Set());
  const [fixData, setFixData] = useState<Record<number, FixState>>({});
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
      const destUri = `${FileSystem.documentDirectory}ClauzeraAI-Report-${documentId}.pdf`;
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
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      Alert.alert('Export failed', `Could not generate the PDF. Please try again.\n\n${detail}`);
    } finally {
      setExporting(false);
    }
  };

  const onCheckDeadlines = async () => {
    setKeyDatesLoading(true);
    setKeyDatesError(null);
    try {
      const dates = await getKeyDates(documentId);
      setKeyDates(dates);
    } catch (e) {
      setKeyDatesError(extractErrorMessage(e));
    } finally {
      setKeyDatesLoading(false);
    }
  };

  const onToggleFix = async (idx: number, flagTitle: string, flagDetail: string) => {
    setExpandedFix((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    if (fixData[idx]?.text) return;
    setFixData((prev) => ({ ...prev, [idx]: { loading: true, text: null, error: null } }));
    try {
      const { suggestion } = await suggestFix(documentId, flagTitle, flagDetail);
      setFixData((prev) => ({ ...prev, [idx]: { loading: false, text: suggestion, error: null } }));
    } catch (e) {
      setFixData((prev) => ({
        ...prev,
        [idx]: { loading: false, text: null, error: extractErrorMessage(e) },
      }));
    }
  };

  const onDiscussFurther = (flagTitle: string, flagDetail: string) => {
    if (!report) return;
    navigation.navigate('Chat', {
      documentId,
      fileName: report.fileName,
      language: report.language,
      prefill: `How can I address or negotiate this risk: "${flagTitle}"? Context: ${flagDetail}`,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.text} />
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
        <ActivityIndicator size="large" color={t.accent} />
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
        <View style={[styles.card, t.cardShadow]}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="text-box-outline" size={18} color={t.text} />
            <Text style={styles.cardTitle}>Summary</Text>
          </View>
          <Text style={styles.summaryText}>{report.summary?.summaryText}</Text>
        </View>

        {!!risk?.flags?.length && (
          <View style={[styles.card, t.cardShadow]}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="shield-alert-outline" size={18} color={t.text} />
              <Text style={styles.cardTitle}>Risk Flags</Text>
            </View>
            {risk.flags.map((flag, idx) => {
              const isOpen = expandedFix.has(idx);
              const fix = fixData[idx];
              return (
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
                    <Pressable
                      hitSlop={6}
                      style={{ marginTop: 6, alignSelf: 'flex-start' }}
                      onPress={() => onToggleFix(idx, flag.title, flag.detail)}
                    >
                      <Text style={styles.fixToggleText}>
                        {isOpen ? 'Hide suggestion ↑' : 'Suggest a Fix →'}
                      </Text>
                    </Pressable>

                    {isOpen && (
                      <View style={styles.fixBox}>
                        {fix?.loading && <ActivityIndicator size="small" color={t.accent} />}
                        {fix?.error && (
                          <Text style={{ color: '#DC2626', fontSize: 12.5 }}>{fix.error}</Text>
                        )}
                        {fix?.text && (
                          <>
                            <Markdown text={fix.text} color={t.bodyText} boldColor={t.text} />
                            <Pressable
                              hitSlop={6}
                              style={{ marginTop: 4, alignSelf: 'flex-start' }}
                              onPress={() => onDiscussFurther(flag.title, flag.detail)}
                            >
                              <Text style={styles.fixDiscussText}>Discuss further →</Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!!report.clauseAnalysis?.clauses?.length && (
          <>
            <Text style={styles.sectionTitle}>Clause Cards</Text>
            <View style={styles.clauseGrid}>
              {report.clauseAnalysis.clauses.map((clause, idx) => (
                <View key={idx} style={[styles.clauseCard, t.cardShadow]}>
                  <Text style={styles.clauseLabel}>{clause.label}</Text>
                  <Text style={styles.clauseValue}>{clause.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!!risk?.suggestions?.length && (
          <View style={[styles.card, t.cardShadow]}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={t.text} />
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

        <View style={[styles.card, t.cardShadow]}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="calendar-alert-outline" size={18} color={t.text} />
            <Text style={styles.cardTitle}>Key Dates & Deadlines</Text>
          </View>
          {keyDatesError && <Text style={{ color: '#DC2626', fontSize: 12.5 }}>{keyDatesError}</Text>}
          {keyDates === null && (
            <Pressable
              style={styles.deadlinesButton}
              onPress={onCheckDeadlines}
              disabled={keyDatesLoading}
            >
              {keyDatesLoading ? (
                <ActivityIndicator size="small" color={t.text} />
              ) : (
                <Text style={styles.deadlinesButtonText}>Check for deadlines in this document</Text>
              )}
            </Pressable>
          )}
          {keyDates !== null && keyDates.length === 0 && (
            <Text style={{ color: t.textMuted, fontSize: 12.5 }}>
              No explicit dates or deadlines found in this document.
            </Text>
          )}
          {keyDates !== null &&
            keyDates.map((kd, idx) => (
              <View key={idx} style={styles.flagRow}>
                <MaterialCommunityIcons name="clock-alert-outline" size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.flagTitle}>{kd.label}</Text>
                  <Text style={styles.flagDetail}>{kd.detail}</Text>
                </View>
              </View>
            ))}
        </View>

        <Pressable
          style={[styles.chatButton, t.cardShadow]}
          onPress={() =>
            navigation.navigate('Chat', {
              documentId,
              fileName: report.fileName,
              language: report.language,
            })
          }
        >
          <MaterialCommunityIcons name="chat-processing-outline" size={20} color={t.onAccent} />
          <Text style={styles.chatButtonText}>Ask Clauzera About This Document</Text>
        </Pressable>

        <Pressable
          style={[styles.exportButton, t.cardShadow]}
          onPress={onExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={t.text} />
          ) : (
            <MaterialCommunityIcons
              name={isPremium ? 'download-outline' : 'lock-outline'}
              size={20}
              color={t.text}
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

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: t.bg },
    centerDark: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: t.headerBg,
    },
    processingText: { color: t.textOnHeader, marginTop: 16 },
    header: {
      backgroundColor: t.headerBg,
      paddingTop: 24,
      paddingBottom: 28,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    docTypeLabel: { color: t.textMutedOnHeader, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    docTypeValue: { color: t.textOnHeader, fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 20 },
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
    scoreLevel: { color: t.textOnHeader, fontWeight: '700', letterSpacing: 0.5 },
    scoreSub: { color: t.textMutedOnHeader, fontSize: 12, marginTop: 2 },
    body: { padding: 20 },
    card: { backgroundColor: t.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    cardTitle: { fontWeight: '700', color: t.text, fontSize: 15 },
    summaryText: { color: t.bodyText, lineHeight: 21 },
    flagRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
    flagTitle: { fontWeight: '700', color: t.text, fontSize: 13.5 },
    flagDetail: { color: t.textMuted, fontSize: 12.5, marginTop: 2 },
    fixToggleText: { color: t.accent, fontSize: 12, fontWeight: '700' },
    fixDiscussText: { color: t.accent, fontSize: 11.5, fontWeight: '700' },
    fixBox: {
      backgroundColor: t.surfaceAlt,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    sectionTitle: { fontWeight: '700', fontSize: 16, color: t.text, marginBottom: 10 },
    clauseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    clauseCard: { width: '47%', backgroundColor: t.surface, borderRadius: 14, padding: 14 },
    clauseLabel: { color: t.textMuted, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.3 },
    clauseValue: { color: t.text, fontWeight: '700', fontSize: 15, marginTop: 4 },
    suggestionRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
    suggestionBullet: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    suggestionBulletText: { color: t.onAccent, fontSize: 11, fontWeight: '800' },
    suggestionText: { flex: 1, color: t.bodyText },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.buttonColor,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 4,
    },
    chatButtonText: { color: t.onAccent, fontWeight: '700', fontSize: 15 },
    deadlinesButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingVertical: 12,
    },
    deadlinesButtonText: { color: t.text, fontWeight: '600', fontSize: 13 },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.surface,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    exportButtonText: { color: t.text, fontWeight: '700', fontSize: 15 },
    disclaimer: { color: t.textMuted, fontSize: 11.5, marginTop: 18, textAlign: 'center' },
  });
