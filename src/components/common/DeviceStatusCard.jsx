import React from 'react';

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c-4.35-2.67-7-5.78-7-9.5A4.5 4.5 0 0 1 9.5 7c1.14 0 2.16.43 2.5 1.25C12.34 7.43 13.36 7 14.5 7A4.5 4.5 0 0 1 19 11.5c0 3.72-2.65 6.83-7 9.5Z" />
    </svg>
  );
}

function badgeVariant(label, fallback = 'success') {
  const value = String(label || '').toLowerCase();
  if (value.includes('offline') || value.includes('not')) return 'danger';
  if (value.includes('some') || value.includes('check') || value.includes('attention')) return 'warning';
  if (value.includes('online') || value.includes('all') || value.includes('good')) return 'success';
  return fallback;
}

export default function DeviceStatusCard({
  connectionLabel = 'Offline',
  connectionSubtitle = 'Device online status',
  healthLabel = 'No data',
  healthSubtitle = 'Sensor reporting state',
  lastUpdate = '—',
  showHealth = true,
  connectionVariant,
  healthVariant,
  onConnectionClick,
  onHealthClick,
}) {
  const finalConnectionVariant = connectionVariant || badgeVariant(connectionLabel, 'danger');
  const finalHealthVariant = healthVariant || badgeVariant(healthLabel, 'warning');

  const renderBadge = ({ label, variant, onClick }) => {
    const className = `status-badge status-badge--${variant} ${onClick ? 'status-badge--clickable' : ''}`;

    if (!onClick) {
      return <span className={className}>{label}</span>;
    }

    return (
      <span
        className={className}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Device Status</h3>
      </div>

      <div className="status-list">
        <div className="status-item">
          <div className="status-item__left">
            <div className="status-item__icon">
              <WifiIcon />
            </div>
            <div>
              <div className="status-item__title">Connection</div>
              <div className="status-item__subtitle">{connectionSubtitle}</div>
            </div>
          </div>
          {renderBadge({ label: connectionLabel, variant: finalConnectionVariant, onClick: onConnectionClick })}
        </div>

        {showHealth ? (
          <div className="status-item">
            <div className="status-item__left">
              <div className="status-item__icon">
                <HealthIcon />
              </div>
              <div>
                <div className="status-item__title">Sensor Health</div>
                <div className="status-item__subtitle">{healthSubtitle}</div>
              </div>
            </div>
            {renderBadge({ label: healthLabel, variant: finalHealthVariant, onClick: onHealthClick })}
          </div>
        ) : null}

        <div className="status-item">
          <div className="status-item__left">
            <div className="status-item__icon">
              <ClockIcon />
            </div>
            <div>
              <div className="status-item__title">Last Update</div>
              <div className="status-item__subtitle">Latest measurement</div>
            </div>
          </div>
          <span className="status-time">{lastUpdate}</span>
        </div>
      </div>
    </div>
  );
}
