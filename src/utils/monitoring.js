const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const pad = (num) => String(num).padStart(2, '0');


export const OFFLINE_TIMEOUT_MINUTES = Number(import.meta.env.VITE_OFFLINE_TIMEOUT_MINUTES || 2);

export function getTimestampMs(value) {
  if (!value) return null;
  const rawValue = value?.$date || value;
  const date = new Date(rawValue);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export function isFreshTimestamp(value, minutes = OFFLINE_TIMEOUT_MINUTES) {
  const time = getTimestampMs(value);
  if (!time) return false;
  return Date.now() - time <= Number(minutes) * 60 * 1000;
}

export function isDeviceOnline(latestMeasurement, status = {}, minutes = OFFLINE_TIMEOUT_MINUTES) {
  const latestIsFresh = isFreshTimestamp(latestMeasurement?.createdAt, minutes);
  const statusIsFresh = isFreshTimestamp(status?.updatedAt, minutes);

  if (latestIsFresh) return true;
  if (status?.online === true && statusIsFresh) return true;

  return false;
}

export const SENSOR_DEFINITIONS = [
  { key: 'co2', label: 'CO₂', unit: 'ppm', measurementKey: 'co2' },
  { key: 'temp', label: 'Temperature', unit: '°C', measurementKey: 'temp' },
  { key: 'wet', label: 'Humidity', unit: '%', measurementKey: 'wet' },
  { key: 'loud', label: 'Noise', unit: 'dB', measurementKey: 'loud' },
];

export function formatTimeFromDate(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidSensorValue(sensorKey, value) {
  const number = getNumber(value);

  if (number === null) return false;

  switch (sensorKey) {
    case 'co2':
      return number > 0;
    case 'wet':
      return number > 0 && number <= 100;
    case 'loud':
      return number > 0;
    case 'temp':
      return number > -50 && number < 100;
    default:
      return true;
  }
}

export function formatSensorValue(value, sensorKey, decimals = 1) {
  if (!isValidSensorValue(sensorKey, value)) return '--';

  const number = getNumber(value);
  const fixed = number.toFixed(decimals);
  return decimals === 0 ? String(Math.round(number)) : fixed;
}

export function formatChartValue(value, sensorKey, decimals = 1) {
  if (!isValidSensorValue(sensorKey, value)) return null;
  const number = getNumber(value);
  return Number(number.toFixed(decimals));
}

function formatSignedDelta(diff, unit = '', decimals = 1) {
  if (!Number.isFinite(diff)) return '—';

  const rounded = Number(diff.toFixed(decimals));
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  const absolute = Math.abs(rounded);
  const value = decimals === 0 ? String(Math.round(absolute)) : absolute.toFixed(decimals);

  return `${sign}${value}${unit}`;
}

function formatAbsoluteDelta(current, previous, sensorKey, unit = '', decimals = 1) {
  if (!isValidSensorValue(sensorKey, current) || !isValidSensorValue(sensorKey, previous)) {
    return '—';
  }

  const diff = getNumber(current) - getNumber(previous);
  return formatSignedDelta(diff, unit, decimals);
}

function formatPercentDelta(current, previous) {
  if (!isValidSensorValue('co2', current) || !isValidSensorValue('co2', previous)) {
    return '—';
  }

  const currentValue = getNumber(current);
  const previousValue = getNumber(previous);
  if (previousValue === 0) return '—';

  const diff = ((currentValue - previousValue) / previousValue) * 100;
  return formatSignedDelta(diff, '%', 0);
}

export function getSensorReport(latest) {
  return {
    co2: isValidSensorValue('co2', latest?.co2),
    temp: isValidSensorValue('temp', latest?.temp),
    wet: isValidSensorValue('wet', latest?.wet),
    loud: isValidSensorValue('loud', latest?.loud),
  };
}

export function getMissingSensors(latest) {
  const report = getSensorReport(latest);
  return SENSOR_DEFINITIONS.filter((sensor) => !report[sensor.key]);
}

export function getSensorHealth(latest, isOnline = true) {
  if (!isOnline) {
    return {
      label: 'Offline',
      variant: 'danger',
      missing: SENSOR_DEFINITIONS,
      allReporting: false,
    };
  }

  const missing = getMissingSensors(latest);

  if (!missing.length) {
    return {
      label: 'All reporting',
      variant: 'success',
      missing,
      allReporting: true,
    };
  }

  return {
    label: 'Some not reporting',
    variant: 'warning',
    missing,
    allReporting: false,
  };
}

function buildRecommendationItem({ id, title, message, severity = 'warning' }) {
  return { id, title, message, severity };
}

export function buildRecommendationList(latest, device) {
  const config = device?.config || {};
  const status = device?.status || {};
  const isOnline = isDeviceOnline(latest, status);
  const items = [];

  if (!latest) {
    return [
      buildRecommendationItem({
        id: 'waiting-for-data',
        title: 'Waiting for sensor data',
        message: 'No measurements have been received yet.',
        severity: 'info',
      }),
    ];
  }

  if (!isOnline) {
    items.push(buildRecommendationItem({
      id: 'device-offline',
      title: 'Device is offline',
      message: 'Check power, Wi-Fi connection and ESP32 data sending.',
      severity: 'danger',
    }));
  }

  for (const sensor of getMissingSensors(latest)) {
    items.push(buildRecommendationItem({
      id: `${sensor.key}-not-reporting`,
      title: `${sensor.label} sensor is not reporting`,
      message: `Missing ${sensor.label} value in the latest measurement. Check sensor connection and data format.`,
      severity: 'warning',
    }));
  }

  if (isValidSensorValue('co2', latest.co2) && config.co2 != null && getNumber(latest.co2) > Number(config.co2)) {
    items.push(buildRecommendationItem({
      id: 'high-co2',
      title: 'CO₂ level is above the configured limit',
      message: `CO₂ reached ${formatSensorValue(latest.co2, 'co2', 0)} ppm. Limit is ${config.co2} ppm. Ventilate the room.`,
      severity: 'warning',
    }));
  }

  if (isValidSensorValue('loud', latest.loud) && config.loud != null && getNumber(latest.loud) > Number(config.loud)) {
    items.push(buildRecommendationItem({
      id: 'high-noise',
      title: 'Noise level is above the configured limit',
      message: `Noise reached ${formatSensorValue(latest.loud, 'loud', 1)} dB. Limit is ${config.loud} dB.`,
      severity: 'warning',
    }));
  }

  if (isValidSensorValue('wet', latest.wet) && config.wet != null && getNumber(latest.wet) > Number(config.wet)) {
    items.push(buildRecommendationItem({
      id: 'high-humidity',
      title: 'Humidity is above the configured limit',
      message: `Humidity reached ${formatSensorValue(latest.wet, 'wet', 1)}%. Limit is ${config.wet}%. Improve ventilation.`,
      severity: 'warning',
    }));
  }

  if (isValidSensorValue('temp', latest.temp) && config.tempMax != null && getNumber(latest.temp) > Number(config.tempMax)) {
    items.push(buildRecommendationItem({
      id: 'high-temperature',
      title: 'Temperature is above the configured range',
      message: `Temperature reached ${formatSensorValue(latest.temp, 'temp', 1)} °C. Maximum limit is ${config.tempMax} °C.`,
      severity: 'warning',
    }));
  }

  if (isValidSensorValue('temp', latest.temp) && config.tempMin != null && getNumber(latest.temp) < Number(config.tempMin)) {
    items.push(buildRecommendationItem({
      id: 'low-temperature',
      title: 'Temperature is below the configured range',
      message: `Temperature reached ${formatSensorValue(latest.temp, 'temp', 1)} °C. Minimum limit is ${config.tempMin} °C.`,
      severity: 'warning',
    }));
  }

  if (!items.length) {
    items.push(buildRecommendationItem({
      id: 'all-ok',
      title: 'Air quality is acceptable',
      message: 'All current values are present and inside configured limits.',
      severity: 'success',
    }));
  }

  return items;
}

export function getNotificationSeverity(notification) {
  if (!notification) return 'info';
  if (notification.level === 'critical' || notification.severity === 'error') return 'danger';
  if (notification.level === 'warning' || notification.severity === 'warning') return 'warning';
  if (notification.level === 'success' || notification.severity === 'success') return 'success';
  return 'info';
}

export function buildActiveAlertItems(latest, device) {
  return buildRecommendationList(latest, device).map((item) => ({
    id: `rec-${item.id}`,
    title: item.title,
    message: item.message,
    timestamp: 'Current state',
    level: item.severity === 'danger' ? 'critical' : item.severity,
  }));
}

export function buildMeasurementCards(data) {
  const measurements = data?.measurements || {};
  const history = data?.rawMeasurements || [];
  const latest = history[history.length - 1] || null;
  const previous = history[history.length - 2] || null;
  const config = data?.device?.raw?.config || {};

  return [
    {
      id: 'co2',
      label: 'CO₂',
      value: formatSensorValue(measurements.co2, 'co2', 0),
      unit: measurements.co2Unit ?? 'ppm',
      icon: 'CO₂',
      theme: 'co2',
      trend: latest && previous ? formatPercentDelta(latest.co2, previous.co2) : '—',
      warning: !isValidSensorValue('co2', latest?.co2) || (config.co2 != null && getNumber(latest?.co2) > Number(config.co2)),
    },
    {
      id: 'temperature',
      label: 'Temperature',
      value: formatSensorValue(measurements.temperature, 'temp', 1),
      unit: measurements.temperatureUnit ?? '°C',
      icon: '🌡',
      theme: 'temperature',
      trend: latest && previous ? formatAbsoluteDelta(latest.temp, previous.temp, 'temp', '°C', 1) : '—',
      warning:
        !isValidSensorValue('temp', latest?.temp) ||
        (config.tempMin != null && getNumber(latest?.temp) < Number(config.tempMin)) ||
        (config.tempMax != null && getNumber(latest?.temp) > Number(config.tempMax)),
    },
    {
      id: 'humidity',
      label: 'Humidity',
      value: formatSensorValue(measurements.humidity, 'wet', 1),
      unit: measurements.humidityUnit ?? '%',
      icon: '💧',
      theme: 'humidity',
      trend: latest && previous ? formatAbsoluteDelta(latest.wet, previous.wet, 'wet', '%', 1) : '—',
      warning: !isValidSensorValue('wet', latest?.wet) || (config.wet != null && getNumber(latest?.wet) > Number(config.wet)),
    },
    {
      id: 'noise',
      label: 'Noise Level',
      value: formatSensorValue(measurements.noise, 'loud', 1),
      unit: measurements.noiseUnit ?? 'dB',
      icon: '🔊',
      theme: 'noise',
      trend: latest && previous ? formatAbsoluteDelta(latest.loud, previous.loud, 'loud', 'dB', 1) : '—',
      warning: !isValidSensorValue('loud', latest?.loud) || (config.loud != null && getNumber(latest?.loud) > Number(config.loud)),
    },
  ];
}

export function createMockSnapshot(baseData) {
  const now = new Date();
  const currentTime = formatTimeFromDate(now);
  const co2 = clamp(baseData.measurements.co2 + Math.round((Math.random() - 0.5) * 90), 700, 1400);
  const temperature = clamp(baseData.measurements.temperature + Number(((Math.random() - 0.5) * 1.4).toFixed(1)), 19, 29);
  const humidity = clamp(baseData.measurements.humidity + Math.round((Math.random() - 0.5) * 8), 30, 70);
  const noise = clamp(baseData.measurements.noise + Math.round((Math.random() - 0.5) * 10), 35, 75);

  const recommendation =
    co2 >= 1000
      ? {
          title: 'Consider ventilating the room',
          message: 'CO₂ is elevated. Open a window or improve air circulation.',
        }
      : noise >= 65
      ? {
          title: 'Noise level is rising',
          message: 'Noise is getting high. Check the source or move the device to a quieter area.',
        }
      : {
          title: 'Air quality is acceptable',
          message: 'Current values look stable. No urgent action is needed right now.',
        };

  return {
    ...baseData,
    notifications: {
      ...baseData.notifications,
      unreadCount: co2 >= 1000 || noise >= 65 ? 2 : 1,
    },
    device: {
      ...baseData.device,
      lastUpdate: currentTime,
      status: 'Online',
      isOnline: true,
    },
    measurements: {
      ...baseData.measurements,
      co2,
      temperature,
      humidity,
      noise,
    },
    statusPanels: [
      {
        id: 'main-device',
        title: 'Device Status',
        state: 'Online',
        updatedAt: currentTime,
      },
      {
        id: 'secondary-device',
        title: 'Sensor / Gateway Status',
        state: co2 >= 1200 ? 'Warning' : 'Connected',
        updatedAt: currentTime,
      },
    ],
    recommendations: {
      current: recommendation,
      items: buildRecommendationList({ co2, temp: temperature, wet: humidity, loud: noise }, { status: { online: true }, config: baseData?.device?.raw?.config || {} }),
    },
  };
}
