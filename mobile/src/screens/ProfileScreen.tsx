import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Alert } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { RootNavigationParamList } from '../navigation/types';
import { clearSession } from '../auth/session';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUnauthenticated } from '../store/authSlice';
import { deleteAccount } from '../api/users';
import { extractErrorMessage } from '../api/client';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

function initials(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  if (firstName || lastName) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }
  return (fallback || '?').slice(0, 1).toUpperCase();
}

function capitalize(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const comingSoon = (title: string, message: string) => Alert.alert(title, message);

export default function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const onLogout = async () => {
    await clearSession();
    dispatch(setUnauthenticated());
  };

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await clearSession();
      dispatch(setUnauthenticated());
    },
    onError: (e) => Alert.alert('Could not delete account', extractErrorMessage(e)),
  });

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all uploaded documents. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Are you absolutely sure?',
              'This action is permanent and cannot be reversed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete my account',
                  style: 'destructive',
                  onPress: () => deleteAccountMutation.mutate(),
                },
              ],
            ),
        },
      ],
    );
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name;

  const infoRows: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    bg: string;
    color: string;
    label: string;
    value: string;
    editable: boolean;
  }[] = [
    {
      icon: 'phone-outline',
      bg: '#DBEAFE',
      color: '#2563EB',
      label: 'Phone',
      value: user?.phone ? `+91 ${user.phone}` : '—',
      editable: false,
    },
    {
      icon: 'email-outline',
      bg: '#DBEAFE',
      color: '#2563EB',
      label: 'Email',
      value: user?.email || 'Not provided',
      editable: false,
    },
    {
      icon: 'gender-male',
      bg: '#DCFCE7',
      color: '#16A34A',
      label: 'Gender',
      value: user?.gender ? capitalize(user.gender) : '—',
      editable: true,
    },
    {
      icon: 'calendar-blank-outline',
      bg: '#FEF3C7',
      color: '#D97706',
      label: 'Date of Birth',
      value: user?.dob
        ? new Date(user.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        : '—',
      editable: true,
    },
  ];

  const actionRows: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    bg: string;
    color: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'help-circle-outline',
      bg: '#EDE9FE',
      color: '#7C3AED',
      title: 'Help & Support',
      subtitle: 'FAQs and how to contact us',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      icon: 'shield-lock-outline',
      bg: '#DBEAFE',
      color: '#2563EB',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      icon: 'file-document-outline',
      bg: '#FEF3C7',
      color: '#D97706',
      title: 'Terms of Service',
      subtitle: 'Rules for using LegalLens AI',
      onPress: () => navigation.navigate('Terms'),
    },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
          </View>
          <Pressable
            hitSlop={10}
            onPress={() => comingSoon('Notifications', 'No new notifications.')}
          >
            <View>
              <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
              <View style={styles.bellDot} />
            </View>
          </Pressable>
        </View>

        <View style={styles.avatarWrap}>
          <Avatar.Text
            size={88}
            label={initials(user?.firstName, user?.lastName, user?.phone || user?.email)}
            style={{ backgroundColor: GOLD }}
            labelStyle={{ color: NAVY, fontWeight: '700' }}
          />
          <Pressable
            hitSlop={12}
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <MaterialCommunityIcons name="pencil" size={14} color={NAVY} />
          </Pressable>
        </View>
        <Text style={styles.name}>{fullName || 'Your profile'}</Text>
        <View style={styles.planPill}>
          <MaterialCommunityIcons name="crown" size={12} color={GOLD} />
          <Text style={styles.planText}>{user?.plan} PLAN</Text>
        </View>

        <Pressable
          style={styles.settingsButton}
          onPress={() => comingSoon('Settings', 'App settings coming soon.')}
        >
          <MaterialCommunityIcons name="cog-outline" size={20} color="white" />
        </Pressable>
      </View>

      <View style={[styles.card, cardShadow]}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.secureBadge}>
            <MaterialCommunityIcons name="shield-check-outline" size={13} color={TEXT_MUTED} />
            <Text style={styles.secureBadgeText}>Your data is secure</Text>
          </View>
        </View>
        {infoRows.map((row, idx) => (
          <Pressable
            key={row.label}
            style={[styles.row, idx === infoRows.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() =>
              row.editable
                ? navigation.navigate('EditProfile')
                : comingSoon(row.label, `Your ${row.label.toLowerCase()} is tied to your account and can't be changed here.`)
            }
          >
            <View style={[styles.rowIcon, { backgroundColor: row.bg }]}>
              <MaterialCommunityIcons name={row.icon} size={18} color={row.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, cardShadow]}>
        <Text style={[styles.cardTitle, { marginBottom: 4 }]}>Account Actions</Text>
        {actionRows.map((row, idx) => (
          <Pressable
            key={row.title}
            style={[styles.row, idx === actionRows.length - 1 && { borderBottomWidth: 0 }]}
            onPress={row.onPress}
          >
            <View style={[styles.rowIcon, { backgroundColor: row.bg }]}>
              <MaterialCommunityIcons name={row.icon} size={18} color={row.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowValue}>{row.title}</Text>
              <Text style={styles.rowLabel}>{row.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <View style={styles.logoutTitleRow}>
          <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </View>
        <Text style={styles.logoutSubtitle}>You will be signed out from all devices</Text>
      </Pressable>

      <Pressable
        style={styles.deleteAccountButton}
        onPress={onDeleteAccount}
        disabled={deleteAccountMutation.isPending}
      >
        <View style={styles.logoutTitleRow}>
          <MaterialCommunityIcons name="delete-outline" size={18} color="#9CA3AF" />
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </View>
        <Text style={styles.deleteAccountSubtitle}>Permanently delete your account and data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  header: {
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#B7C0D1', fontSize: 12, marginTop: 2 },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  avatarWrap: { position: 'relative' },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 14, fontWeight: '700', fontSize: 18, color: 'white' },
  planPill: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  planText: { color: GOLD, fontWeight: '700', fontSize: 11 },
  settingsButton: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 20,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontWeight: '700', color: NAVY, fontSize: 15 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secureBadgeText: { color: TEXT_MUTED, fontSize: 10.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F5',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: TEXT_MUTED, fontSize: 12 },
  rowValue: { fontWeight: '600', color: NAVY, fontSize: 14, marginTop: 2 },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
  logoutSubtitle: { color: '#B91C1C', fontSize: 11, marginTop: 4, opacity: 0.8 },
  deleteAccountButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteAccountText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  deleteAccountSubtitle: { color: '#9CA3AF', fontSize: 11, marginTop: 4, opacity: 0.8 },
});
