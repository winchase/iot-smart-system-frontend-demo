import React, { useEffect, useMemo, useState } from 'react';
import './HistoryPage.css';
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
import {
  DEFAULT_DEVICE_API,
  buildChartData,
  getCurrentDevice,
  listMeasurements,
  listNotifications,
  formatTime,
} from '../../services/iotApi';
import {
  buildActiveAlertItems,
  getNumber,
  getSensorHealth,
  isDeviceOnline,
  isValidSensorValue,
} from '../../utils/monitoring';

function StatCard({ label, value, unit, trend, trendType }) {
  return (
      <div className="history-stat-card">
        <div className="history-stat-card__label">{label}</div>
        <div className="history-stat-card__value-row">
          <span className="history-stat-card__value">{value}</span>
          <span className="history-stat-card__unit">{unit}</span>
        </div>
        <div className={`history-stat-card__trend history-stat-card__trend--${trendType}`}>
          {trend}
        </div>
      </div>
  );
}

function calculateStats(measurements) {
  const validMeasurements = measurements.filter((item) => isValidSensorValue('co2', item.co2));
  const co2Values = validMeasurements.map((item) => getNumber(item.co2)).filter(Number.isFinite);

  if (!co2Values.length) {
    return {
      avg: '—',
      max: '—',
      min: '—',
      maxTrend: 'No data yet',
      minTrend: 'No data yet',
    };
  }

  const sum = co2Values.reduce((acc, value) => acc + value, 0);
  const max = Math.max(...co2Values);
  const min = Math.min(...co2Values);
  const maxItem = validMeasurements.find((item) => getNumber(item.co2) === max);
  const minItem = validMeasurements.find((item) => getNumber(item.co2) === min);

  return {
    avg: Math.round(sum / co2Values.length),
    max: Math.round(max),
    min: Math.round(min),
    maxTrend: `Peak at ${maxItem?.time || '—'}`,
    minTrend: `Lowest at ${minItem?.time || '—'}`,
  };
}

function AlertSummaryCard({ items }) {
  const visibleItems = items.slice(0, 5);

  return (
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h3>Alert Summary</h3>
        </div>

        <div className="history-alert-list">
          {visibleItems.length ? visibleItems.map((item) => (
              <div key={item.id || item._id || item.title} className={`history-alert-item history-alert-item--${item.level === 'success' ? 'success' : item.level === 'info' ? 'info' : item.level === 'critical' || item.level === 'danger' ? 'danger' : 'warning'}`}>
                <div className="history-alert-item__icon">
                  {item.level === 'success' ? '✓' : item.level === 'info' ? 'i' : '!'}
                </div>
                <div>
                  <div className="history-alert-item__title">{item.title}</div>
                  <div className="history-alert-item__subtitle">{item.message || item.timestamp}</div>
                </div>
              </div>
          )) : (
              <div className="history-alert-item history-alert-item--success">
                <div className="history-alert-item__icon">✓</div>
                <div>
                  <div className="history-alert-item__title">No alerts detected.</div>
                  <div className="history-alert-item__subtitle">Stable conditions</div>
                </div>
              </div>
          )}
        </div>
      </div>
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
        <div style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '8px' }}>
          {label}
        </div>
        <div style={{ color: '#f59e0b', marginBottom: '6px' }}>
          CO₂ (ppm) : {getItemValue('co2')}
        </div>
        <div style={{ color: '#3b82f6', marginBottom: '6px' }}>
          Temperature (°C) : {getItemValue('temp')}
        </div>
        <div style={{ color: '#22c55e', marginBottom: '6px' }}>
          Humidity (%) : {getItemValue('humidity')}
        </div>
        <div style={{ color: '#8b5cf6' }}>
          Noise (dB) : {getItemValue('noise')}
        </div>
      </div>
  );
}

function HistoryChartCardLarge({ data }) {
  return (
      <div className="dashboard-card">
        <div className="dashboard-card__header">
          <h3>Environmental Trend Chart</h3>
          <select className="dashboard-select" defaultValue="24h">
            <option value="24h">Last 24 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        <div className="history-chart-wrap">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#9ca3af' }} />
              <YAxis yAxisId="co2" stroke="#f59e0b" tick={{ fontSize: 12, fill: '#f59e0b' }} tickLine={false} axisLine={{ stroke: '#f59e0b' }} width={48} />
              <YAxis yAxisId="env" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 12, fill: '#8b5cf6' }} tickLine={false} axisLine={{ stroke: '#8b5cf6' }} width={44} domain={[0, 100]} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '13px', color: '#6b7280' }} />
              <Line yAxisId="co2" type="monotone" dataKey="co2" stroke="#f59e0b" strokeWidth={3} name="CO₂ (ppm)" dot={false} activeDot={{ r: 5 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} name="Temperature (°C)" dot={false} activeDot={{ r: 4 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} name="Humidity (%)" dot={false} activeDot={{ r: 4 }} connectNulls />
              <Line yAxisId="env" type="monotone" dataKey="noise" stroke="#8b5cf6" strokeWidth={2} name="Noise (dB)" dot={false} activeDot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
}

export default function HistoryPage({ onBack }) {
  const [device, setDevice] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setError('');
        const loadedDevice = await getCurrentDevice(DEFAULT_DEVICE_API);
        const deviceApi = loadedDevice?.device || DEFAULT_DEVICE_API;
        const [loadedMeasurements, loadedNotifications] = await Promise.all([
          listMeasurements(deviceApi),
          listNotifications(deviceApi).catch(() => []),
        ]);

        if (!isMounted) return;
        setDevice(loadedDevice);
        setMeasurements(loadedMeasurements);
        setNotifications(loadedNotifications);
      } catch (err) {
        console.error(err);
        if (isMounted) setError('History could not be loaded from backend.');
      }
    }

    loadHistory();
    const intervalId = setInterval(loadHistory, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const chartData = useMemo(() => buildChartData(measurements), [measurements]);
  const stats = useMemo(() => calculateStats(measurements), [measurements]);
  const latestMeasurement = measurements[measurements.length - 1] || null;
  const lastUpdate = latestMeasurement?.createdAt || device?.status?.updatedAt;
  const isOnline = isDeviceOnline(latestMeasurement, device?.status || {});
  const sensorHealth = getSensorHealth(latestMeasurement, isOnline);
  const activeAlerts = buildActiveAlertItems(latestMeasurement, device, notifications);

  return (
      <div className="history-page">
        {onBack ? (
          <button type="button" className="page-back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        ) : null}

        <div className="history-page__topbar">
          <div>
            <h2 className="history-page__title">Measurement History</h2>
            <p className="history-page__subtitle">
              Detailed historical trends of indoor environmental values.
            </p>
          </div>

          <div className="history-page__actions">
            <button type="button" className="history-page__chip">
              {device?.name || 'History Active'}
            </button>
            <button type="button" className="history-page__button">
              {measurements.length} records
            </button>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <HistoryChartCardLarge data={chartData} />

        <section className="history-stats-grid">
          <StatCard label="Average CO₂" value={stats.avg} unit="ppm" trend={`${measurements.length} measurements`} trendType="warning" />
          <StatCard label="Maximum CO₂" value={stats.max} unit="ppm" trend={stats.maxTrend} trendType="danger" />
          <StatCard label="Minimum CO₂" value={stats.min} unit="ppm" trend={stats.minTrend} trendType="success" />
        </section>

        <section className="history-bottom-grid">
          <AlertSummaryCard items={activeAlerts} />
          <DeviceStatusCard
              connectionLabel={isOnline ? 'Online' : 'Offline'}
              connectionVariant={isOnline ? 'success' : 'danger'}
              healthLabel={sensorHealth.label}
              healthVariant={sensorHealth.variant}
              lastUpdate={formatTime(lastUpdate)}
          />
        </section>
      </div>
  );
}
