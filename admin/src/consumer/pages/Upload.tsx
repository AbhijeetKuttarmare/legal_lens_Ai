import { ChangeEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, uploadDocument } from '../api';
import { CameraIcon, DocumentIcon, FolderIcon, GlobeIcon, LockIcon, ShieldIcon, UploadIcon } from '../../icons';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const report = await uploadDocument(file, language);
      navigate(`/app/report/${report.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  if (uploading) {
    return (
      <div className="cw-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div className="cw-spinner" style={{ margin: '0 auto 20px' }} />
        <div style={{ fontWeight: 700, color: 'var(--cw-dark-text)', marginBottom: 6 }}>Analyzing your document</div>
        <div style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5 }}>
          Extracting text and analyzing with Clauzera. This can take up to a minute…
        </div>
      </div>
    );
  }

  return (
    <div className="cw-container cw-container-narrow">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Upload a Document
      </div>
      <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5, marginTop: -6, marginBottom: 22 }}>
        We'll explain it in plain language and flag anything risky before you sign.
      </p>

      {error && <div className="cw-error">{error}</div>}

      <div className="cw-field-label" style={{ color: 'var(--cw-dark-text)' }}>
        Explain the analysis in:
      </div>
      <div className="cw-lang-row">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`cw-lang-chip${language === lang.code ? ' active' : ''}`}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.code === 'en' && <GlobeIcon />}
            {lang.label}
          </button>
        ))}
      </div>

      <div className="cw-upload-option" onClick={() => fileInputRef.current?.click()}>
        <div className="cw-upload-option-main">
          <div className="cw-upload-icon">
            <DocumentIcon />
          </div>
          <div>
            <div className="cw-action-title">Choose PDF / DOCX</div>
            <div className="cw-action-sub">From your computer · Max file size: 20MB</div>
          </div>
        </div>
        <button type="button" className="cw-btn cw-btn-outline" style={{ width: 'auto', padding: '10px 18px' }}>
          <FolderIcon style={{ width: 15, height: 15 }} /> Browse Files
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="cw-upload-option" onClick={() => imageInputRef.current?.click()}>
        <div className="cw-upload-option-main">
          <div className="cw-upload-icon">
            <CameraIcon />
          </div>
          <div>
            <div className="cw-action-title">Upload a Photo</div>
            <div className="cw-action-sub">JPG / PNG · Scan of a physical document</div>
          </div>
        </div>
        <button type="button" className="cw-btn cw-btn-outline" style={{ width: 'auto', padding: '10px 18px' }}>
          <UploadIcon style={{ width: 15, height: 15 }} /> Choose Photo
        </button>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="cw-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div className="cw-stat-icon" style={{ marginBottom: 0 }}>
            <ShieldIcon />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--cw-dark-text)', fontSize: 13.5 }}>Your data is 100% secure and confidential</div>
            <div style={{ color: 'var(--cw-dark-text-muted)', fontSize: 12 }}>We use bank-level encryption to protect your documents and data.</div>
          </div>
        </div>
        <span className="cw-status-pill cw-status-ready" style={{ whiteSpace: 'nowrap' }}>
          <LockIcon style={{ width: 11, height: 11 }} /> 256-bit Encrypted
        </span>
      </div>
    </div>
  );
}
