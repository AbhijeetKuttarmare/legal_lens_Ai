import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert, TextInput as RNTextInput } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { deleteDocument, listDocuments } from '../api/documents';
import { extractErrorMessage } from '../api/client';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';
import { DocumentSummary } from '../api/types';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

type FilterKey = 'ALL' | 'READY' | 'FAILED' | 'PENDING';

const FILTERS: { key: FilterKey; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'ALL', label: 'All Documents', icon: 'file-document-outline' },
  { key: 'READY', label: 'Analyzed', icon: 'check-circle-outline' },
  { key: 'FAILED', label: 'Failed', icon: 'alert-circle-outline' },
  { key: 'PENDING', label: 'Processing', icon: 'progress-clock' },
];

function fileTypeMeta(fileType: string, defaultColor: string) {
  if (fileType === 'application/pdf') return { icon: 'file-pdf-box' as const, bg: '#FEE2E2', color: '#DC2626', label: 'PDF' };
  if (fileType.includes('wordprocessingml')) return { icon: 'file-word-box' as const, bg: '#DBEAFE', color: '#2563EB', label: 'DOCX' };
  if (fileType.includes('spreadsheetml')) return { icon: 'file-excel-box' as const, bg: '#DCFCE7', color: '#16A34A', label: 'XLSX' };
  if (fileType.includes('presentationml')) return { icon: 'file-powerpoint-box' as const, bg: '#FFEDD5', color: '#EA580C', label: 'PPTX' };
  if (fileType.startsWith('image/')) return { icon: 'file-image' as const, bg: '#DCFCE7', color: '#16A34A', label: 'IMG' };
  return { icon: 'file-document-outline' as const, bg: '#EEF1F6', color: defaultColor, label: 'DOC' };
}

function statusPill(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', icon: 'check-circle' as const, bg: '#DCFCE7', color: '#16A34A' };
  if (status === 'FAILED') return { label: 'Failed', icon: 'alert-circle' as const, bg: '#FEE2E2', color: '#DC2626' };
  return { label: 'Processing', icon: 'progress-clock' as const, bg: '#FEF3C7', color: '#D97706' };
}

type SortKey = 'newest' | 'oldest' | 'name';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Recently Added',
  oldest: 'Oldest First',
  name: 'Name (A-Z)',
};

export default function HistoryScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const stats = useMemo(() => {
    const list = documents || [];
    return {
      total: list.length,
      ready: list.filter((d) => d.status === 'READY').length,
      failed: list.filter((d) => d.status === 'FAILED').length,
      pending: list.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED').length,
    };
  }, [documents]);

  const filtered = useMemo(() => {
    let list = documents || [];
    if (filter === 'PENDING') list = list.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED');
    else if (filter !== 'ALL') list = list.filter((d) => d.status === filter);

    const query = searchQuery.trim().toLowerCase();
    if (query) list = list.filter((d) => d.fileName.toLowerCase().includes(query));

    const sorted = [...list];
    if (sortKey === 'newest') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sortKey === 'oldest') sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else sorted.sort((a, b) => a.fileName.localeCompare(b.fileName));
    return sorted;
  }, [documents, filter, searchQuery, sortKey]);

  const openSortPicker = () => {
    Alert.alert('Sort by', undefined, [
      { text: 'Recently Added', onPress: () => setSortKey('newest') },
      { text: 'Oldest First', onPress: () => setSortKey('oldest') },
      { text: 'Name (A-Z)', onPress: () => setSortKey('name') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.text} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.page}
      data={filtered}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>My Documents</Text>
              <Text style={styles.subtitle}>All your legal documents in one place</Text>
            </View>
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                setSearchVisible((v) => !v);
                if (searchVisible) setSearchQuery('');
              }}
            >
              <MaterialCommunityIcons name={searchVisible ? 'close' : 'magnify'} size={20} color={t.text} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={openSortPicker}>
              <MaterialCommunityIcons name="tune-variant" size={20} color={t.text} />
            </Pressable>
          </View>

          {searchVisible && (
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={t.textMuted} />
              <RNTextInput
                style={styles.searchInput}
                placeholder="Search by file name..."
                placeholderTextColor={t.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTERS}
            keyExtractor={(f) => f.key}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const active = filter === item.key;
              return (
                <Pressable
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(item.key)}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={15}
                    color={active ? t.textOnHeader : t.text}
                  />
                  <Text style={[styles.filterChipText, active && { color: t.textOnHeader }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View style={[styles.statsCard, t.cardShadow]}>
            <StatItem styles={styles} icon="file-document-outline" iconBg="#DBEAFE" iconColor="#2563EB" value={stats.total} label="Total" />
            <View style={styles.statDivider} />
            <StatItem styles={styles} icon="check-circle" iconBg="#DCFCE7" iconColor="#16A34A" value={stats.ready} label="Analyzed" />
            <View style={styles.statDivider} />
            <StatItem styles={styles} icon="alert-circle" iconBg="#FEE2E2" iconColor="#DC2626" value={stats.failed} label="Failed" />
            <View style={styles.statDivider} />
            <StatItem styles={styles} icon="progress-clock" iconBg="#FEF3C7" iconColor="#D97706" value={stats.pending} label="Pending" />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <Pressable onPress={openSortPicker}>
              <Text style={styles.sortText}>Sort by: {SORT_LABELS[sortKey]}</Text>
            </Pressable>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="folder-search-outline" size={40} color={t.textMuted} />
          <Text style={styles.emptyText}>No documents in this filter yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const file = fileTypeMeta(item.fileType, t.text);
        const status = statusPill(item.status);
        const created = new Date(item.createdAt);
        return (
          <Pressable
            style={[styles.card, t.cardShadow]}
            onPress={() => navigation.navigate('Report', { documentId: item.id })}
          >
            <View style={[styles.iconWrap, { backgroundColor: file.bg }]}>
              <MaterialCommunityIcons name={file.icon} size={20} color={file.color} />
              <Text style={[styles.iconLabel, { color: file.color }]}>{file.label}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.fileName}
              </Text>
              {!!item.documentType && (
                <Text style={styles.typeLabel}>{item.documentType.replace(/_/g, ' ')}</Text>
              )}
              <View style={styles.dateRow}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={12} color={t.textMuted} />
                <Text style={styles.dateText}>
                  {created.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}
                  {created.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
                <MaterialCommunityIcons name={status.icon} size={13} color={status.color} />
              </View>
              <Pressable hitSlop={8} onPress={() => openDocumentActions(item)}>
                <MaterialCommunityIcons name="dots-vertical" size={18} color={t.textMuted} />
              </Pressable>
            </View>
          </Pressable>
        );
      }}
      ListFooterComponent={
        (filtered?.length || 0) > 0 ? (
          <View style={[styles.trustBanner, t.cardShadow]}>
            <View style={styles.trustIcon}>
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>Your documents are safe and secure</Text>
              <Text style={styles.trustSubtitle}>
                We use enterprise-grade encryption to keep your data protected.
              </Text>
            </View>
          </View>
        ) : null
      }
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
    />
  );
}

function StatItem({
  styles,
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
    title: { fontWeight: '800', fontSize: 24, color: t.text },
    subtitle: { color: t.textMuted, fontSize: 12, marginTop: 2 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    searchInput: { flex: 1, paddingVertical: 10, color: t.text, fontSize: 14 },
    filterRow: { gap: 8, paddingBottom: 16 },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
    },
    filterChipActive: { backgroundColor: t.headerBg, borderColor: t.headerBg },
    filterChipText: { fontSize: 12.5, fontWeight: '600', color: t.text },
    statsCard: {
      flexDirection: 'row',
      backgroundColor: t.surface,
      borderRadius: 16,
      paddingVertical: 16,
      marginBottom: 20,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: t.surfaceAlt },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    statValue: { fontWeight: '800', fontSize: 18, color: t.text },
    statLabel: { color: t.textMuted, fontSize: 11, marginTop: 2 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontWeight: '700', fontSize: 16, color: t.text },
    sortText: { color: t.textMuted, fontSize: 11.5 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      gap: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLabel: { fontSize: 8, fontWeight: '800', marginTop: 1 },
    name: { fontWeight: '700', color: t.text, fontSize: 14 },
    typeLabel: { color: t.textMuted, fontSize: 10.5, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    dateText: { color: t.textMuted, fontSize: 11 },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    statusPillText: { fontSize: 11, fontWeight: '700' },
    trustBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    trustIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: t.headerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustTitle: { fontWeight: '700', color: t.text, fontSize: 13.5 },
    trustSubtitle: { color: t.textMuted, fontSize: 11.5, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: t.textMuted, marginTop: 12 },
  });
