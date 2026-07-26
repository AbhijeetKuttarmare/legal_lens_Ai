import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { getDocumentReport } from '../api/documents';
import { riskColor } from '../theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Report'>;

export default function ReportScreen({ route, navigation }: Props) {
  const { documentId } = route.params;
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentReport(documentId),
    refetchInterval: (query) =>
      query.state.data?.status === 'PROCESSING' ? 2000 : false,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Still analyzing this document...</Text>
      </View>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#DC2626' }}>
          Analysis failed for this document. Check that OPENAI_API_KEY is set on the backend.
        </Text>
      </View>
    );
  }

  const risk = report.riskAnalysis;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text variant="labelLarge" style={{ color: '#666' }}>
        Document Type
      </Text>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {report.documentType?.replace(/_/g, ' ') || 'Document'}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Summary</Text>
          <Text style={{ marginTop: 8 }}>{report.summary?.summaryText}</Text>
        </Card.Content>
      </Card>

      {risk && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.rowBetween}>
              <Text variant="titleMedium">Risk Score</Text>
              <Chip style={{ backgroundColor: riskColor(risk.level) }} textStyle={{ color: 'white' }}>
                {risk.score}/100 · {risk.level}
              </Chip>
            </View>
            {risk.flags.map((flag, idx) => (
              <Text key={idx} style={styles.riskFlag}>
                ⚠️ {flag.title} — {flag.detail}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {!!report.clauseAnalysis?.clauses?.length && (
        <>
          <Text variant="titleMedium" style={{ marginTop: 8, marginBottom: 8 }}>
            Clause Cards
          </Text>
          <View style={styles.clauseGrid}>
            {report.clauseAnalysis.clauses.map((clause, idx) => (
              <Card key={idx} style={styles.clauseCard}>
                <Card.Content>
                  <Text variant="labelMedium" style={{ color: '#666' }}>
                    {clause.label}
                  </Text>
                  <Text variant="titleSmall">{clause.value}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </>
      )}

      {!!risk?.suggestions?.length && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Before Signing, Ask:</Text>
            {risk.suggestions.map((s, idx) => (
              <Text key={idx} style={{ marginTop: 6 }}>
                • {s}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate('Chat', { documentId, fileName: report.fileName })}
      >
        Ask AI About This Document
      </Button>

      <Text style={styles.disclaimer}>
        This is an informational explanation, not professional legal advice. Consult a
        qualified lawyer for important decisions.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riskFlag: { marginTop: 8 },
  clauseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  clauseCard: { width: '47%' },
  disclaimer: { color: '#888', fontSize: 12, marginTop: 20, textAlign: 'center' },
});
