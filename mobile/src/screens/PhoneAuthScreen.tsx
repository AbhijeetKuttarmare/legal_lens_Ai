import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { requestOtp, verifyOtp } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';
import { useAppTheme } from '../theme/ThemeContext';

const LOGO = require('../../assets/icon-glyph.png');

// This screen's gradient hero + white card are a fixed brand treatment
// (like web's .cw-auth-page/.cw-auth-card) — intentionally not part of the
// dark/light toggle. Only the accent color (GOLD below) follows the user's
// theme customization, since it's chosen independently of light/dark mode.
const NAVY = '#0B1220';

type Step = 'phone' | 'otp';

export default function PhoneAuthScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const t = useAppTheme();
  const GOLD = t.accent;
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
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
    <LinearGradient colors={['#0B1220', '#101c33', '#0B1220']} style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandArea}>
          <View style={styles.dotGrid} pointerEvents="none">
            {Array.from({ length: 6 }).map((_, row) => (
              <View key={row} style={styles.dotRow}>
                {Array.from({ length: 6 }).map((_, col) => (
                  <View key={col} style={styles.dot} />
                ))}
              </View>
            ))}
          </View>

          <MaterialCommunityIcons
            name="scale-balance"
            size={280}
            color="rgba(212,175,55,0.16)"
            style={styles.scaleDecoration}
          />
          <View style={styles.glowRing} />
          <View style={styles.sparkleTop}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={GOLD} />
          </View>
          <View style={styles.logoTile}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandTitle}>
            Clauzera <Text style={{ color: GOLD }}>AI</Text>
          </Text>
          <Text style={styles.brandTagline}>Understand. Analyze. Empower.</Text>
        </View>

        <View style={styles.cardWrap}>
          <Svg
            width={width}
            height={110}
            viewBox={`0 0 ${width} 110`}
            style={styles.waveSvg}
          >
            <Path
              d={`M0,14 C ${width * 0.45},0 ${width * 0.58},64 ${width},88 L${width},110 L0,110 Z`}
              fill="white"
            />
          </Svg>

          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <View style={styles.headingRow}>
                  <View style={styles.headingIcon}>
                    <MaterialCommunityIcons name="shield-check-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Welcome back!</Text>
                    <Text style={styles.subheading}>Login or create an account to continue</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View
                  style={[
                    styles.phoneRow,
                    phoneFocused && styles.phoneRowFocused,
                    phoneFocused && { borderColor: GOLD },
                  ]}
                >
                  <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    mode="flat"
                    style={styles.phoneInput}
                    underlineStyle={{ display: 'none' }}
                    contentStyle={styles.phoneInputContent}
                    placeholder="Enter your mobile number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                  />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  onPress={onSendOtp}
                  disabled={loading || !isValidPhone}
                  style={{ marginTop: 20, opacity: !isValidPhone ? 0.5 : 1 }}
                >
                  <LinearGradient
                    colors={['#0B1220', '#1E3A8A', '#2952CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Text style={styles.gradientButtonText}>Send OTP</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <View style={styles.trustRow}>
                  <View style={styles.trustIcon}>
                    <MaterialCommunityIcons name="shield-check" size={13} color="#16A34A" />
                  </View>
                  <Text style={styles.trustText}>Your data is safe and secure with us</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.headingRow}>
                  <View style={styles.headingIcon}>
                    <MaterialCommunityIcons name="message-lock-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Enter verification code</Text>
                    <Text style={styles.subheading}>Sent to +91 {phone}</Text>
                  </View>
                </View>

                <TextInput
                  ref={otpInputRef}
                  mode="outlined"
                  style={styles.otpInput}
                  outlineStyle={styles.otpOutline}
                  outlineColor="#E5E7EB"
                  activeOutlineColor={GOLD}
                  placeholder="• • • • • •"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  maxLength={8}
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  onPress={onVerifyOtp}
                  disabled={loading || !isValidCode}
                  style={{ marginTop: 20, opacity: !isValidCode ? 0.5 : 1 }}
                >
                  <LinearGradient
                    colors={['#0B1220', '#1E3A8A', '#2952CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.gradientButtonText}>Verify & Continue</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <View style={styles.linkRow}>
                  <Button
                    compact
                    textColor={NAVY}
                    icon="pencil-outline"
                    onPress={() => setStep('phone')}
                  >
                    Change number
                  </Button>
                  <Button compact textColor={NAVY} icon="refresh" onPress={onResend}>
                    Resend OTP
                  </Button>
                </View>

                <View style={styles.trustRow}>
                  <View style={styles.trustIcon}>
                    <MaterialCommunityIcons name="shield-check" size={13} color="#16A34A" />
                  </View>
                  <Text style={styles.trustText}>Your data is safe and secure with us</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.footerDisclaimer}>
          <MaterialCommunityIcons name="lock-outline" size={13} color="#9CA3AF" />
          <Text style={styles.disclaimer}>
            {' '}By continuing, you agree to our{' '}
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
            .
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  brandArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 40,
    paddingBottom: 28,
    flexGrow: 0.85,
    overflow: 'hidden',
  },
  dotGrid: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 8,
  },
  dotRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  scaleDecoration: {
    position: 'absolute',
    bottom: -30,
    right: -60,
  },
  glowRing: {
    position: 'absolute',
    top: '18%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(212,175,55,0.22)',
  },
  sparkleTop: {
    position: 'absolute',
    top: '16%',
    right: '24%',
  },
  logoTile: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginTop: 18 },
  brandTagline: { color: '#8D97A8', fontSize: 12, marginTop: 4, letterSpacing: 0.3 },
  cardWrap: { flexGrow: 1.5 },
  waveSvg: { marginBottom: -2 },
  card: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  headingRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 22 },
  headingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  heading: { color: NAVY, fontWeight: '800', fontSize: 19 },
  subheading: { color: '#6B7280', fontSize: 12.5, marginTop: 2 },
  fieldLabel: { color: NAVY, fontWeight: '700', fontSize: 12.5, marginBottom: 8 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  phoneRowFocused: {
    backgroundColor: 'white',
  },
  countryCode: { fontSize: 15, fontWeight: '700', color: NAVY },
  phoneDivider: { width: 1, height: 22, backgroundColor: '#DDE1E8' },
  phoneInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 15,
    height: 52,
  },
  phoneInputContent: { paddingLeft: 8 },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    backgroundColor: '#F4F5F9',
  },
  otpOutline: { borderRadius: 14 },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
  },
  gradientButtonText: { color: 'white', fontWeight: '800', fontSize: 15.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  errorText: { color: '#DC2626', marginTop: 10, fontSize: 12.5 },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  trustIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: { color: '#6B7280', fontSize: 11.5 },
  footerDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  disclaimer: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', lineHeight: 16, flexShrink: 1 },
  legalLink: { color: '#2563EB', fontWeight: '700' },
});
