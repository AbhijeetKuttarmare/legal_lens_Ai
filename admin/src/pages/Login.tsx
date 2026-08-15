import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, login, requestOtp, setIdentity, setToken, verifyOtp } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function friendlyError(err: unknown) {
    if (err instanceof ApiError) return err.message;
    return 'Something went wrong. Please try again.';
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken, user } = await login(email, password);
      setToken(accessToken);
      setIdentity(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
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
      setIdentity(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="mark"><img src="/logo.png" alt="Clauzera AI" /></div>
          <div>
            <div className="title">Clauzera AI</div>
            <div className="subtitle">Admin console</div>
          </div>
        </div>

        <div className="login-tabs">
          <span
            className={method === 'phone' ? 'active' : ''}
            onClick={() => {
              setMethod('phone');
              setError(null);
            }}
          >
            Phone
          </span>
          <span
            className={method === 'email' ? 'active' : ''}
            onClick={() => {
              setMethod('email');
              setError(null);
            }}
          >
            Email
          </span>
        </div>

        {error && <div className="error-text">{error}</div>}

        {method === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp}>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {method === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </button>
          </form>
        )}

        {method === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
