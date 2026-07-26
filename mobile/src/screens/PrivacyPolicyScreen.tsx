import React from 'react';
import LegalScreen from '../components/LegalScreen';

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'LegalLens AI ("we", "us", "our") provides an app that uses artificial intelligence to explain legal and business documents in plain English. This policy explains what information we collect, how we use it, and the choices you have.',
  },
  {
    heading: '2. Information We Collect',
    body: 'Phone number (for sign-in via SMS OTP), name, gender, and date of birth (from your profile), the documents you upload and the text extracted from them, and basic usage data such as document status and timestamps.',
  },
  {
    heading: '3. How We Use Your Information',
    body: 'To verify your identity via OTP, to analyze the documents you upload (summary, risk flags, clause extraction, and chat answers) using a third-party AI provider, to enforce plan limits (e.g. the Free plan\'s 1-document limit), and to operate and improve the app.',
  },
  {
    heading: '4. AI Processing of Your Documents',
    body: 'When you upload a document, its text (or, for photos/scans, the image itself) is sent to our AI provider, Anthropic (maker of Claude), solely to generate the analysis shown to you. We do not use your documents to train any AI model.',
  },
  {
    heading: '5. Third-Party Services',
    body: 'We use 2Factor.in to deliver SMS OTP codes for sign-in, and Anthropic to power document analysis and chat. These providers process the minimum data needed to perform their function (your phone number, or your document text/image) and are bound by their own privacy terms.',
  },
  {
    heading: '6. Data Retention & Deletion',
    body: 'Your documents and profile data are kept until you delete them. You can delete an individual document at any time from the Documents list. You can permanently delete your entire account and all associated data from Profile > Delete Account — this action is immediate and cannot be undone.',
  },
  {
    heading: '7. Data Sharing',
    body: 'We do not sell your personal data. We only share data with the service providers named above, to the extent needed to provide the app\'s functionality.',
  },
  {
    heading: '8. Security',
    body: 'We use industry-standard measures including encrypted network connections and token-based authentication to protect your data. No method of transmission or storage is 100% secure, but we work to protect your information.',
  },
  {
    heading: '9. Children\'s Privacy',
    body: 'LegalLens AI is not directed at children under 18 and we do not knowingly collect data from them.',
  },
  {
    heading: '10. Changes to This Policy',
    body: 'We may update this policy from time to time. Material changes will be reflected with an updated "last updated" date in the app.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have questions about this policy or your data, contact us at support@legallensai.app.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen title="Privacy Policy" updatedLabel="Last updated: July 2026" sections={SECTIONS} />
  );
}
