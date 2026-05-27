import React, { useEffect, useState } from 'react';
import './SettingsPage.css';
import { settingsMock } from '../../mocks/settingsMock';
import { DEFAULT_DEVICE_API, getCurrentDevice, updateDeviceConfig } from '../../services/iotApi';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function CloudIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.2 9.1 4 4 0 0 0 7 19h10.5Z" />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-15.1 6.6" />
      <path d="M3 12A9 9 0 0 1 18.1 5.4" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SingleLimitCard({
  icon,
  color,
  label,
  description,
  value,
  min,
  max,
  unit,
  onSliderChange,
  onInputCommit,
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  function commitValue() {
    if (draftValue.trim() === '') {
      setDraftValue(String(value));
      return;
    }

    const parsed = Number(draftValue);

    if (!Number.isFinite(parsed)) {
      setDraftValue(String(value));
      return;
    }

    const clamped = clamp(parsed, min, max);
    onInputCommit(clamped);
    setDraftValue(String(clamped));
  }

  return (
    <div className={`settings-limit-card settings-limit-card--${color}`}>
      <div className="settings-limit-card__top">
        <div className={`settings-limit-card__icon settings-limit-card__icon--${color}`}>
          {icon}
        </div>

        <div className="settings-limit-card__title">
          <h3>{label}</h3>
          <p>{description}</p>
        </div>

        <div className="settings-limit-card__value-box">
          <input
            type="text"
            inputMode="numeric"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitValue();
                e.currentTarget.blur();
              }
            }}
            className="settings-number-input"
            aria-label={`${label} value`}
          />
          <span>{unit}</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onSliderChange(Number(e.target.value))}
        className={`settings-slider settings-slider--${color}`}
        aria-label={`${label} slider`}
      />

      <div className="settings-limit-card__range">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>

      <div className={`settings-limit-card__hint settings-limit-card__hint--${color}`}>
        <InfoIcon />
        <span>Recommended range: <strong>{min} – {max} {unit}</strong></span>
      </div>
    </div>
  );
}

function RangeLimitCard({
  icon,
  color,
  label,
  description,
  minValue,
  maxValue,
  min,
  max,
  unit,
  onMinSliderChange,
  onMaxSliderChange,
  onMinCommit,
  onMaxCommit,
}) {
  const [draftMin, setDraftMin] = useState(String(minValue));
  const [draftMax, setDraftMax] = useState(String(maxValue));

  useEffect(() => {
    setDraftMin(String(minValue));
  }, [minValue]);

  useEffect(() => {
    setDraftMax(String(maxValue));
  }, [maxValue]);

  function commitMin() {
    if (draftMin.trim() === '') {
      setDraftMin(String(minValue));
      return;
    }

    const parsed = Number(draftMin);

    if (!Number.isFinite(parsed)) {
      setDraftMin(String(minValue));
      return;
    }

    const clamped = clamp(parsed, min, maxValue);
    onMinCommit(clamped);
    setDraftMin(String(clamped));
  }

  function commitMax() {
    if (draftMax.trim() === '') {
      setDraftMax(String(maxValue));
      return;
    }

    const parsed = Number(draftMax);

    if (!Number.isFinite(parsed)) {
      setDraftMax(String(maxValue));
      return;
    }

    const clamped = clamp(parsed, minValue, max);
    onMaxCommit(clamped);
    setDraftMax(String(clamped));
  }

  return (
    <div className={`settings-limit-card settings-limit-card--${color}`}>
      <div className="settings-limit-card__top">
        <div className={`settings-limit-card__icon settings-limit-card__icon--${color}`}>
          {icon}
        </div>

        <div className="settings-limit-card__title">
          <h3>{label}</h3>
          <p>{description}</p>
        </div>

        <div className="settings-range-values">
          <label>
            <span>Min</span>
            <div className="settings-limit-card__value-box">
              <input
                type="text"
                inputMode="numeric"
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                onBlur={commitMin}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMin();
                    e.currentTarget.blur();
                  }
                }}
                className="settings-number-input"
                aria-label="Minimum temperature"
              />
              <span>{unit}</span>
            </div>
          </label>

          <label>
            <span>Max</span>
            <div className="settings-limit-card__value-box">
              <input
                type="text"
                inputMode="numeric"
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                onBlur={commitMax}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMax();
                    e.currentTarget.blur();
                  }
                }}
                className="settings-number-input"
                aria-label="Maximum temperature"
              />
              <span>{unit}</span>
            </div>
          </label>
        </div>
      </div>

      <div className="settings-range-sliders">
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(e) => onMinSliderChange(Number(e.target.value))}
          className={`settings-slider settings-slider--${color}`}
          aria-label="Minimum temperature slider"
        />

        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(e) => onMaxSliderChange(Number(e.target.value))}
          className={`settings-slider settings-slider--${color}`}
          aria-label="Maximum temperature slider"
        />
      </div>

      <div className="settings-limit-card__range">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>

      <div className={`settings-limit-card__hint settings-limit-card__hint--${color}`}>
        <InfoIcon />
        <span>Recommended range: <strong>{min} – {max} {unit}</strong></span>
      </div>
    </div>
  );
}

function getStatusView(loadState, device, syncMessage) {
  if (loadState === 'error') {
    return {
      tone: 'error',
      title: 'Settings cannot be loaded',
      text: 'Synchronization error. Check backend connection and try again.',
      meta: syncMessage,
      pill: 'Waiting for device',
      icon: <WarningIcon />,
    };
  }

  if (!device) {
    return {
      tone: 'warning',
      title: 'Waiting for device data',
      text: 'Current device is not loaded yet. Values can be reviewed, but saving requires backend connection.',
      meta: syncMessage,
      pill: 'Waiting for device',
      icon: <WarningIcon />,
    };
  }

  return {
    tone: 'success',
    title: 'Settings are in sync',
    text: 'All threshold values are synchronized with your device.',
    meta: syncMessage,
    pill: 'Device loaded',
    icon: <CheckIcon />,
  };
}

function SettingsToast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`settings-toast settings-toast--${toast.type}`} role="status" aria-live="polite">
      <button type="button" className="settings-toast__close" onClick={onClose} aria-label="Close notification">
        <CloseIcon />
      </button>

      <div className="settings-toast__icon">
        {isSuccess ? <CheckIcon /> : <WarningIcon />}
      </div>

      <div>
        <h3>{toast.title}</h3>
        <p>{toast.message}</p>
      </div>
    </div>
  );
}

export default function SettingsPage({ onBack }) {
  const [loadState, setLoadState] = useState('ready');
  const [device, setDevice] = useState(null);
  const [co2, setCo2] = useState(settingsMock.limits.co2.value);
  const [tempMin, setTempMin] = useState(settingsMock.limits.temperature.minValue);
  const [tempMax, setTempMax] = useState(settingsMock.limits.temperature.maxValue);
  const [humidity, setHumidity] = useState(settingsMock.limits.humidity.value);
  const [noise, setNoise] = useState(settingsMock.limits.noise.value);
  const [syncMessage, setSyncMessage] = useState('Loading device settings from backend...');
  const [toast, setToast] = useState(null);

  const pageTitle = settingsMock.pageTitle;
  const limits = settingsMock.limits;
  const statusView = getStatusView(loadState, device, syncMessage);

  function showToast(nextToast) {
    setToast(nextToast);

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }

  async function loadSettings({ showLoadErrorToast = false } = {}) {
    try {
      setLoadState('ready');
      setSyncMessage('Loading device settings from backend...');

      const loadedDevice = await getCurrentDevice(DEFAULT_DEVICE_API);
      const config = loadedDevice?.config || {};

      setDevice(loadedDevice);
      setCo2(config.co2 ?? settingsMock.limits.co2.value);
      setTempMin(config.tempMin ?? settingsMock.limits.temperature.minValue);
      setTempMax(config.tempMax ?? settingsMock.limits.temperature.maxValue);
      setHumidity(config.wet ?? settingsMock.limits.humidity.value);
      setNoise(config.loud ?? settingsMock.limits.noise.value);
      setSyncMessage(`${loadedDevice?.name || 'Device'} settings loaded from backend.`);
    } catch (error) {
      console.error(error);
      setLoadState('error');
      setSyncMessage('Settings cannot be loaded from backend.');

      if (showLoadErrorToast) {
        showToast({
          type: 'error',
          title: 'Settings cannot be loaded',
          message: 'Backend values could not be loaded. Please check backend connection and try again.',
        });
      }
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave() {
    if (!device?._id) {
      showToast({
        type: 'error',
        title: 'Device is not loaded yet',
        message: 'Settings cannot be saved until the device is loaded from backend.',
      });
      return;
    }

    try {
      setLoadState('ready');
      await updateDeviceConfig(device._id, {
        tempMin,
        tempMax,
        wet: humidity,
        co2,
        loud: noise,
      });

      await loadSettings();
      showToast({
        type: 'success',
        title: 'Settings saved successfully',
        message: 'Threshold values have been updated. New notifications will be created after the next measurement if limits are exceeded.',
      });
    } catch (error) {
      console.error(error);
      setLoadState('error');
      showToast({
        type: 'error',
        title: 'Settings could not be saved',
        message: error?.message || 'Backend rejected the update. Please try again later.',
      });
    }
  }

  function handleCancel() {
    loadSettings();

    if (onBack) {
      onBack();
    }
  }

  function handleResetDefaults() {
    setCo2(settingsMock.limits.co2.value);
    setTempMin(settingsMock.limits.temperature.minValue);
    setTempMax(settingsMock.limits.temperature.maxValue);
    setHumidity(settingsMock.limits.humidity.value);
    setNoise(settingsMock.limits.noise.value);
    showToast({
      type: 'success',
      title: 'Default values restored',
      message: 'Default threshold values are ready. Click Save Changes to send them to backend.',
    });
  }

  return (
    <div className="settings-page">
      <div className="settings-shell">
        <section className="settings-panel">
          <header className="settings-panel__header">
            <div>
              <h2>{pageTitle}</h2>
              <p>Set custom thresholds for environmental sensors to get alerts and maintain a healthy indoor environment.</p>
            </div>

            <div className={`settings-device-pill settings-device-pill--${statusView.tone}`}>
              <span />
              {device ? `${device.name || 'Device'} · ${device.device || DEFAULT_DEVICE_API}` : statusView.pill}
              <InfoIcon />
            </div>
          </header>

          <div className="settings-panel__grid">
            <SingleLimitCard
              icon={<CloudIcon />}
              color="co2"
              label={limits.co2.label}
              description="Carbon Dioxide"
              value={co2}
              min={limits.co2.min}
              max={limits.co2.max}
              unit={limits.co2.unit}
              onSliderChange={setCo2}
              onInputCommit={setCo2}
            />

            <RangeLimitCard
              icon={<ThermometerIcon />}
              color="temperature"
              label={limits.temperature.label}
              description="Ambient Temperature"
              minValue={tempMin}
              maxValue={tempMax}
              min={limits.temperature.min}
              max={limits.temperature.max}
              unit={limits.temperature.unit}
              onMinSliderChange={(value) => setTempMin(Math.min(value, tempMax))}
              onMaxSliderChange={(value) => setTempMax(Math.max(value, tempMin))}
              onMinCommit={setTempMin}
              onMaxCommit={setTempMax}
            />

            <SingleLimitCard
              icon={<DropletIcon />}
              color="humidity"
              label={limits.humidity.label}
              description="Relative Humidity"
              value={humidity}
              min={limits.humidity.min}
              max={limits.humidity.max}
              unit={limits.humidity.unit}
              onSliderChange={setHumidity}
              onInputCommit={setHumidity}
            />

            <SingleLimitCard
              icon={<VolumeIcon />}
              color="noise"
              label={limits.noise.label}
              description="Sound Pressure Level"
              value={noise}
              min={limits.noise.min}
              max={limits.noise.max}
              unit={limits.noise.unit}
              onSliderChange={setNoise}
              onInputCommit={setNoise}
            />
          </div>

          <div className={`settings-sync-card settings-sync-card--${statusView.tone}`}>
            <div className="settings-sync-card__icon">
              {statusView.icon}
            </div>

            <div className="settings-sync-card__content">
              <h3>{statusView.title}</h3>
              <p>{statusView.text}</p>
              <span>{statusView.meta}</span>
            </div>

            <button type="button" className="settings-sync-card__button" onClick={() => loadSettings({ showLoadErrorToast: true })}>
              <RefreshIcon />
              Sync Now
            </button>
          </div>

          <footer className="settings-panel__footer">
            <button type="button" className="settings-reset-button" onClick={handleResetDefaults}>
              <ResetIcon />
              Reset to defaults
            </button>

            <div className="settings-panel__actions">
              <button type="button" className="settings-action settings-action--secondary" onClick={handleCancel}>
                Cancel
              </button>

              <button type="button" className="settings-action settings-action--primary" onClick={handleSave}>
                <SaveIcon />
                Save Changes
              </button>
            </div>
          </footer>
        </section>
      </div>

      <SettingsToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
