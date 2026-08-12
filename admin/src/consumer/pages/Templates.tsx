import { useEffect, useState } from 'react';
import { ApiError, generateTemplate, listTemplateTypes } from '../api';
import type { TemplateTypeOption } from '../types';
import { exportPlainTextPdf } from '../exportPdf';
import { AlertIcon, DocumentIcon } from '../../icons';

const FIELD_SETS: Record<string, string[]> = {
  RENTAL_AGREEMENT: ['Landlord Name', 'Tenant Name', 'Property Address', 'Monthly Rent', 'Security Deposit', 'Lease Start Date', 'Lease Duration'],
  NDA: ['Disclosing Party', 'Receiving Party', 'Purpose of Disclosure', 'Effective Date', 'Duration'],
  FREELANCE_CONTRACT: ['Client Name', 'Freelancer Name', 'Scope of Work', 'Payment Amount', 'Payment Terms', 'Start Date'],
};

export default function Templates() {
  const [types, setTypes] = useState<TemplateTypeOption[] | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

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
  }

  async function onGenerate() {
    if (!selectedType) return;
    setError(null);
    setContent(null);
    setLoading(true);
    try {
      const res = await generateTemplate(selectedType, fields);
      setContent(res.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate this document.');
    } finally {
      setLoading(false);
    }
  }

  function onDownload() {
    if (!content || !selectedType) return;
    const label = types?.find((t) => t.key === selectedType)?.label || 'Document';
    exportPlainTextPdf(`LegalLensAI-${selectedType}`, label, content);
  }

  const activeFields = selectedType ? FIELD_SETS[selectedType] || [] : [];

  return (
    <div className="cw-container cw-container-narrow">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Document Templates
      </div>
      <p style={{ color: '#6B7280', fontSize: 13.5, marginTop: -6, marginBottom: 22 }}>
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
          lawyer before you sign or use it.
        </span>
      </div>

      {error && <div className="cw-error">{error}</div>}

      {!selectedType && (
        <div className="cw-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
          <button className="cw-link-btn" style={{ marginBottom: 12, padding: 0 }} onClick={() => selectType('')}>
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
          <button className="cw-btn cw-btn-gold" onClick={onGenerate} disabled={loading}>
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
              color: '#1F2937',
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
            <button className="cw-btn cw-btn-outline" onClick={() => setContent(null)}>
              Edit Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
