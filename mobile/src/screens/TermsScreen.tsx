import React from 'react';
import LegalScreen from '../components/LegalScreen';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By creating an account or using Clauzera AI, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.',
  },
  {
    heading: '2. Description of Service',
    body: 'Clauzera AI uses artificial intelligence to summarize legal and business documents, flag potential risks, and answer questions about documents you upload, in plain English.',
  },
  {
    heading: '3. Not Legal Advice',
    body: 'Clauzera AI is an informational tool, not a law firm, and does not provide legal advice. AI-generated summaries and risk flags may be incomplete or inaccurate. Always consult a qualified lawyer before signing or relying on any document.',
  },
  {
    heading: '4. AI-Generated Document Templates',
    body: 'The Templates feature uses AI to generate DRAFT documents (such as rental agreements, NDAs, and freelance contracts) based on details you provide. These drafts are a starting point only — not legal advice, not reviewed by a lawyer, and not guaranteed to be complete, accurate, or suitable for your situation or jurisdiction. You must have any generated document reviewed by a qualified lawyer before signing or relying on it, and you are solely responsible for how you use it.',
  },
  {
    heading: '5. Eligibility & Account',
    body: 'You must be at least 18 years old to use Clauzera AI. You sign in using your phone number and a one-time password (OTP). You are responsible for keeping access to your phone number secure, since it is your account\'s identity.',
  },
  {
    heading: '6. Subscription Plans',
    body: 'Clauzera AI offers Free, Pro, and Max plans with different document limits and features, as shown on the Subscription screen. Plan prices and features may change; we will make reasonable efforts to notify you of material changes.',
  },
  {
    heading: '7. Acceptable Use',
    body: 'You agree not to upload documents you do not have the right to share, use the app for any unlawful purpose, or attempt to disrupt or reverse-engineer the service.',
  },
  {
    heading: '8. Your Content',
    body: 'You retain ownership of the documents you upload. You grant us a limited license to process that content solely to provide the analysis and chat features of the app.',
  },
  {
    heading: '9. Termination',
    body: 'You may stop using the app or delete your account at any time from Profile > Delete Account, which permanently removes your data. We may suspend accounts that violate these terms.',
  },
  {
    heading: '10. Limitation of Liability',
    body: 'Clauzera AI is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for decisions made based on AI-generated output, including generated document templates.',
  },
  {
    heading: '11. Governing Law',
    body: 'These terms are governed by the laws of India, without regard to conflict-of-law principles.',
  },
  {
    heading: '12. Changes to These Terms',
    body: 'We may update these terms from time to time. Continued use of the app after changes means you accept the updated terms.',
  },
  {
    heading: '13. Contact Us',
    body: 'Questions about these terms can be sent to Support@clauzera.com.',
  },
];

export default function TermsScreen() {
  return (
    <LegalScreen title="Terms of Service" updatedLabel="Last updated: July 2026" sections={SECTIONS} />
  );
}
