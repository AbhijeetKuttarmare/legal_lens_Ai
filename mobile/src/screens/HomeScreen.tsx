import React from 'react';
import { View, StyleSheet, FlatList, Alert, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { deleteDocument, listDocuments } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';
import { useAppSelector } from '../store/hooks';
import { DocumentSummary } from '../api/types';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

function fileTypeMeta(fileType: string) {
  if (fileType === 'application/pdf') {
    return { icon: 'file-pdf-box' as const, bg: '#FEE2E2', color: '#DC2626' };
  }
  if (fileType.includes('wordprocessingml')) {
    return { icon: 'file-word-box' as const, bg: '#DBEAFE', color: '#2563EB' };
  }
  if (fileType.startsWith('image/')) {
    return { icon: 'file-image' as const, bg: '#DCFCE7', color: '#16A34A' };
  }
  return { icon: 'file-document-outline' as const, bg: '#EEF1F6', color: NAVY };
}

function statusMeta(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', icon: 'check-circle' as const, color: '#16A34A' };
  if (status === 'FAILED') return { label: 'Failed', icon: 'alert-circle' as const, color: '#DC2626' };
  return { label: 'Processing', icon: 'clock-outline' as const, color: '#D97706' };
}

const comingSoon = (title: string, message: string) => Alert.alert(title, message);

export default function HomeScreen({ navigation }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const { data: documents, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (e) => Alert.alert('Could not delete document', extractErrorMessage(e)),
  });

  const openDocumentActions = (item: DocumentSummary) => {
    Alert.alert(item.fileName, undefined, [
      { text: 'View Report', onPress: () => navigation.navigate('Report', { documentId: item.id }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete document?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteMutation.mutate(item.id),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const recent = (documents || []).slice(0, 4);

  return (
    <FlatList
      style={styles.page}
      data={recent}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <>
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <View style={styles.brand}>
              <MaterialCommunityIcons name="text-box-search-outline" size={20} color={GOLD} />
              <Text style={styles.brandTitle}>
                Legal Lens <Text style={{ color: GOLD }}>AI</Text>
              </Text>
              <Text style={styles.brandTagline}>Understand. Analyze. Empower.</Text>
            </View>
            <Pressable
              hitSlop={10}
              style={styles.bellWrap}
              onPress={() => comingSoon('Notifications', 'No new notifications.')}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color={NAVY} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <MaterialCommunityIcons
              name="file-search-outline"
              size={110}
              color="rgba(255,255,255,0.08)"
              style={styles.heroDecoration}
            />
            <Text style={styles.heroGreeting}>Welcome back, {user?.firstName || 'there'}</Text>
            <Text style={styles.heroSubtitle}>
              Upload any legal document and get AI-powered insights in seconds.
            </Text>
            <Pressable style={styles.scanButton} onPress={() => navigation.navigate('Upload')}>
              <MaterialCommunityIcons name="tray-arrow-up" size={20} color={NAVY} />
              <Text style={styles.scanButtonText}>Scan Document</Text>
            </Pressable>
            <Text style={styles.heroCaption}>Supports PDF, DOCX · Max 20MB</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
          </View>

          <View style={styles.actionsGrid}>
            <QuickAction
              icon="file-document-outline"
              title="Analyze Document"
              subtitle="Get AI insights and summaries"
              onPress={() => navigation.navigate('Upload')}
            />
            <QuickAction
              icon="chat-question-outline"
              title="Ask Legal Question"
              subtitle="Chat about one of your documents"
              onPress={() => navigation.navigate('History')}
            />
            <QuickAction
              icon="folder-multiple-outline"
              title="My Documents"
              subtitle="View all analyzed documents"
              onPress={() => navigation.navigate('History')}
            />
            <QuickAction
              icon="crown-outline"
              title="Subscription"
              subtitle="Manage your plan"
              onPress={() => navigation.navigate('Subscription')}
            />
            <QuickAction
              icon="file-compare"
              title="Compare Documents"
              subtitle="See two documents side by side"
              onPress={() => navigation.navigate('Compare')}
            />
            <QuickAction
              icon="file-outline"
              title="Templates"
              subtitle="Generate a draft document"
              onPress={() => navigation.navigate('Templates')}
            />
          </View>

          <Pressable
            style={[styles.insightsBanner, cardShadow]}
            onPress={() =>
              comingSoon(
                'AI-Powered Insights',
                'Our AI highlights key points, risks, important clauses and more from your documents.',
              )
            }
          >
            <View style={styles.insightsIcon}>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightsTitle}>AI-Powered Insights</Text>
              <Text style={styles.insightsSubtitle}>
                Highlights key points, risks and clauses from your documents.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
          </Pressable>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <Pressable onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
        </>
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={40} color={TEXT_MUTED} />
            <Text style={styles.emptyText}>No documents yet. Scan your first one above.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }: { item: DocumentSummary }) => {
        const file = fileTypeMeta(item.fileType);
        const status = statusMeta(item.status);
        return (
          <Pressable
            style={[styles.docCard, cardShadow]}
            onPress={() => navigation.navigate('Report', { documentId: item.id })}
          >
            <View style={[styles.docIconWrap, { backgroundColor: file.bg }]}>
              <MaterialCommunityIcons name={file.icon} size={22} color={file.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {item.fileName}
              </Text>
              <View style={styles.docStatusRow}>
                <MaterialCommunityIcons name={status.icon} size={13} color={status.color} />
                <Text style={[styles.docStatusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <View style={styles.docMetaCol}>
              <Text style={styles.docDate}>
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              <Pressable hitSlop={8} onPress={() => openDocumentActions(item)}>
                <MaterialCommunityIcons name="dots-vertical" size={18} color={TEXT_MUTED} />
              </Pressable>
            </View>
          </Pressable>
        );
      }}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.actionCard, cardShadow]} onPress={onPress}>
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={NAVY} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topBarSpacer: { width: 26 },
  brand: { alignItems: 'center' },
  brandTitle: { fontWeight: '800', fontSize: 17, color: NAVY },
  brandTagline: { fontSize: 10, color: TEXT_MUTED, marginTop: 1 },
  bellWrap: { padding: 2 },
  bellDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  hero: {
    backgroundColor: NAVY,
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 22,
    overflow: 'hidden',
  },
  heroDecoration: { position: 'absolute', right: -10, top: 10 },
  heroGreeting: { color: 'white', fontSize: 20, fontWeight: '700' },
  heroSubtitle: { color: '#B7C0D1', marginTop: 8, maxWidth: '85%', lineHeight: 19 },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  scanButtonText: { color: NAVY, fontWeight: '700', fontSize: 14 },
  heroCaption: { color: '#8D97A8', fontSize: 11, marginTop: 10 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: NAVY },
  seeAll: { color: GOLD, fontWeight: '600' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: { fontWeight: '700', color: NAVY, fontSize: 13.5 },
  actionSubtitle: { color: TEXT_MUTED, fontSize: 11.5, marginTop: 3 },
  insightsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
  },
  insightsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF7E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsTitle: { fontWeight: '700', color: NAVY, fontSize: 14 },
  insightsSubtitle: { color: TEXT_MUTED, fontSize: 11.5, marginTop: 2 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontWeight: '700', color: NAVY, fontSize: 14 },
  docStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  docStatusText: { fontSize: 12, fontWeight: '600' },
  docMetaCol: { alignItems: 'flex-end', gap: 8 },
  docDate: { color: TEXT_MUTED, fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyText: { color: TEXT_MUTED, marginTop: 12, textAlign: 'center' },
});
