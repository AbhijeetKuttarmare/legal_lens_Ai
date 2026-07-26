import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Button, Card, Text, Chip, IconButton } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { listDocuments } from '../api/documents';
import { riskColor } from '../theme/theme';
import { clearSession } from '../auth/session';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUnauthenticated } from '../store/authSlice';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data: documents, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  });

  const recent = (documents || []).slice(0, 3);

  const onLogout = async () => {
    await clearSession();
    dispatch(setUnauthenticated());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="titleMedium">Hi, {user?.name || user?.phone || user?.email}</Text>
          <Text variant="bodySmall" style={{ color: '#666' }}>
            Plan: {user?.plan}
          </Text>
        </View>
        <IconButton icon="logout" onPress={onLogout} />
      </View>

      <View style={styles.actionsRow}>
        <Button mode="contained" style={styles.actionButton} onPress={() => navigation.navigate('Upload')}>
          Upload Document
        </Button>
        <Button
          mode="outlined"
          style={styles.actionButton}
          onPress={() => Alert.alert('Camera Scan', 'Opens the upload screen where you can pick a photo of a document.')}
        >
          Camera Scan
        </Button>
      </View>

      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Recent Documents</Text>
        <Button compact onPress={() => navigation.navigate('History')}>
          See all
        </Button>
      </View>

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ color: '#666', marginTop: 12 }}>
              No documents yet. Upload your first one above.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('Report', { documentId: item.id })}
          >
            <Card.Content>
              <Text variant="titleSmall">{item.fileName}</Text>
              <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
                {item.documentType?.replace(/_/g, ' ') || item.status}
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

      <Button
        mode="text"
        onPress={() => Alert.alert('Subscription', 'Free plan: 3 documents. Pro/Enterprise plans coming soon.')}
      >
        Manage Subscription
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionButton: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { marginTop: 10 },
  chip: { marginTop: 8, alignSelf: 'flex-start' },
});
