import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, setStoredUser, updateProfile } from '../api';
import { ShieldIcon } from '../../icons';
import OccupationPicker from '../OccupationPicker';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [occupation, setOccupation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  const isValidDob =
    day.length > 0 &&
    month.length > 0 &&
    year.length === 4 &&
    dayNum >= 1 &&
    dayNum <= 31 &&
    monthNum >= 1 &&
    monthNum <= 12 &&
    yearNum >= 1900 &&
    yearNum <= new Date().getFullYear();
  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0 && isValidDob;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError('Please fill in your name and a valid date of birth.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const updatedUser = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dob,
        occupation: occupation || undefined,
      });
      setStoredUser(updatedUser);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cw cw-auth-page">
      <div className="cw-auth-card">
        <div className="cw-auth-brand">
          <div className="cw-auth-mark">
            <ShieldIcon />
          </div>
          <div className="cw-auth-title">Complete your profile</div>
          <div className="cw-auth-sub">Just a few details before you get started.</div>
        </div>

        {error && <div className="cw-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="cw-input-plain"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="cw-input-plain"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <label className="cw-field-label">Gender</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                className="cw-lang-chip"
                style={gender === g ? { background: '#0B1220', borderColor: '#0B1220', color: '#B08D57' } : undefined}
                onClick={() => setGender(g)}
              >
                {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
              </button>
            ))}
          </div>

          <label className="cw-field-label">Date of birth</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center', flex: '1 1 0', minWidth: 0 }}
              placeholder="DD"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            />
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center', flex: '1 1 0', minWidth: 0 }}
              placeholder="MM"
              value={month}
              onChange={(e) => setMonth(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            />
            <input
              className="cw-input-plain"
              style={{ textAlign: 'center', flex: '1.4 1 0', minWidth: 0 }}
              placeholder="YYYY"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            />
          </div>

          <label className="cw-field-label">
            Occupation <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
          </label>
          <div style={{ marginBottom: 16 }}>
            <OccupationPicker value={occupation} onChange={setOccupation} />
          </div>

          <button type="submit" className="cw-btn cw-btn-gold" disabled={loading || !isValid} style={{ marginTop: 12 }}>
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
