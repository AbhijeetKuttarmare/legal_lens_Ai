import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { createCreditOrder, verifyCreditOrder } from '../api/payments';
import { extractErrorMessage, TOKEN_KEY } from '../api/client';
import { persistSession } from '../auth/session';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated } from '../store/authSlice';
import { buildRazorpayCheckoutHtml } from '../utils/razorpayCheckoutHtml';
import { NAVY, GOLD } from '../theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'CreditCheckout'>;

type Stage = 'creating' | 'checkout' | 'verifying';

export default function CreditCheckoutScreen({ route, navigation }: Props) {
  const { pack, credits } = route.params;
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [stage, setStage] = useState<Stage>('creating');
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const order = await createCreditOrder(pack);
        setHtml(
          buildRazorpayCheckoutHtml({
            keyId: order.keyId,
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            planLabel: `${credits} Document Credits`,
            description: `${credits} document credits`,
            phone: user?.phone,
          }),
        );
        setStage('checkout');
      } catch (e) {
        setError(extractErrorMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMessage = async (event: WebViewMessageEvent) => {
    let data: any;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (data.status === 'cancelled') {
      navigation.goBack();
      return;
    }

    if (data.status === 'failed') {
      Alert.alert('Payment failed', data.error || 'Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    if (data.status === 'success') {
      setStage('verifying');
      try {
        const updatedUser = await verifyCreditOrder({
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          pack,
        });
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          await persistSession(token, updatedUser);
        }
        dispatch(setAuthenticated(updatedUser));
        Alert.alert('Payment successful', `${credits} document credits added to your account.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (e) {
        Alert.alert('Could not confirm payment', extractErrorMessage(e), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#DC2626', textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
      </View>
    );
  }

  if (stage === 'creating' || !html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
        <Text style={{ marginTop: 16, color: NAVY }}>Preparing checkout...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={{ flex: 1 }}
        androidLayerType="software"
        onError={(e) => setError(`Checkout failed to load: ${e.nativeEvent.description}`)}
        onRenderProcessGone={() =>
          setError('The checkout page crashed. Please go back and try again.')
        }
      />
      {stage === 'verifying' && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={{ marginTop: 16, color: 'white' }}>Confirming your payment...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5F9' },
  overlay: {
    backgroundColor: 'rgba(11,18,32,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
