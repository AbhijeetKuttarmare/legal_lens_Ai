import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { updateProfile } from '../api/users';
import { extractErrorMessage } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';
import { TOKEN_KEY } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../theme/ThemeContext';

const LOGO = require('../../assets/Logo.png');
// Fixed brand chrome (navy page, white card), matching PhoneAuthScreen —
// intentionally not part of the dark/light toggle. Only the primary
// button's color follows the user's theme customization.
const NAVY = '#0B1220';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function CompleteProfileScreen() {
  const dispatch = useAppDispatch();
  const t = useAppTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
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

  const onSubmit = async () => {
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
      <View style={styles.brandArea}>
        <View style={styles.logoTile}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.card}>
        <Text variant="titleMedium" style={styles.heading}>
          Complete your profile
        </Text>
        <Text style={styles.subheading}>Just a few details before you get started.</Text>

        <View style={styles.nameRow}>
          <TextInput
            mode="outlined"
            label="First name"
            style={styles.nameInput}
            activeOutlineColor={NAVY}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            mode="outlined"
            label="Last name"
            style={styles.nameInput}
            activeOutlineColor={NAVY}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <Text style={styles.fieldLabel}>Gender</Text>
        <SegmentedButtons
          value={gender}
          onValueChange={(v) => setGender(v as Gender)}
          style={styles.segmented}
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
            activeOutlineColor={NAVY}
            keyboardType="number-pad"
            maxLength={2}
            value={day}
            onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            mode="outlined"
            placeholder="MM"
            style={styles.dobInput}
            activeOutlineColor={NAVY}
            keyboardType="number-pad"
            maxLength={2}
            value={month}
            onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            mode="outlined"
            placeholder="YYYY"
            style={[styles.dobInput, styles.dobYearInput]}
            activeOutlineColor={NAVY}
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ''))}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          mode="contained"
          buttonColor={t.buttonColor}
          textColor={NAVY}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
          onPress={onSubmit}
          loading={loading}
          disabled={loading || !isValid}
        >
          Continue
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: NAVY },
  brandArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 48,
    paddingBottom: 20,
    flexGrow: 0.6,
  },
  logoTile: {
    width: 108,
    height: 108,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { width: '100%', height: '100%' },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
    flexGrow: 1.6,
  },
  heading: { textAlign: 'center', marginBottom: 4, color: NAVY, fontWeight: '700' },
  subheading: { textAlign: 'center', color: '#6B7280', marginBottom: 24 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  nameInput: { flex: 1, backgroundColor: 'white' },
  fieldLabel: { color: NAVY, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  segmented: {},
  dobRow: { flexDirection: 'row', gap: 10 },
  dobInput: { flex: 1, backgroundColor: 'white', textAlign: 'center' },
  dobYearInput: { flex: 1.4 },
  primaryButton: { marginTop: 24, borderRadius: 10 },
  primaryButtonContent: { paddingVertical: 6 },
  primaryButtonLabel: { fontWeight: '700', fontSize: 15 },
  errorText: { color: '#DC2626', marginTop: 16 },
});
