import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ActivityIndicator, Card, Chip, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { listDocuments } from '../api/documents';
import { riskColor } from '../theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={documents || []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={{ padding: 16, color: '#666' }}>No documents yet.</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('Report', { documentId: item.id })}>
          <Card.Content>
            <Text variant="titleSmall">{item.fileName}</Text>
            <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
              {item.documentType?.replace(/_/g, ' ') || item.status} ·{' '}
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.riskAnalysis && (
              <Chip
                style={[styles.chip, { backgroundColor: riskColor(item.riskAnalysis.level) }]}
                textStyle={{ color: 'white' }}
              >
                Risk {item.riskAnalysis.score}/100
              </Chip>
            )}
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 10 },
  chip: { marginTop: 8, alignSelf: 'flex-start' },
});
