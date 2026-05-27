import React, { useEffect, useMemo, useState } from 'react';
import './MonitoringPage.css';
import { buildEmptyMonitoringData, getMonitoringData } from '../../services/monitoringService';
import { buildMeasurementCards } from '../../utils/monitoring';
import DeviceStatusCard from '../../components/common/DeviceStatusCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.2 9.1 4 4 0 0 0 7 19h10.5Z" />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function EnvironmentalCard({ card, onClick }) {
  const isWarning = Boolean(card.warning);

  return (
    <button
      type="button"
      className={`metric-card metric-card--${card.theme} ${isWarning ? 'metric-card--warning' : ''}`}
      onClick={() => onClick(card)}
    >
      <div className="metric-card__top">
        <div className={`metric-card__icon metric-card__icon--${card.theme}`}>
          {card.theme === 'co2' && <CloudIcon />}
          {card.theme === 'temperature' && <ThermometerIcon />}
          {card.theme === 'humidity' && <DropletIcon />}
          {card.theme === 'noise' && <VolumeIcon />}
        </div>
        <span className={`metric-card__trend ${isWarning ? 'metric-card__trend--warning' : ''}`}>
          {card.trend || '—'}
        </span>
      </div>

      <div className="metric-card__label">{card.label}</div>

      <div className="metric-card__value-row">
        <span className="metric-card__value">{card.value}</span>
        <span className="metric-card__unit">{card.unit}</span>
      </div>
    </button>
  );
}

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const getItemValue = (key) => {
    const item = payload.find((entry) => entry.dataKey === key);
    return item ? item.value : '—';
  };

  return (
    <div
      style={{
        background: 'var(--chart-tooltip-bg)',
        border: '1px solid var(--chart-tooltip-border)',
        borderRadius: '14px',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
        padding: '12px 14px',
        minWidth: '150px',
      }}
    >
      <div style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '8px' }}>{label}</div>
      <div style={{ color: '#f59e0b', marginBottom: '6px' }}>CO₂ (ppm) : {getItemValue('co2')}</div>
      <div style={{ color: '#3b82f6', marginBottom: '6px' }}>Temperature (°C) : {getItemValue('temp')}</div>
      <div style={{ color: '#22c55e', marginBottom: '6px' }}>Humidity (%) : {getItemValue('humidity')}</div>
      <div style={{ color: '#8b5cf6' }}>Noise (dB) : {getItemValue('noise')}</div>
    </div>
  );
}

function HistoryChartCard({ chartData = [] }) {
  const data = chartData;

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Measurement History</h3>
        <select className="dashboard-select" defaultValue="24h">
          <option value="24h">Last 24 Hours</option>
          <option value="12h">Last 12 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="chart-recharts-wrap">
        {data.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 10, right: 42, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="time" stroke="var(--chart-axis)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={{ stroke: 'var(--chart-axis)' }} />
              <YAxis yAxisId="co2" stroke="#f59e0b" tick={{ fontSize: 12, fill: '#f59e0b' }} tickLine={false} axisLine={{ stroke: '#f59e0b' }} width={46} />
              <YAxis yAxisId="env" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 12, fill: '#8b5cf6' }} tickLine={false} axisLine={{ stroke: '#8b5cf6' }} width={42} domain={[0, 100]} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '13px', color: 'var(--text-secondary)' }} />
              <Line yAxisId="co2" type="monotone" dataKey="co2" stroke="#f59e0b" strokeWidth={3} name="CO₂ (ppm)" dot={false} activeDot={{ r: 5 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} name="Temperature (°C)" dot={false} activeDot={{ r: 4 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} name="Humidity (%)" dot={false} activeDot={{ r: 4 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="noise" stroke="#8b5cf6" strokeWidth={2} name="Noise (dB)" dot={false} activeDot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty-state">No measurements loaded from backend.</div>
        )}
      </div>
    </div>
  );
}

function NotificationsCard({ notifications = [], onOpenNotifications }) {
  const unreadCount = notifications.filter((item) => item.unread).length;
  const visibleNotifications = notifications.slice(0, 2);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Notifications</h3>
        <span
          className="notifications-pill notifications-pill--clickable"
          role="button"
          tabIndex={0}
          onClick={onOpenNotifications}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpenNotifications?.();
            }
          }}
        >
          {unreadCount} New
        </span>
      </div>

      {visibleNotifications.length ? visibleNotifications.map((item) => (
        <div className="notification-item" key={item.id || item._id}>
          <div className={`notification-item__icon ${item.level === 'success' || item.level === 'info' ? 'notification-item__icon--info' : 'notification-item__icon--danger'}`}>
            {item.level === 'success' || item.level === 'info' ? <InfoIcon /> : <AlertTriangleIcon />}
          </div>
          <div>
            <div className="notification-item__title">{item.title}</div>
            <div className="notification-item__time">{item.timestamp}</div>
          </div>
        </div>
      )) : (
        <div className="notification-item">
          <div className="notification-item__icon notification-item__icon--info"><InfoIcon /></div>
          <div>
            <div className="notification-item__title">No active notifications</div>
            <div className="notification-item__time">Backend checked</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeasurementDetailsModal({ card, onClose }) {
  if (!card) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <h3>{card.label}</h3>
        <p>Current value: <strong>{card.value}</strong> {card.unit}</p>
        <p>Trend from previous measurement: <strong>{card.trend || '—'}</strong></p>
        <button type="button" className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function RecommendationsCard({ recommendations = [] }) {
  const items = recommendations.length ? recommendations : [{
    id: 'waiting',
    title: 'Waiting for backend data',
    message: 'Recommendations will appear after measurements are loaded.',
    severity: 'info',
  }];

  const getIcon = (severity) => {
    if (severity === 'success') return '✓';
    if (severity === 'info') return 'i';
    return '!';
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Recommendations</h3>
      </div>

      <div className="recommendations-list">
        {items.map((item) => (
          <div key={item.id || item.title} className={`recommendation-item recommendation-item--${item.severity || 'warning'}`}>
            <div className="recommendation-item__icon">
              {getIcon(item.severity)}
            </div>
            <div>
              <div className="recommendation-item__title">{item.title}</div>
              <div className="recommendation-item__priority">{item.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonitoringPage({ onOpenNotifications, onOpenSensorStatus }) {
  const [monitoringData, setMonitoringData] = useState(() => buildEmptyMonitoringData());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const measurementCards = useMemo(() => buildMeasurementCards(monitoringData), [monitoringData]);

  async function loadMonitoring(showRefreshState = false) {
    try {
      if (showRefreshState) setRefreshing(true);
      else setLoading(true);

      setError('');
      const data = await getMonitoringData();
      setMonitoringData(data);
    } catch (err) {
      console.error(err);
      setError('Data loading failed. Backend values could not be loaded.');
      setMonitoringData(buildEmptyMonitoringData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
    const intervalId = setInterval(() => loadMonitoring(true), 10000);
    return () => clearInterval(intervalId);
  }, []);

  const device = monitoringData.device || {};

  return (
    <div className="monitoring-page monitoring-page--modern">
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="monitoring-section">
        <div className="monitoring-section__header">
          <h2>Current Environmental Values</h2>
          <div className="monitoring-section__meta">
            <span>{loading ? 'Loading...' : `Device: ${device.name || device.apiKey || 'Unknown'}`}</span>
            {refreshing ? <span>Refreshing...</span> : null}
          </div>
        </div>

        <div className="metrics-grid">
          {measurementCards.map((card) => (
            <EnvironmentalCard key={card.id} card={card} onClick={setSelectedCard} />
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__history">
          <HistoryChartCard chartData={monitoringData.history || []} />
        </div>

        <div className="dashboard-grid__device">
          <DeviceStatusCard
            variant="monitoring"
            connectionLabel={device.isOnline ? 'Online' : 'Offline'}
            connectionVariant={device.isOnline ? 'success' : 'danger'}
            healthLabel={device.sensorHealth?.label || 'No data'}
            healthVariant={device.sensorHealth?.variant || 'warning'}
            lastUpdate={device?.lastUpdate || '—'}
            onHealthClick={onOpenSensorStatus}
          />
        </div>

        <div className="dashboard-grid__recommendations">
          <RecommendationsCard recommendations={monitoringData.recommendations?.items || []} />
        </div>

        <div className="dashboard-grid__notifications">
          <NotificationsCard
            notifications={monitoringData.rawNotifications || []}
            onOpenNotifications={onOpenNotifications}
          />
        </div>
      </section>

      <MeasurementDetailsModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
