import { Link } from 'react-router-dom';
import { CreditCardIcon } from '../icons';

export default function UpgradeGate({ feature }: { feature: string }) {
  return (
    <div className="cw-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
      <div
        className="cw-action-icon"
        style={{ margin: '0 auto 16px', width: 52, height: 52, background: '#F3F4F6' }}
      >
        <CreditCardIcon style={{ width: 24, height: 24 }} />
      </div>
      <div style={{ fontWeight: 700, color: '#0B1220', fontSize: 16, marginBottom: 6 }}>
        {feature} is a Pro feature
      </div>
      <p style={{ color: '#6B7280', fontSize: 13.5, marginBottom: 20, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
        Upgrade to Pro or Enterprise to unlock {feature.toLowerCase()}, along with unlimited uploads and priority
        support.
      </p>
      <Link to="/app/subscription" className="cw-btn cw-btn-gold" style={{ display: 'inline-flex', width: 'auto', padding: '12px 26px', textDecoration: 'none' }}>
        View Plans
      </Link>
    </div>
  );
}
