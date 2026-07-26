import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { requestOtp, verifyOtp } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';

const LOGO = require('../../assets/Logo.png');

const comingSoon = (provider: string) =>
  Alert.alert(
    'Coming soon',
    `${provider} sign-in isn't configured in this build yet.`,
  );

type Step = 'phone' | 'otp';

export default function PhoneAuthScreen() {
  const dispatch = useAppDispatch();
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

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
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
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
              placeholder="••••••"
              keyboardType="number-pad"
              maxLength={8}
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              mode="contained"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              onPress={onVerifyOtp}
              loading={loading}
              disabled={loading || !isValidCode}
            >
              Verify & Continue
            </Button>

            <View style={styles.linkRow}>
              <Button compact onPress={() => setStep('phone')}>
                Change number
              </Button>
              <Button compact onPress={onResend}>
                Resend OTP
              </Button>
            </View>
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <IconButton
            icon="google"
            mode="contained-tonal"
            size={28}
            onPress={() => comingSoon('Google')}
          />
          <IconButton
            icon="apple"
            mode="contained-tonal"
            size={28}
            onPress={() => comingSoon('Apple')}
          />
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree this app provides informational document explanations, not
          professional legal advice.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 176, height: 176, alignSelf: 'center', marginBottom: 8 },
  heading: { textAlign: 'center', marginBottom: 4 },
  subheading: { textAlign: 'center', color: '#666', marginBottom: 24 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  countryCode: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#79747E',
  },
  phoneInput: { flex: 1 },
  otpInput: { textAlign: 'center', letterSpacing: 8, fontSize: 20, marginBottom: 8 },
  primaryButton: { marginTop: 16, borderRadius: 10 },
  primaryButtonContent: { paddingVertical: 6 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  errorText: { color: '#DC2626', marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D8D8D8' },
  dividerText: { marginHorizontal: 12, color: '#666' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  disclaimer: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
