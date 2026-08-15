import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { updateProfile } from '../api/users';
import { extractErrorMessage, TOKEN_KEY } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function EditProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const existingDob = user?.dob ? new Date(user.dob) : null;

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [gender, setGender] = useState<Gender>((user?.gender as Gender) || 'MALE');
  const [day, setDay] = useState(existingDob ? String(existingDob.getDate()) : '');
  const [month, setMonth] = useState(existingDob ? String(existingDob.getMonth() + 1) : '');
  const [year, setYear] = useState(existingDob ? String(existingDob.getFullYear()) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  const isValidDob =
    day.length > 0 &&
    month.length > 0 &&
    year.length === 4 &&
    dayNum >= 1 &&
    dayNum <= 31 &&
    monthNum >= 1 &&
    monthNum <= 12 &&
    yearNum >= 1900 &&
    yearNum <= new Date().getFullYear();
  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0 && isValidDob;

  const onSave = async () => {
    if (!isValid) {
      setError('Please fill in your name and a valid date of birth.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const updatedUser = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dob,
      });
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        await persistSession(token, updatedUser);
      }
      dispatch(setAuthenticated(updatedUser));
      navigation.goBack();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable hitSlop={10} style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.textOnHeader} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
        <View style={styles.nameRow}>
          <TextInput
            mode="outlined"
            label="First name"
            style={styles.nameInput}
            activeOutlineColor={t.text}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            mode="outlined"
            label="Last name"
            style={styles.nameInput}
            activeOutlineColor={t.text}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <Text style={styles.fieldLabel}>Gender</Text>
        <SegmentedButtons
          value={gender}
          onValueChange={(v) => setGender(v as Gender)}
          buttons={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />

        <Text style={styles.fieldLabel}>Date of birth</Text>
        <View style={styles.dobRow}>
          <TextInput
            mode="outlined"
            placeholder="DD"
            style={styles.dobInput}
            activeOutlineColor={t.text}
            keyboardType="number-pad"
            maxLength={2}
            value={day}
            onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            mode="outlined"
            placeholder="MM"
            style={styles.dobInput}
            activeOutlineColor={t.text}
            keyboardType="number-pad"
            maxLength={2}
            value={month}
            onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            mode="outlined"
            placeholder="YYYY"
            style={[styles.dobInput, styles.dobYearInput]}
            activeOutlineColor={t.text}
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ''))}
          />
        </View>

        <View style={styles.readOnlyRow}>
          <Text style={styles.readOnlyLabel}>Phone</Text>
          <Text style={styles.readOnlyValue}>{user?.phone ? `+91 ${user.phone}` : '—'}</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          mode="contained"
          buttonColor={t.buttonColor}
          textColor={t.onAccent}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
          onPress={onSave}
          loading={loading}
          disabled={loading || !isValid}
        >
          Save Changes
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.headerBg,
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { color: t.textOnHeader, fontSize: 18, fontWeight: '700' },
    card: { padding: 20, paddingBottom: 40 },
    nameRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    nameInput: { flex: 1, backgroundColor: t.surface },
    fieldLabel: { color: t.text, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    dobRow: { flexDirection: 'row', gap: 10 },
    dobInput: { flex: 1, backgroundColor: t.surface, textAlign: 'center' },
    dobYearInput: { flex: 1.4 },
    readOnlyRow: {
      marginTop: 20,
      backgroundColor: t.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    readOnlyLabel: { color: '#9CA3AF', fontSize: 12 },
    readOnlyValue: { color: t.text, fontWeight: '600', fontSize: 15, marginTop: 2 },
    primaryButton: { marginTop: 28, borderRadius: 10 },
    primaryButtonContent: { paddingVertical: 6 },
    primaryButtonLabel: { fontWeight: '700', fontSize: 15 },
    errorText: { color: '#DC2626', marginTop: 16 },
  });
