import React from 'react';
import { ScrollView, View, StyleSheet, Alert, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';

interface Props {
  navigation: NavigationProp<RootNavigationParamList>;
}

interface Plan {
  id: 'FREE' | 'PRO' | 'ENTERPRISE';
  name: string;
  price: string;
  period?: string;
  features: string[];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  decoration: keyof typeof MaterialCommunityIcons.glyphMap;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: '₹0',
    features: ['1 document', 'AI summary', 'Document history'],
    icon: 'send-outline',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    decoration: 'file-lock-outline',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '₹299',
    period: '/month',
    features: ['Unlimited uploads', 'Unlimited AI chat', 'Risk detection'],
    icon: 'diamond-stone',
    iconBg: '#FFF7E0',
    iconColor: GOLD,
    decoration: 'chart-line',
  },
  {
    id: 'ENTERPRISE',
    name: 'Premium',
    price: '₹599',
    period: '/month',
    highlight: true,
    icon: 'crown',
    iconBg: 'rgba(212,175,55,0.2)',
    iconColor: GOLD,
    decoration: 'shield-check',
    features: [
      'Unlimited uploads',
      'Unlimited AI chat',
      'Risk detection',
      'Priority support',
      'Advanced AI insights',
      'Export & download reports',
    ],
  },
];

const comingSoon = (title: string, message: string) => Alert.alert(title, message);

export default function SubscriptionScreen({ navigation }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const currentPlan = user?.plan || 'FREE';

  const onSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) return;
    Alert.alert(
      'Coming soon',
      `Upgrading to ${plan.name} isn't wired up to a payment provider yet.`,
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            hitSlop={10}
            style={styles.circleButton}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color="white" />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.circleButtonOutline}
            onPress={() => comingSoon('Plans', 'Compare plan features and billing FAQs here.')}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={20} color="white" />
          </Pressable>
        </View>
        <MaterialCommunityIcons name="crown" size={70} color={GOLD} style={styles.headerCrown} />
        <Text style={styles.headerTitle}>Choose your plan</Text>
        <View style={styles.headerUnderline} />
        <Text style={styles.headerSubtitle}>Unlock unlimited documents and deeper AI insights.</Text>
      </View>

      <View style={styles.plansWrap}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                cardShadow,
                plan.highlight && styles.planCardHighlight,
                plan.id === 'PRO' && styles.planCardPro,
              ]}
            >
              {plan.highlight && (
                <View style={styles.popularBadge}>
                  <MaterialCommunityIcons name="star" size={11} color={NAVY} />
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <MaterialCommunityIcons
                name={plan.decoration}
                size={64}
                color={plan.highlight ? 'rgba(212,175,55,0.15)' : '#E9EDF3'}
                style={styles.cardDecoration}
              />

              <View style={styles.planTopRow}>
                <View style={[styles.planIcon, { backgroundColor: plan.iconBg }]}>
                  <MaterialCommunityIcons name={plan.icon} size={22} color={plan.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, plan.highlight && { color: 'white' }]}>
                    {plan.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, plan.highlight && { color: 'white' }]}>
                      {plan.price}
                    </Text>
                    {plan.period && (
                      <Text style={[styles.period, plan.highlight && { color: '#B7C0D1' }]}>
                        {plan.period}
                      </Text>
                    )}
                  </View>
                </View>
                {isCurrent ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current Plan</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={plan.highlight ? GOLD : '#16A34A'}
                    />
                    <Text style={[styles.featureText, plan.highlight && { color: '#E5E9F0' }]}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>

              {!isCurrent && (
                <Pressable
                  style={[styles.planButton, plan.highlight && styles.planButtonGold]}
                  onPress={() => onSelectPlan(plan)}
                >
                  <Text style={[styles.planButtonText, plan.highlight && { color: NAVY }]}>
                    Upgrade
                  </Text>
                </Pressable>
              )}
              {isCurrent && (
                <View style={styles.currentPlanBar}>
                  <Text style={styles.currentPlanBarText}>Current Plan</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={[styles.footerBanner, cardShadow]}>
        <View style={styles.footerIcon}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={NAVY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerTitle}>Cancel anytime</Text>
          <Text style={styles.footerSubtitle}>No hidden charges. Cancel or downgrade your plan anytime.</Text>
        </View>
        <Pressable
          style={styles.footerArrow}
          onPress={() => comingSoon('Manage plan', 'Plan management coming soon.')}
        >
          <MaterialCommunityIcons name="arrow-right" size={18} color={NAVY} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  header: {
    backgroundColor: NAVY,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  circleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonOutline: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCrown: { position: 'absolute', right: 8, top: 44, opacity: 0.9 },
  headerTitle: { color: 'white', fontSize: 26, fontWeight: '800', marginTop: 8 },
  headerUnderline: { width: 36, height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 6 },
  headerSubtitle: { color: '#B7C0D1', marginTop: 12, maxWidth: '80%', lineHeight: 19 },
  plansWrap: { paddingHorizontal: 20, gap: 16 },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  planCardPro: { backgroundColor: '#FFFBEF', borderWidth: 1, borderColor: '#F3E3B5' },
  planCardHighlight: { backgroundColor: NAVY },
  cardDecoration: { position: 'absolute', right: -6, bottom: -6 },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularBadgeText: { color: NAVY, fontWeight: '800', fontSize: 10 },
  planTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontWeight: '700', fontSize: 16, color: NAVY },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  price: { fontWeight: '800', fontSize: 26, color: NAVY },
  period: { color: TEXT_MUTED, marginLeft: 4, marginBottom: 4 },
  currentBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  currentBadgeText: { color: '#2563EB', fontWeight: '700', fontSize: 11 },
  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: '#374151', fontSize: 13.5 },
  planButton: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planButtonGold: { backgroundColor: GOLD, borderColor: GOLD },
  planButtonText: { fontWeight: '700', color: NAVY },
  currentPlanBar: {
    backgroundColor: '#EEF1F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  currentPlanBarText: { fontWeight: '700', color: TEXT_MUTED },
  footerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
  },
  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTitle: { fontWeight: '700', color: NAVY, fontSize: 14 },
  footerSubtitle: { color: TEXT_MUTED, fontSize: 11.5, marginTop: 2 },
  footerArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
