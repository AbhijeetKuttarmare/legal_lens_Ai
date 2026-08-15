import { Link } from 'react-router-dom';
import { CrownIcon, StarIcon } from '../icons';

export default function UpgradeGate({ feature }: { feature: string }) {
  return (
    <div className="cw-card" style={{ textAlign: 'center', padding: '56px 32px' }}>
      <div
        style={{
          width: 72,
          height: 72,
          margin: '0 auto 22px',
          borderRadius: 20,
          background: 'radial-gradient(circle, rgba(232,169,61,0.18) 0%, transparent 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--cw-dark-surface-2)',
            border: '1px solid var(--cw-gold-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cw-gold-bright)',
          }}
        >
          <CrownIcon style={{ width: 26, height: 26 }} />
        </div>
      </div>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(232,169,61,0.12)',
          border: '1px solid rgba(232,169,61,0.35)',
          color: 'var(--cw-gold-bright)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.03em',
          padding: '4px 12px',
          borderRadius: 999,
          marginBottom: 16,
        }}
      >
        <StarIcon style={{ width: 12, height: 12 }} /> PRO FEATURE
      </span>

      <div style={{ fontWeight: 800, color: 'var(--cw-dark-text)', fontSize: 19, marginBottom: 8 }}>
        {feature} is a Pro feature
      </div>
      <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5, marginBottom: 24, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        Upgrade to Pro or Enterprise to unlock {feature.toLowerCase()}, along with unlimited uploads and priority
        support.
      </p>
      <Link
        to="/app/subscription"
        className="cw-btn cw-btn-gold"
        style={{ display: 'inline-flex', width: 'auto', padding: '12px 26px', textDecoration: 'none' }}
      >
        <CrownIcon style={{ width: 16, height: 16 }} /> View Plans
      </Link>
    </div>
  );
}
