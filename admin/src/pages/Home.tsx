import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertIcon,
  ArrowRightIcon,
  CameraIcon,
  ChatIcon,
  CheckIcon,
  ClipboardIcon,
  DocumentIcon,
  GlobeIcon,
  ScaleIcon,
  ShieldIcon,
} from '../icons';
import Hero3D from './Hero3D';
import CircuitLines from './CircuitLines';
import './Home.css';

const LEGAL_BASE = 'https://legallens-backend-twbd.onrender.com';

const LANGUAGES = [
  'English',
  'हिन्दी',
  'தமிழ்',
  'తెలుగు',
  'বাংলা',
  'मराठी',
  'ગુજરાતી',
  'ಕನ್ನಡ',
  'മലയാളം',
  'ਪੰਜਾਬੀ',
  'اردو',
];

const SERVICES = [
  {
    icon: DocumentIcon,
    title: 'Document Analysis',
    body: 'Upload any contract or agreement and get a complete plain-language breakdown of what it means.',
  },
  {
    icon: AlertIcon,
    title: 'Risk & Clause Detection',
    body: 'We scan every clause and flag terms that could work against you — before you sign anything.',
  },
  {
    icon: ChatIcon,
    title: 'Legal Q&A Chat',
    body: 'Ask anything about your document in plain language and get a straight, contextual answer.',
  },
  {
    icon: CameraIcon,
    title: 'Document Scanning',
    body: 'No PDF? Scan a physical document with your camera and get the same instant analysis.',
  },
];

const FEATURES = [
  {
    icon: DocumentIcon,
    title: 'Plain-language summaries',
    body: 'Upload a PDF, DOCX, or scan with your camera. Get a clear summary of what the document actually says, no legal jargon.',
  },
  {
    icon: AlertIcon,
    title: 'Risk detection',
    body: 'Our AI flags clauses that could work against you before you sign — penalty terms, lock-ins, unusual liabilities.',
  },
  {
    icon: ClipboardIcon,
    title: 'Clause extraction & comparison',
    body: 'Key terms pulled out automatically, so you know exactly what you’re agreeing to at a glance.',
  },
  {
    icon: ChatIcon,
    title: 'Ask follow-up questions',
    body: 'Chat with your document. "Can I resign anytime?" "Will I lose my deposit?" Get straight answers, in context.',
  },
  {
    icon: GlobeIcon,
    title: '11 Indian languages',
    body: 'Explanations in English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure by default',
    body: 'Encrypted in transit, deletable anytime. Your documents are never used to train any AI model.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Upload or scan',
    body: 'Add a PDF, DOCX, or snap a photo of a physical document with your camera.',
  },
  {
    n: '02',
    title: 'AI reads it for you',
    body: 'Clauzera analyzes the full document in seconds — summary, risks, and key clauses.',
  },
  {
    n: '03',
    title: 'Understand & ask',
    body: 'Read the plain-language breakdown, then chat to ask anything else about it.',
  },
];

const USE_CASES = [
  { title: 'Job offer letters', body: 'Notice periods, non-competes, PF terms — know what you’re signing before your first day.' },
  { title: 'Rental agreements', body: 'Deposit rules, lock-in periods, maintenance clauses, explained before you commit.' },
  { title: 'Freelance & business contracts', body: 'Payment terms, IP ownership, termination clauses — clarity before you countersign.' },
  { title: 'Everyday paperwork', body: 'Loan agreements, insurance policies, terms you’re asked to accept — understood in seconds.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    features: ['3 documents', 'AI summary', 'Document history'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    features: [
      'Unlimited uploads',
      'Unlimited AI chat',
      'Risk detection',
      'Clause comparison',
      'Multi-language support',
      'Export PDF report',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'Team accounts', 'Dedicated support'],
    cta: 'Contact us',
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'Is Clauzera AI a substitute for a lawyer?',
    a: 'No. Clauzera AI is an informational tool that helps you understand a document faster. For important legal decisions, always consult a qualified lawyer.',
  },
  {
    q: 'What kinds of documents can I upload?',
    a: 'Any PDF or DOCX — employment contracts, rental agreements, freelance contracts, partnership deeds, and more. You can also scan a physical document with your camera.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Your documents are encrypted in transit, only processed to generate your analysis, and never used to train any AI model. You can delete any document, or your whole account, at any time.',
  },
  {
    q: 'Which languages are supported?',
    a: 'English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.',
  },
  {
    q: 'How much does it cost?',
    a: 'Free to start with 3 documents. Pro is ₹299/month for unlimited uploads and full features. Enterprise plans are available for teams.',
  },
];

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' reveal-in' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <span className="faq-toggle">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

export default function Home() {
  return (
    <div className="site">
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="#top" className="brand">
            <span className="brand-mark">
              <ScaleIcon className="brand-mark-icon" />
            </span>
            <span className="brand-name">
              Clauzera <span className="accent-gold">AI</span>
            </span>
          </a>
          <nav className="site-nav-links">
            <a href="#top">Home</a>
            <a href="#services">Services</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="/app/login" className="nav-login">
            Log in
          </a>
          <a href="#get-app" className="nav-cta">
            Get the App
          </a>
        </div>
      </header>

      <main>
        <section id="top" className="hero">
          <CircuitLines />
          <div className="hero-decoration" aria-hidden="true" />

          <div className="hero-inner hero-columns">
            <div className="hero-text">
              <div className="hero-badge hero-anim hero-anim-1">
                <ShieldIcon className="hero-badge-icon" />
                AI-powered document analysis
              </div>
              <h1 className="hero-anim hero-anim-2">
                Understand any document
                <br />
                <span className="accent-gold shimmer-text">before you sign it.</span>
              </h1>
              <p className="hero-sub hero-anim hero-anim-3">
                Upload a contract, offer letter, or agreement. Clauzera AI explains it in plain
                language, flags what’s risky, and answers your questions — in 11 Indian
                languages.
              </p>
              <div className="hero-actions hero-anim hero-anim-4">
                <a href="#get-app" className="btn btn-primary">
                  Get the App <ArrowRightIcon className="btn-icon" />
                </a>
                <a href="#how-it-works" className="btn btn-ghost">
                  See how it works
                </a>
              </div>
              <div className="hero-trust hero-anim hero-anim-5">
                <span>
                  <CheckIcon className="hero-trust-icon" /> No legal jargon
                </span>
                <span>
                  <CheckIcon className="hero-trust-icon" /> Results in seconds
                </span>
                <span>
                  <CheckIcon className="hero-trust-icon" /> Your data stays yours
                </span>
              </div>
            </div>

            <div className="hero-3d-wrap hero-anim hero-anim-6">
              <div className="hero-3d-canvas">
                <Hero3D />
              </div>

              <div className="float-badge float-badge-1">
                <AlertIcon className="float-badge-icon float-badge-icon-warn" />
                Risk flagged
              </div>
              <div className="float-badge float-badge-2">
                <ClipboardIcon className="float-badge-icon" />
                Clause extracted
              </div>
              <div className="float-badge float-badge-3">
                <CheckIcon className="float-badge-icon float-badge-icon-ok" />
                AI analyzed
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow">Our Services</span>
              <h2>What Clauzera AI does for you</h2>
            </Reveal>
            <div className="service-grid">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <div className="service-card">
                    <span className="service-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="service-icon">
                      <s.icon className="service-icon-svg" />
                    </span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section section-alt">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow">How it works</span>
              <h2>From confusing document to clear answer in three steps</h2>
            </Reveal>
            <div className="steps-row">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 110}>
                  <div className="step-card">
                    <span className="step-n">{s.n}</span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow">Features</span>
              <h2>Everything you need to read a document with confidence</h2>
            </Reveal>
            <div className="feature-grid">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="feature-card">
                    <span className="feature-icon">
                      <f.icon className="feature-icon-svg" />
                    </span>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow">Use cases</span>
              <h2>Built for the documents you actually deal with</h2>
            </Reveal>
            <div className="usecase-grid">
              {USE_CASES.map((u, i) => (
                <Reveal key={u.title} delay={i * 70}>
                  <div className="usecase-card">
                    <h3>{u.title}</h3>
                    <p>{u.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow eyebrow-light">Multi-language</span>
              <h2 className="light-heading">Explained in the language you think in</h2>
              <p className="light-sub">
                Not just translated — explained clearly, in the language you’re most
                comfortable with.
              </p>
            </Reveal>
            <Reveal delay={120} className="lang-chips">
              {LANGUAGES.map((l) => (
                <span key={l} className="lang-chip">
                  {l}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="section-inner">
            <Reveal className="section-heading">
              <span className="eyebrow">Pricing</span>
              <h2>Simple plans, no surprises</h2>
            </Reveal>
            <div className="pricing-grid">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 100}>
                  <div className={`price-card${p.highlight ? ' price-card-highlight' : ''}`}>
                    {p.highlight && <span className="price-badge">Most popular</span>}
                    <h3>{p.name}</h3>
                    <div className="price-value">
                      {p.price}
                      <span className="price-period">{p.period}</span>
                    </div>
                    <ul className="price-features">
                      {p.features.map((f) => (
                        <li key={f}>
                          <CheckIcon className="price-check" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href="#get-app" className={`btn ${p.highlight ? 'btn-white' : 'btn-outline'} price-cta`}>
                      {p.cta}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section section-alt">
          <div className="section-inner section-inner-narrow">
            <Reveal className="section-heading">
              <span className="eyebrow">FAQ</span>
              <h2>Common questions</h2>
            </Reveal>
            <div className="faq-list">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <FaqItem q={f.q} a={f.a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="get-app" className="section cta-section">
          <Reveal className="section-inner cta-inner">
            <span className="cta-icon-wrap cta-icon-pulse">
              <CameraIcon className="cta-icon" />
            </span>
            <h2>Stop signing documents you don’t fully understand</h2>
            <p>Get Clauzera AI and know exactly what you’re agreeing to, every time.</p>
            <div className="cta-actions">
              <a
                className="btn btn-gold"
                href="https://apps.apple.com/"
                target="_blank"
                rel="noreferrer"
              >
                Download on iOS
              </a>
              <a
                className="btn btn-outline-light"
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
              >
                Get it on Android
              </a>
            </div>
            <p className="cta-note">Free to start &middot; No credit card required</p>
            <p className="cta-login-note">
              Already have an account? <a href="/app/login">Log in on the web</a>
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-mark brand-mark-sm">
              <ScaleIcon className="brand-mark-icon" />
            </span>
            <span className="brand-name">
              Clauzera <span className="accent-gold">AI</span>
            </span>
          </div>
          <div className="footer-links">
            <a href={`${LEGAL_BASE}/privacy-policy`} target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            <a href={`${LEGAL_BASE}/terms-of-service`} target="_blank" rel="noreferrer">
              Terms of Service
            </a>
            <a href={`${LEGAL_BASE}/delete-account`} target="_blank" rel="noreferrer">
              Delete Account
            </a>
            <a href="mailto:support@legallensai.app">Support</a>
          </div>
          <p className="footer-disclaimer">
            Clauzera AI provides informational explanations, not professional legal advice.
            Consult a qualified lawyer for important decisions.
          </p>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Clauzera AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
