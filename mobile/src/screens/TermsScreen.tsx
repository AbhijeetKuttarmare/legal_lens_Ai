import React from 'react';
import LegalScreen from '../components/LegalScreen';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By creating an account or using LegalLens AI, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.',
  },
  {
    heading: '2. Description of Service',
    body: 'LegalLens AI uses artificial intelligence to summarize legal and business documents, flag potential risks, and answer questions about documents you upload, in plain English.',
  },
  {
    heading: '3. Not Legal Advice',
    body: 'LegalLens AI is an informational tool, not a law firm, and does not provide legal advice. AI-generated summaries and risk flags may be incomplete or inaccurate. Always consult a qualified lawyer before signing or relying on any document.',
  },
  {
    heading: '4. Eligibility & Account',
    body: 'You must be at least 18 years old to use LegalLens AI. You sign in using your phone number and a one-time password (OTP). You are responsible for keeping access to your phone number secure, since it is your account\'s identity.',
  },
  {
    heading: '5. Subscription Plans',
    body: 'LegalLens AI offers Free, Pro, and Premium plans with different document limits and features, as shown on the Subscription screen. Plan prices and features may change; we will make reasonable efforts to notify you of material changes.',
  },
  {
    heading: '6. Acceptable Use',
    body: 'You agree not to upload documents you do not have the right to share, use the app for any unlawful purpose, or attempt to disrupt or reverse-engineer the service.',
  },
  {
    heading: '7. Your Content',
    body: 'You retain ownership of the documents you upload. You grant us a limited license to process that content solely to provide the analysis and chat features of the app.',
  },
  {
    heading: '8. Termination',
    body: 'You may stop using the app or delete your account at any time from Profile > Delete Account, which permanently removes your data. We may suspend accounts that violate these terms.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'LegalLens AI is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for decisions made based on AI-generated output.',
  },
  {
    heading: '10. Governing Law',
    body: 'These terms are governed by the laws of India, without regard to conflict-of-law principles.',
  },
  {
    heading: '11. Changes to These Terms',
    body: 'We may update these terms from time to time. Continued use of the app after changes means you accept the updated terms.',
  },
  {
    heading: '12. Contact Us',
    body: 'Questions about these terms can be sent to support@legallensai.app.',
  },
];

export default function TermsScreen() {
  return (
    <LegalScreen title="Terms of Service" updatedLabel="Last updated: July 2026" sections={SECTIONS} />
  );
}
