import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

const PAGE_STYLE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; background:#F4F5F9; color:#111827; margin:0; padding:0; }
  .header { background:#0B1220; color:white; padding:32px 20px; }
  .header h1 { margin:0; font-size:24px; }
  .header p { margin:6px 0 0; color:#B7C0D1; font-size:13px; }
  .body { max-width:720px; margin:0 auto; padding:24px 20px 60px; }
  h2 { font-size:16px; color:#0B1220; margin-top:28px; margin-bottom:6px; }
  p { font-size:14px; line-height:1.6; color:#374151; }
`;

function page(title: string, updated: string, sections: { heading: string; body: string }[]) {
  const sectionsHtml = sections
    .map((s) => `<h2>${s.heading}</h2><p>${s.body}</p>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LegalLens AI - ${title}</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>LegalLens AI &middot; Last updated: ${updated}</p>
  </div>
  <div class="body">
    ${sectionsHtml}
  </div>
</body>
</html>`;
}

const PRIVACY_SECTIONS = [
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
    body: "To verify your identity via OTP, to analyze the documents you upload (summary, risk flags, clause extraction, and chat answers) using a third-party AI provider, to enforce plan limits (e.g. the Free plan's 1-document limit), and to operate and improve the app.",
  },
  {
    heading: '4. AI Processing of Your Documents',
    body: 'When you upload a document, its text (or, for photos/scans, the image itself) is sent to our AI provider, Anthropic (maker of Claude), solely to generate the analysis shown to you. We do not use your documents to train any AI model.',
  },
  {
    heading: '5. Third-Party Services',
    body: 'We use 2Factor.in to deliver SMS OTP codes for sign-in, Anthropic to power document analysis and chat, and Razorpay to process subscription payments. These providers process the minimum data needed to perform their function and are bound by their own privacy terms.',
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
    heading: "9. Children's Privacy",
    body: 'LegalLens AI is not directed at children under 18 and we do not knowingly collect data from them.',
  },
  {
    heading: '10. Changes to This Policy',
    body: 'We may update this policy from time to time. Material changes will be reflected with an updated "last updated" date on this page.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have questions about this policy or your data, contact us at support@legallensai.app.',
  },
];

const TERMS_SECTIONS = [
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

const DELETE_ACCOUNT_SECTIONS = [
  {
    heading: 'How to delete your LegalLens AI account',
    body: 'Open the LegalLens AI app and sign in with your phone number. Go to the Profile tab, scroll to the bottom, and tap "Delete Account." Confirm twice when prompted. Your account is deleted immediately — this cannot be undone.',
  },
  {
    heading: "Can't access the app?",
    body: 'If you no longer have access to the app or your phone number, email support@legallensai.app from the email address associated with your request (or include your registered phone number) and ask us to delete your account. We will process the request within 7 days.',
  },
  {
    heading: 'What gets deleted',
    body: 'Deleting your account permanently and immediately removes: your profile information (name, phone number, gender, date of birth), all documents you uploaded, all AI-generated summaries, risk analyses and clause extractions for those documents, and your chat history. None of this data is retained after deletion.',
  },
  {
    heading: 'Deleting individual documents without deleting your account',
    body: 'You do not need to delete your whole account to remove specific documents. Open the Documents tab, tap the three-dot menu on any document, and choose Delete — this removes just that document and its analysis, immediately, while keeping your account active.',
  },
];

@Controller()
@SkipThrottle()
export class LegalController {
  @Get('privacy-policy')
  @Header('Content-Type', 'text/html')
  privacyPolicy() {
    return page('Privacy Policy', 'July 2026', PRIVACY_SECTIONS);
  }

  @Get('terms-of-service')
  @Header('Content-Type', 'text/html')
  termsOfService() {
    return page('Terms of Service', 'July 2026', TERMS_SECTIONS);
  }

  @Get('delete-account')
  @Header('Content-Type', 'text/html')
  deleteAccount() {
    return page('Delete Account', 'July 2026', DELETE_ACCOUNT_SECTIONS);
  }
}
