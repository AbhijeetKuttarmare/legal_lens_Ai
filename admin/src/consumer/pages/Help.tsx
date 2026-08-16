import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChatIcon, ClipboardIcon, CreditCardIcon, DocumentIcon, GridIcon, TagIcon } from '../../icons';

const SUPPORT_EMAIL = 'support@legallensai.app';

const FAQS = [
  {
    q: 'How do I sign in?',
    a: "Clauzera AI uses your phone number to sign in. Enter your number, and we'll send a one-time password (OTP) via SMS to verify it — no password needed.",
  },
  {
    q: 'What file types can I upload?',
    a: 'You can upload PDF and DOCX files, or upload a photo of a printed document — Clauzera can read text directly from photos.',
  },
  {
    q: 'Is my document data secure?',
    a: 'Yes. Your documents are transmitted over encrypted connections and only used to generate the analysis shown to you. You can delete any document, or your entire account and all its data, at any time.',
  },
  {
    q: 'What does the Free plan include?',
    a: 'The Free plan includes 1 document, Clauzera summaries, and document history. Upgrade to Pro for unlimited uploads and full features from the Subscription page.',
  },
  {
    q: 'How do I delete a document?',
    a: 'Open My Documents, and click Delete on the document you want to remove.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile & Settings and click Delete Account. This permanently removes your profile and all uploaded documents — this cannot be undone.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. Clauzera AI explains documents in plain English and flags things worth asking about, but it is not a substitute for a qualified lawyer. Always get professional advice before signing anything important.',
  },
];

const QUICK_LINKS = [
  { to: '/app/upload', label: 'Upload & Analyze', icon: DocumentIcon },
  { to: '/app/documents', label: 'My Documents', icon: ClipboardIcon },
  { to: '/app/compare', label: 'Compare Documents', icon: GridIcon },
  { to: '/app/templates', label: 'Templates', icon: TagIcon },
  { to: '/app/subscription', label: 'Subscription & Billing', icon: CreditCardIcon },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="cw-container">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Help & Support
      </div>

      <div className="cw-two-col">
        <div>
          <div className="cw-section-title" style={{ marginTop: 0 }}>
            Frequently Asked Questions
          </div>
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q} className="cw-card" style={{ cursor: 'pointer' }} onClick={() => setOpenIndex(isOpen ? null : idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: isOpen ? 'var(--cw-gold-bright)' : 'white', fontSize: 13.5 }}>{item.q}</span>
                  <span style={{ color: 'var(--cw-dark-text-muted)' }}>{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && <p style={{ color: 'var(--cw-dark-text)', fontSize: 13, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>{item.a}</p>}
              </div>
            );
          })}
        </div>

        <div>
          <a
            className="cw-side-card"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', marginBottom: 20 }}
            href={`mailto:${SUPPORT_EMAIL}?subject=Clauzera AI Support`}
          >
            <div className="cw-action-icon" style={{ margin: 0 }}>
              <ChatIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cw-action-title">Email us</div>
              <div className="cw-action-sub" style={{ wordBreak: 'break-all' }}>{SUPPORT_EMAIL}</div>
            </div>
          </a>

          <div className="cw-side-card">
            <div className="cw-side-card-title">Quick Links</div>
            {QUICK_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="cw-side-link-row">
                <link.icon />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
