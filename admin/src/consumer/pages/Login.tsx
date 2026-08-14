import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, requestOtp, setStoredUser, setToken, verifyOtp } from '../api';
import { ShieldIcon } from '../../icons';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function friendlyError(err: unknown) {
    if (err instanceof ApiError) return err.message;
    return 'Something went wrong. Please try again.';
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken, user } = await verifyOtp(phone, code);
      setToken(accessToken);
      setStoredUser(user);
      navigate(user.profileComplete ? '/app' : '/app/complete-profile', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setCode('');
    try {
      await requestOtp(phone);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="cw cw-auth-page">
      <div className="cw-auth-card">
        <div className="cw-auth-brand">
          <div className="cw-auth-mark">
            <ShieldIcon />
          </div>
          <div className="cw-auth-title">Clauzera AI</div>
          <div className="cw-auth-sub">Understand. Analyze. Empower.</div>
        </div>

        {error && <div className="cw-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <label className="cw-field-label">Mobile Number</label>
            <div className="cw-phone-row">
              <span className="cw-phone-code">🇮🇳 +91</span>
              <div className="cw-phone-divider" />
              <input
                className="cw-input"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                required
              />
            </div>
            <button type="submit" className="cw-btn cw-btn-navy" disabled={loading || phone.length !== 10}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label className="cw-field-label">Enter verification code sent to +91 {phone}</label>
            <input
              className="cw-input-plain cw-otp-input"
              type="text"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
            <button type="submit" className="cw-btn cw-btn-gold" disabled={loading || code.length < 4}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <div className="cw-link-row">
              <button type="button" className="cw-link-btn" onClick={() => setOtpSent(false)}>
                Change number
              </button>
              <button type="button" className="cw-link-btn" onClick={handleResend}>
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="cw-disclaimer">
          By continuing, you agree to our Terms of Service and Privacy Policy. This app provides
          informational document explanations, not professional legal advice.
        </p>
      </div>
    </div>
  );
}
