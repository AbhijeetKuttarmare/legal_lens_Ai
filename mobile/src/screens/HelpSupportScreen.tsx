import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NAVY, GOLD, TEXT_MUTED, cardShadow } from '../theme/theme';

const SUPPORT_EMAIL = 'support@legallensai.app';

const FAQS = [
  {
    q: 'How do I sign in?',
    a: 'LegalLens AI uses your phone number to sign in. Enter your number, and we\'ll send a one-time password (OTP) via SMS to verify it — no password needed.',
  },
  {
    q: 'What file types can I upload?',
    a: 'You can upload PDF and DOCX files, or take a photo of a printed document with your camera — Clauzera can read text directly from photos.',
  },
  {
    q: 'Is my document data secure?',
    a: 'Yes. Your documents are transmitted over encrypted connections and only used to generate the analysis shown to you. You can delete any document, or your entire account and all its data, at any time.',
  },
  {
    q: 'Why can I only upload 1 document?',
    a: 'The Free plan allows 1 active document at a time. You can delete your existing document to upload a new one, or upgrade to Pro or Premium for unlimited uploads from the Subscription tab.',
  },
  {
    q: 'How do I delete a document?',
    a: 'Open the Documents tab, tap the three-dot menu on any document card, and choose Delete.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile > Delete Account. This permanently removes your profile and all uploaded documents — this cannot be undone.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. LegalLens AI explains documents in plain English and flags things worth asking about, but it is not a substitute for a qualified lawyer. Always get professional advice before signing anything important.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable hitSlop={10} style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Pressable
          style={[styles.contactCard, cardShadow]}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=LegalLens AI Support`)}
        >
          <View style={styles.contactIcon}>
            <MaterialCommunityIcons name="email-outline" size={20} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email us</Text>
            <Text style={styles.contactSubtitle}>{SUPPORT_EMAIL}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
        </Pressable>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Pressable
              key={item.q}
              style={[styles.faqCard, cardShadow]}
              onPress={() => setOpenIndex(isOpen ? null : idx)}
            >
              <View style={styles.faqHeaderRow}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <MaterialCommunityIcons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={TEXT_MUTED}
                />
              </View>
              {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
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
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 40 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF7E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: { fontWeight: '700', color: NAVY, fontSize: 14 },
  contactSubtitle: { color: TEXT_MUTED, fontSize: 12, marginTop: 2 },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: NAVY, marginBottom: 12 },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: { flex: 1, fontWeight: '600', color: NAVY, fontSize: 13.5 },
  faqAnswer: { color: '#374151', fontSize: 13, lineHeight: 19, marginTop: 10 },
});
