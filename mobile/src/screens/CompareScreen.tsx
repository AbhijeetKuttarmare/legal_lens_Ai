import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { compareDocuments, listDocuments } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { ComparisonResult, DocumentSummary } from '../api/types';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';
import { useAppSelector } from '../store/hooks';
import UpgradeGate from '../components/UpgradeGate';

export default function CompareScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const isPaid = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (!isPaid) return;
    listDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.status === 'READY')))
      .catch((e) => setError(extractErrorMessage(e)));
  }, [isPaid]);

  const onCompare = async () => {
    if (!idA || !idB || idA === idB) {
      setError('Choose two different documents to compare.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await compareDocuments(idA, idB);
      setResult(res);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!isPaid) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.subtitle}>
          Pick two analyzed documents — e.g. two job offers — to see the key differences side by side.
        </Text>
        <UpgradeGate feature="Document Comparison" />
      </ScrollView>
    );
  }

  if (documents === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.subtitle}>
        Pick two analyzed documents — e.g. two job offers — to see the key differences side by side.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {documents.length < 2 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-compare" size={36} color={TEXT_MUTED} />
          <Text style={styles.emptyText}>You need at least 2 analyzed documents to compare.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Document A</Text>
          <View style={styles.chipRow}>
            {documents.map((d) => (
              <Pressable
                key={`a-${d.id}`}
                style={[styles.chip, idA === d.id && styles.chipActive]}
                onPress={() => setIdA(d.id)}
              >
                <Text style={[styles.chipText, idA === d.id && styles.chipTextActive]} numberOfLines={1}>
                  {d.fileName}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Document B</Text>
          <View style={styles.chipRow}>
            {documents.map((d) => (
              <Pressable
                key={`b-${d.id}`}
                style={[styles.chip, idB === d.id && styles.chipActive]}
                onPress={() => setIdB(d.id)}
              >
                <Text style={[styles.chipText, idB === d.id && styles.chipTextActive]} numberOfLines={1}>
                  {d.fileName}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            mode="contained"
            buttonColor={GOLD}
            textColor={NAVY}
            style={styles.compareButton}
            onPress={onCompare}
            loading={loading}
            disabled={loading || !idA || !idB}
          >
            Compare
          </Button>
        </>
      )}

      {result && (
        <View style={{ marginTop: 24 }}>
          <View style={styles.verdictCard}>
            <Text style={styles.verdictLabel}>Verdict</Text>
            <Text style={styles.verdictText}>{result.verdict}</Text>
          </View>

          <Text style={styles.sectionTitle}>Key Differences</Text>
          {result.differences.map((diff, idx) => (
            <View key={idx} style={[styles.diffCard, cardShadow]}>
              <Text style={styles.diffAspect}>{diff.aspect}</Text>
              <View style={styles.diffRow}>
                <View style={styles.diffCol}>
                  <Text style={styles.diffDocLabel} numberOfLines={1}>
                    {result.documentA.fileName}
                  </Text>
                  <Text style={styles.diffValue}>{diff.documentAValue}</Text>
                </View>
                <View style={styles.diffCol}>
                  <Text style={styles.diffDocLabel} numberOfLines={1}>
                    {result.documentB.fileName}
                  </Text>
                  <Text style={styles.diffValue}>{diff.documentBValue}</Text>
                </View>
              </View>
              <Text style={styles.diffNote}>{diff.note}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        This is an informational comparison, not professional legal advice. Consult a qualified lawyer for
        important decisions.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F5F9' },
  subtitle: { color: TEXT_MUTED, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  fieldLabel: { color: NAVY, fontWeight: '700', fontSize: 12.5, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { fontSize: 12.5, fontWeight: '600', color: NAVY },
  chipTextActive: { color: GOLD },
  compareButton: { marginTop: 12, borderRadius: 10 },
  errorText: { color: '#DC2626', marginBottom: 14, fontSize: 12.5 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: TEXT_MUTED, marginTop: 12, textAlign: 'center' },
  verdictCard: { backgroundColor: NAVY, borderRadius: 16, padding: 18, marginBottom: 20 },
  verdictLabel: { color: GOLD, fontWeight: '800', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  verdictText: { color: '#E5E7EB', fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: NAVY, marginBottom: 12 },
  diffCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12 },
  diffAspect: { fontWeight: '700', color: NAVY, fontSize: 13.5, marginBottom: 10 },
  diffRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  diffCol: { flex: 1 },
  diffDocLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  diffValue: { fontSize: 13, color: '#374151' },
  diffNote: { fontSize: 12, color: TEXT_MUTED, borderTopWidth: 1, borderTopColor: '#F1F2F5', paddingTop: 8 },
  disclaimer: { color: '#9CA3AF', fontSize: 11, marginTop: 20, textAlign: 'center' },
});
