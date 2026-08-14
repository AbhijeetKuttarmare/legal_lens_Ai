import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, requestOtp, setStoredUser, setToken, verifyOtp } from '../consumer/api';
import { CloseIcon, ShieldIcon } from '../icons';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
      navigate(user.profileComplete ? '/app' : '/app/complete-profile');
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
    <div className="login-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal-card">
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon style={{ width: 16, height: 16 }} />
        </button>

        <div className="login-modal-brand">
          <span className="login-modal-mark">
            <ShieldIcon />
          </span>
          <div className="login-modal-title">Clauzera AI</div>
          <div className="login-modal-sub">Understand. Analyze. Empower.</div>
        </div>

        {error && <div className="login-modal-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <label className="login-modal-label">Mobile Number</label>
            <div className="login-modal-phone-row">
              <span className="login-modal-phone-code">🇮🇳 +91</span>
              <input
                className="login-modal-input login-modal-phone-input"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn-gold login-modal-submit" disabled={loading || phone.length !== 10}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label className="login-modal-label">Enter verification code sent to +91 {phone}</label>
            <input
              className="login-modal-input login-modal-otp-input"
              type="text"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
              required
            />
            <button type="submit" className="btn btn-gold login-modal-submit" disabled={loading || code.length < 4}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <div className="login-modal-link-row">
              <button type="button" className="login-modal-link-btn" onClick={() => setOtpSent(false)}>
                Change number
              </button>
              <button type="button" className="login-modal-link-btn" onClick={handleResend}>
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="login-modal-disclaimer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
