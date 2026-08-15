import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';

export default function UpgradeGate({ feature }: { feature: string }) {
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={[styles.card, t.cardShadow]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="credit-card-outline" size={26} color={t.text} />
      </View>
      <Text style={styles.title}>{feature} is a Pro feature</Text>
      <Text style={styles.subtitle}>
        Upgrade to Pro or Enterprise to unlock {feature.toLowerCase()}, along with unlimited uploads and priority
        support.
      </Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Subscription')}>
        <Text style={styles.buttonText}>View Plans</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 28,
      alignItems: 'center',
    },
    icon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    title: { fontWeight: '700', color: t.text, fontSize: 15, marginBottom: 6, textAlign: 'center' },
    subtitle: { color: t.textMuted, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginBottom: 18 },
    button: {
      backgroundColor: t.buttonColor,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 26,
    },
    buttonText: { color: t.onAccent, fontWeight: '700', fontSize: 13 },
  });
