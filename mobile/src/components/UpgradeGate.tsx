import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';

export default function UpgradeGate({ feature }: { feature: string }) {
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();

  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="credit-card-outline" size={26} color={NAVY} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontWeight: '700', color: NAVY, fontSize: 15, marginBottom: 6, textAlign: 'center' },
  subtitle: { color: TEXT_MUTED, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginBottom: 18 },
  button: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  buttonText: { color: NAVY, fontWeight: '700', fontSize: 13 },
});
