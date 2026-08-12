import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, clearSession, deleteAccount, getStoredUser, setStoredUser, updateProfile } from '../api';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function Profile() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const existingDob = user?.dob ? new Date(user.dob) : null;

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [gender, setGender] = useState<Gender>((user?.gender as Gender) || 'MALE');
  const [day, setDay] = useState(existingDob ? String(existingDob.getDate()) : '');
  const [month, setMonth] = useState(existingDob ? String(existingDob.getMonth() + 1) : '');
  const [year, setYear] = useState(existingDob ? String(existingDob.getFullYear()) : '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    day.length > 0 &&
    month.length > 0 &&
    year.length === 4;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const updated = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), gender, dob });
      setStoredUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAccount() {
    if (!window.confirm('Delete your account? This permanently removes your profile and all documents. This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? This is your last chance to cancel.')) return;
    setDeleting(true);
    try {
      await deleteAccount();
      clearSession();
      navigate('/app/login', { replace: true });
    } catch {
      setError('Could not delete account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="cw-container cw-container-narrow">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Profile & Settings
      </div>

      {error && <div className="cw-error">{error}</div>}
      {saved && (
        <div style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 12.5, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
          Profile updated.
        </div>
      )}

      <div className="cw-card">
        <div className="cw-field-label" style={{ marginBottom: 4 }}>
          Phone
        </div>
        <div style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>{user?.phone ? `+91 ${user.phone}` : '—'}</div>

        <form onSubmit={onSave}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="cw-input-plain" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="cw-input-plain" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <label className="cw-field-label">Gender</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                className="cw-lang-chip"
                style={gender === g ? { background: '#0B1220', borderColor: '#0B1220', color: '#D4AF37' } : undefined}
                onClick={() => setGender(g)}
              >
                {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
              </button>
            ))}
          </div>

          <label className="cw-field-label">Date of birth</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center' }}
              placeholder="DD"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            />
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center' }}
              placeholder="MM"
              value={month}
              onChange={(e) => setMonth(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            />
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center', flex: 1.4 }}
              placeholder="YYYY"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            />
          </div>

          <button type="submit" className="cw-btn cw-btn-gold" disabled={saving || !isValid}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="cw-card" style={{ borderColor: '#FCA5A5' }}>
        <div className="cw-card-title" style={{ color: '#DC2626', marginBottom: 6 }}>
          Delete Account
        </div>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 14 }}>
          Permanently removes your profile and all uploaded documents. This cannot be undone.
        </p>
        <button className="cw-btn cw-btn-outline" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={onDeleteAccount} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
