import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  generateTemplate,
  listTemplateTypes,
  getStoredUser,
  getMe,
  setStoredUser,
  hasFeatureAccess,
  listPersonalTemplates,
  uploadPersonalTemplate,
  generateFromPersonalTemplate,
  deletePersonalTemplate,
} from '../api';
import type { TemplateTypeOption, PersonalTemplateSummary } from '../types';
import { exportPlainTextPdf } from '../exportPdf';
import { AlertIcon, DocumentIcon, UploadIcon } from '../../icons';
import UpgradeGate from '../UpgradeGate';

const FIELD_SETS: Record<string, string[]> = {
  RENTAL_AGREEMENT: ['Landlord Name', 'Tenant Name', 'Property Address', 'Monthly Rent', 'Security Deposit', 'Lease Start Date', 'Lease Duration'],
  RENTAL_AGREEMENT_US: ['Landlord Name', 'Tenant Name', 'Property Address', 'Monthly Rent', 'Security Deposit', 'Lease Start Date', 'Lease Duration', 'State'],
  RENTAL_AGREEMENT_UK: ['Landlord Name', 'Tenant Name', 'Property Address', 'Monthly Rent', 'Deposit Amount', 'Tenancy Start Date', 'Tenancy Duration'],
  NDA: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration'],
  NDA_US: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration', 'Governing State'],
  FREELANCE_CONTRACT: ['Client Name', 'Freelancer Name', 'Scope of Work', 'Payment Amount', 'Payment Terms', 'Start Date'],
  FREELANCE_CONTRACT_US: ['Client Name', 'Contractor Name', 'Scope of Work', 'Payment Amount', 'Payment Terms', 'Start Date', 'Governing State'],
  EMPLOYMENT_OFFER_LETTER: ['Company Name', 'Candidate Name', 'Job Title', 'Annual CTC', 'Joining Date', 'Probation Period', 'Reporting Manager'],
  CONSULTING_AGREEMENT: ['Client Name', 'Consultant Name', 'Scope of Services', 'Fees', 'Payment Terms', 'Start Date', 'Term'],
};

export default function Templates() {
  const [mode, setMode] = useState<'ai' | 'personal'>('ai');

  const [types, setTypes] = useState<TemplateTypeOption[] | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const [user, setUser] = useState(getStoredUser());
  const isPaid = hasFeatureAccess(user, 'templatesTrialUntil');

  useEffect(() => {
    getMe()
      .then((fresh) => {
        setStoredUser(fresh);
        setUser(fresh);
      })
      .catch(() => {});
  }, []);

  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    listTemplateTypes()
      .then(setTypes)
      .catch(() => setError('Could not load template types.'));
  }, []);

  function selectType(key: string) {
    setSelectedType(key);
    setFields({});
    setContent(null);
    setError(null);
    setConsent(false);
    setShowUpgrade(false);
  }

  async function onGenerate() {
    if (!selectedType || !consent) return;
    if (!isPaid) {
      setShowUpgrade(true);
      return;
    }
    setError(null);
    setContent(null);
    setLoading(true);
    try {
      const res = await generateTemplate(selectedType, fields, consent);
      setContent(res.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate this document.');
    } finally {
      setLoading(false);
    }
  }

  function onDownload(fileLabel: string, downloadName: string) {
    if (!content) return;
    exportPlainTextPdf(downloadName, fileLabel, content);
  }

  const activeFields = selectedType ? FIELD_SETS[selectedType] || [] : [];

  return (
    <div className="cw-container cw-container-narrow">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Document Templates
      </div>

      <div className="cw-plan-tabs" style={{ marginBottom: 20 }}>
        <span className={mode === 'ai' ? 'active' : ''} onClick={() => setMode('ai')}>
          AI Templates
        </span>
        <span className={mode === 'personal' ? 'active' : ''} onClick={() => setMode('personal')}>
          My Templates
        </span>
      </div>

      {mode === 'ai' && (
        <AiTemplatesPanel
          types={types}
          selectedType={selectedType}
          selectType={selectType}
          fields={fields}
          setFields={setFields}
          consent={consent}
          setConsent={setConsent}
          loading={loading}
          error={error}
          content={content}
          activeFields={activeFields}
          onGenerate={onGenerate}
          onDownload={() =>
            onDownload(types?.find((t) => t.key === selectedType)?.label || 'Document', `ClauzeraAI-${selectedType}`)
          }
          onEditDetails={() => setContent(null)}
          showUpgrade={showUpgrade}
          onBackFromUpgrade={() => setShowUpgrade(false)}
        />
      )}

      {mode === 'personal' && <PersonalTemplatesPanel isPaid={isPaid} />}
    </div>
  );
}

function AiTemplatesPanel({
  types,
  selectedType,
  selectType,
  fields,
  setFields,
  consent,
  setConsent,
  loading,
  error,
  content,
  activeFields,
  onGenerate,
  onDownload,
  onEditDetails,
  showUpgrade,
  onBackFromUpgrade,
}: {
  types: TemplateTypeOption[] | null;
  selectedType: string;
  selectType: (key: string) => void;
  fields: Record<string, string>;
  setFields: (updater: (f: Record<string, string>) => Record<string, string>) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  content: string | null;
  activeFields: string[];
  onGenerate: () => void;
  onDownload: () => void;
  onEditDetails: () => void;
  showUpgrade: boolean;
  onBackFromUpgrade: () => void;
}) {
  if (showUpgrade) {
    return (
      <>
        <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0, color: 'var(--cw-gold-bright)' }} onClick={onBackFromUpgrade}>
          ← Back to details
        </button>
        <UpgradeGate feature="Document Templates" />
      </>
    );
  }
  return (
    <>
      <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5, marginTop: -6, marginBottom: 22 }}>
        Generate a draft document from a template. This is a starting point, not a final legal document.
      </p>

      <div
        style={{
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          color: '#92400E',
          fontSize: 12.5,
          padding: '12px 14px',
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <AlertIcon style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Draft only — not legal advice.</strong> Every generated document must be reviewed by a qualified
          lawyer before you sign or use it. Each template is drafted for the country shown in its name — laws
          vary by state/region within that country too, so confirm it fits your specific situation.
        </span>
      </div>

      {error && <div className="cw-error">{error}</div>}

      {!selectedType && (
        <div className="cw-actions-grid cw-actions-grid--3">
          {(types || []).map((t) => (
            <button key={t.key} className="cw-action-card" onClick={() => selectType(t.key)}>
              <div className="cw-action-icon">
                <DocumentIcon />
              </div>
              <div className="cw-action-title">{t.label}</div>
              <div className="cw-action-sub">Generate a draft</div>
            </button>
          ))}
        </div>
      )}

      {selectedType && !content && (
        <div className="cw-card">
          <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0, color: 'var(--cw-gold-bright)' }} onClick={() => selectType('')}>
            ← Choose a different template
          </button>
          {activeFields.map((label) => (
            <input
              key={label}
              className="cw-input-plain"
              placeholder={label}
              value={fields[label] || ''}
              onChange={(e) => setFields((f) => ({ ...f, [label]: e.target.value }))}
            />
          ))}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12.5, color: 'var(--cw-dark-text-muted)', lineHeight: 1.5 }}>
              I understand this is a Clauzera-generated draft, not legal advice, and I will have it reviewed by a
              qualified lawyer before signing or using it.
            </span>
          </label>
          <button className="cw-btn cw-btn-gold" onClick={onGenerate} disabled={loading || !consent}>
            {loading ? 'Generating…' : 'Generate Draft'}
          </button>
        </div>
      )}

      {content && (
        <div className="cw-card">
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--cw-dark-text)',
              margin: 0,
              marginBottom: 16,
            }}
          >
            {content}
          </pre>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cw-btn cw-btn-gold" onClick={onDownload}>
              Download as PDF
            </button>
            <button className="cw-btn cw-btn-outline" onClick={onEditDetails}>
              Edit Details
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type PersonalMode = 'list' | 'upload' | 'fill' | 'result' | 'upgrade';

function PersonalTemplatesPanel({ isPaid }: { isPaid: boolean }) {
  const [mode, setMode] = useState<PersonalMode>('list');
  const [templates, setTemplates] = useState<PersonalTemplateSummary[] | null>(null);
  const [active, setActive] = useState<PersonalTemplateSummary | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadList() {
    setLoading(true);
    listPersonalTemplates()
      .then(setTemplates)
      .catch(() => setError('Could not load your templates.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUploadFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const saved = await uploadPersonalTemplate(file, uploadName || undefined);
      setTemplates((prev) => [saved, ...(prev || [])]);
      openFillMode(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not process this document.');
      setMode('list');
    } finally {
      setLoading(false);
    }
  }

  function openFillMode(template: PersonalTemplateSummary) {
    if (!isPaid) {
      setMode('upgrade');
      return;
    }
    setActive(template);
    const initial: Record<string, string> = {};
    for (const f of template.fields) initial[f.key] = f.originalValue;
    setFieldValues(initial);
    setContent(null);
    setMode('fill');
  }

  async function onGenerate() {
    if (!active) return;
    setError(null);
    setLoading(true);
    try {
      const res = await generateFromPersonalTemplate(active.id, fieldValues);
      setContent(res.content);
      setMode('result');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate this document.');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deletePersonalTemplate(id);
      setTemplates((prev) => (prev || []).filter((t) => t.id !== id));
    } catch {
      setError('Could not delete this template.');
    }
  }

  if (mode === 'list') {
    return (
      <>
        <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5, marginTop: -6, marginBottom: 22 }}>
          Save a document you've used before (like your standard NDA or client agreement) as a personal template.
          Next time, just swap in the new names, dates, and amounts instead of starting from scratch.
        </p>

        {error && <div className="cw-error">{error}</div>}

        <button
          className="cw-card"
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%', textAlign: 'left', border: '1.5px dashed var(--cw-dark-border)' }}
          onClick={() => setMode(isPaid ? 'upload' : 'upgrade')}
        >
          <div className="cw-action-icon" style={{ marginBottom: 0 }}>
            <UploadIcon />
          </div>
          <div>
            <div className="cw-action-title">Upload a document to save as a template</div>
            <div className="cw-action-sub">PDF, DOCX, or a photo of a printed document</div>
          </div>
        </button>

        {loading && !templates && <div style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13, marginTop: 16 }}>Loading…</div>}

        {templates && templates.length === 0 && (
          <div style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13, marginTop: 16 }}>
            No personal templates yet — upload one above to get started.
          </div>
        )}

        {templates && templates.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map((t) => (
              <div key={t.id} className="cw-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="cw-action-icon" style={{ marginBottom: 0 }}>
                  <DocumentIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cw-action-title">{t.name}</div>
                  <div className="cw-action-sub">{t.fields.length} fields detected</div>
                </div>
                <button className="cw-btn cw-btn-gold" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => openFillMode(t)}>
                  Use
                </button>
                <button className="cw-link-btn" style={{ color: '#DC2626', padding: 0 }} onClick={() => onDelete(t.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (mode === 'upgrade') {
    return (
      <>
        <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0, color: 'var(--cw-gold-bright)' }} onClick={() => setMode('list')}>
          ← Back
        </button>
        <UpgradeGate feature="Personal Templates" />
      </>
    );
  }

  if (mode === 'upload') {
    return (
      <div className="cw-card">
        <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0, color: 'var(--cw-gold-bright)' }} onClick={() => setMode('list')}>
          ← Back
        </button>
        {error && <div className="cw-error">{error}</div>}
        <input
          className="cw-input-plain"
          placeholder="Name this template (optional) — e.g. Standard NDA"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
          }}
        />
        <button className="cw-btn cw-btn-gold" disabled={loading} onClick={() => fileInputRef.current?.click()}>
          {loading ? 'Analyzing document…' : 'Choose File'}
        </button>
      </div>
    );
  }

  if (mode === 'fill' && active) {
    return (
      <div className="cw-card">
        <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0, color: 'var(--cw-gold-bright)' }} onClick={() => setMode('list')}>
          ← Back to My Templates
        </button>
        <div className="cw-card-title" style={{ marginBottom: 4 }}>
          {active.name}
        </div>
        <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 12.5, marginBottom: 16 }}>
          Update the details below for this new case, then generate. Anything you leave unchanged stays as it was.
        </p>
        {error && <div className="cw-error">{error}</div>}
        {active.fields.length === 0 && (
          <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13 }}>
            No case-specific fields were detected in this document — generating will return it unchanged.
          </p>
        )}
        {active.fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label className="cw-field-label" style={{ color: 'var(--cw-dark-text)' }}>
              {f.label}
            </label>
            <input
              className="cw-input-plain"
              style={{ marginBottom: 0 }}
              value={fieldValues[f.key] ?? ''}
              onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <button className="cw-btn cw-btn-gold" onClick={onGenerate} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Generating…' : 'Generate Document'}
        </button>
      </div>
    );
  }

  if (mode === 'result' && content) {
    return (
      <div className="cw-card">
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--cw-dark-text)',
            margin: 0,
            marginBottom: 16,
          }}
        >
          {content}
        </pre>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="cw-btn cw-btn-gold"
            onClick={() => exportPlainTextPdf(`ClauzeraAI-${active?.name || 'template'}`, active?.name || 'Document', content)}
          >
            Download as PDF
          </button>
          <button className="cw-btn cw-btn-outline" onClick={() => active && openFillMode(active)}>
            Edit Details
          </button>
        </div>
      </div>
    );
  }

  return null;
}
