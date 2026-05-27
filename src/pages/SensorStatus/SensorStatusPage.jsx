import React, { useEffect, useState } from 'react';
import './SensorStatusPage.css';
import {
  DEFAULT_DEVICE_API,
  checkOffline,
  formatTime,
  getCurrentDevice,
  listMeasurements,
} from '../../services/iotApi';
import {
  OFFLINE_TIMEOUT_MINUTES,
  getSensorReport,
  isDeviceOnline,
  isValidSensorValue,
} from '../../utils/monitoring';

const OFFLINE_CHECK_MINUTES = OFFLINE_TIMEOUT_MINUTES;

function CheckCircleIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-4" />
      </svg>
  );
}

function AlertTriangleIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
  );
}

function CloudIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.2 9.1 4 4 0 0 0 7 19h10.5Z" />
      </svg>
  );
}

function ThermometerIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
      </svg>
  );
}

function DropletIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
      </svg>
  );
}

function VolumeIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      </svg>
  );
}

function SensorRow({ icon, name, description, state }) {
  const isSuccess = state.variant === 'success';

  return (
      <div className="sensor-status-row">
        <div className="sensor-status-row__left">
          <div className="sensor-status-row__icon">{icon}</div>
          <div className="sensor-status-row__content">
            <h3>{name}</h3>
            <p>{description}</p>
          </div>
        </div>

        <div className={`sensor-status-row__badge sensor-status-row__badge--${state.variant}`}>
          {isSuccess ? <CheckCircleIcon /> : <AlertTriangleIcon />}
          <span>{state.label}</span>
        </div>
      </div>
  );
}

export default function SensorStatusPage({ onBack }) {
  const [device, setDevice] = useState(null);
  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function loadDevice() {
    try {
      setError('');
      const loadedDevice = await getCurrentDevice(DEFAULT_DEVICE_API);
      const deviceApi = loadedDevice?.device || DEFAULT_DEVICE_API;
      const measurements = await listMeasurements(deviceApi);
      setDevice(loadedDevice);
      setLatestMeasurement(measurements[measurements.length - 1] || null);
    } catch (err) {
      console.error(err);
      setError('Sensor status could not be loaded from backend.');
    }
  }

  async function handleCheckSensorStatus() {
    try {
      setError('');
      setChecking(true);

      const deviceApi = device?.device || DEFAULT_DEVICE_API;

      await checkOffline(deviceApi, OFFLINE_CHECK_MINUTES);
      await loadDevice();
    } catch (err) {
      console.error(err);
      setError('Sensor status check failed.');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadDevice();
    const intervalId = setInterval(loadDevice, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const status = device?.status || {};
  const report = getSensorReport(latestMeasurement);
  const isOnline = isDeviceOnline(latestMeasurement, status);

  function getSensorState(sensorKey) {
    if (!isOnline) {
      return {
        label: 'Offline',
        variant: 'offline',
      };
    }

    if (isValidSensorValue(sensorKey, latestMeasurement?.[sensorKey])) {
      return {
        label: 'Reporting',
        variant: 'success',
      };
    }

    return {
      label: 'Not reporting',
      variant: 'warning',
    };
  }

  const allReporting = Boolean(
      isOnline && report.co2 && report.temp && report.wet && report.loud
  );

  const overallState = (() => {
    if (!isOnline) {
      return {
        title: 'Device is offline.',
        text: `${device?.name || 'Selected device'} has not sent data recently. Last update: ${formatTime(latestMeasurement?.createdAt || status.updatedAt)}`,
        variant: 'offline',
      };
    }

    if (allReporting) {
      return {
        title: 'All sensors are reporting.',
        text: `${device?.name || 'Selected device'} latest measurement includes all sensor values. Last update: ${formatTime(latestMeasurement?.createdAt || status.updatedAt)}`,
        variant: 'success',
      };
    }

    return {
      title: 'Some sensors are not reporting.',
      text: `${device?.name || 'Selected device'} latest measurement is missing one or more sensor values. Last update: ${formatTime(latestMeasurement?.createdAt || status.updatedAt)}`,
      variant: 'warning',
    };
  })();

  const sensors = [
    {
      id: 'co2',
      name: 'CO₂ Sensor',
      description: 'CO₂ sensor reporting state from backend.',
      state: getSensorState('co2'),
      icon: <CloudIcon />,
    },
    {
      id: 'temp',
      name: 'Temperature Sensor',
      description: 'Temperature sensor reporting state from backend.',
      state: getSensorState('temp'),
      icon: <ThermometerIcon />,
    },
    {
      id: 'wet',
      name: 'Humidity Sensor',
      description: 'Humidity sensor reporting state from backend.',
      state: getSensorState('wet'),
      icon: <DropletIcon />,
    },
    {
      id: 'loud',
      name: 'Noise Sensor',
      description: 'Noise sensor reporting state from backend.',
      state: getSensorState('loud'),
      icon: <VolumeIcon />,
    },
  ];

  return (
      <div className="sensor-status-page">
        {onBack ? (
          <button type="button" className="page-back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        ) : null}

        <div className="sensor-status-page__topbar">
          <div>
            <h2 className="sensor-status-page__title">Sensor Functionality Report</h2>
            <p className="sensor-status-page__subtitle">
              Overview of sensor health, connectivity, and operational state.
            </p>
          </div>

          <div className="sensor-status-page__meta">
            <button
                type="button"
                className="sensor-status-page__pill"
                onClick={handleCheckSensorStatus}
                disabled={checking}
            >
              {checking ? 'Checking...' : 'Check sensor status'}
            </button>
            <span className="sensor-status-page__time">
            Device: {device?.device || DEFAULT_DEVICE_API}
          </span>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="sensor-status-page__card">
          <div className={`sensor-status-overall sensor-status-overall--${overallState.variant}`}>
            <div className="sensor-status-overall__icon">
              {overallState.variant === 'success' ? <CheckCircleIcon /> : <AlertTriangleIcon />}
            </div>

            <div>
              <h3>{overallState.title}</h3>
              <p>{overallState.text}</p>
            </div>
          </div>

          <div className="sensor-status-list">
            {sensors.map((sensor) => (
                <SensorRow
                    key={sensor.id}
                    icon={sensor.icon}
                    name={sensor.name}
                    description={sensor.description}
                    state={sensor.state}
                />
            ))}
          </div>
        </section>
      </div>
  );
}
