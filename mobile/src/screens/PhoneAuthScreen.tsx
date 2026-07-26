import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { requestOtp, verifyOtp } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';

const LOGO = require('../../assets/Logo.png');

const NAVY = '#0B1220';
const GOLD = '#D4AF37';

type Step = 'phone' | 'otp';

export default function PhoneAuthScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputRef = useRef<any>(null);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);
  const isValidCode = /^\d{4,8}$/.test(code);

  const onSendOtp = async () => {
    if (!isValidPhone) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phone);
      setStep('otp');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!isValidCode) {
      setError('Enter the code sent to your phone.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, code);
      await persistSession(res.accessToken, res.user);
      dispatch(setAuthenticated(res.user));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setCode('');
    try {
      await requestOtp(phone);
      Alert.alert('OTP sent', `A new code was sent to +91 ${phone}`);
    } catch (e) {
      setError(extractErrorMessage(e));
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
        {step === 'phone' ? (
          <>
            <Text variant="titleMedium" style={styles.heading}>
              Enter your mobile number
            </Text>
            <Text style={styles.subheading}>
              We'll text you a verification code to sign in or create an account.
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text variant="bodyLarge">🇮🇳 +91</Text>
              </View>
              <TextInput
                mode="outlined"
                style={styles.phoneInput}
                outlineColor="#D8D8D8"
                activeOutlineColor={NAVY}
                placeholder="98765 43210"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              mode="contained"
              buttonColor={GOLD}
              textColor={NAVY}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
              onPress={onSendOtp}
              loading={loading}
              disabled={loading || !isValidPhone}
            >
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.heading}>
              Enter verification code
            </Text>
            <Text style={styles.subheading}>Sent to +91 {phone}</Text>

            <TextInput
              ref={otpInputRef}
              mode="outlined"
              style={styles.otpInput}
              outlineColor="#D8D8D8"
              activeOutlineColor={NAVY}
              placeholder="••••••"
              keyboardType="number-pad"
              maxLength={8}
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              mode="contained"
              buttonColor={GOLD}
              textColor={NAVY}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
              onPress={onVerifyOtp}
              loading={loading}
              disabled={loading || !isValidCode}
            >
              Verify & Continue
            </Button>

            <View style={styles.linkRow}>
              <Button compact textColor={NAVY} onPress={() => setStep('phone')}>
                Change number
              </Button>
              <Button compact textColor={NAVY} onPress={onResend}>
                Resend OTP
              </Button>
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => navigation.navigate('Terms' as never)}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          >
            Privacy Policy
          </Text>
          . This app provides informational document explanations, not professional legal advice.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: NAVY },
  brandArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 56,
    paddingBottom: 24,
    flexGrow: 0.9,
  },
  logoTile: {
    width: 168,
    height: 168,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
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
    flexGrow: 1.4,
  },
  heading: { textAlign: 'center', marginBottom: 4, color: NAVY, fontWeight: '700' },
  subheading: { textAlign: 'center', color: '#6B7280', marginBottom: 24 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  countryCode: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D8D8D8',
  },
  phoneInput: { flex: 1, backgroundColor: 'white' },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  primaryButton: { marginTop: 16, borderRadius: 10 },
  primaryButtonContent: { paddingVertical: 6 },
  primaryButtonLabel: { fontWeight: '700', fontSize: 15 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  errorText: { color: '#DC2626', marginTop: 8 },
  disclaimer: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 26, lineHeight: 16 },
  legalLink: { color: NAVY, fontWeight: '700', textDecorationLine: 'underline' },
});
