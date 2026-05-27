import { getStoredToken } from './authService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888';
export const DEFAULT_DEVICE_API = import.meta.env.VITE_DEVICE_API || 'esp32001';
export const DEFAULT_OFFLINE_CHECK_MINUTES = Number(import.meta.env.VITE_OFFLINE_TIMEOUT_MINUTES || 2);

async function request(path, options = {}) {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.devices)) return payload.devices;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload && typeof payload === 'object') return [payload];
  return [];
}

export function getObjectId(item) {
  if (!item) return '';
  if (typeof item._id === 'string') return item._id;
  if (item._id?.$oid) return item._id.$oid;
  if (typeof item.id === 'string') return item.id;
  return String(item._id || item.id || '');
}

export function toDate(value) {
  if (!value) return null;
  if (value?.$date) return new Date(value.$date);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatShortTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChartTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return 'unknown';

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} sec ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function normalizeDevice(device) {
  if (!device) return null;

  const normalized = {
    ...device,
    _id: getObjectId(device),
    device: device.device || '',
    name: device.name || device.device || 'Unnamed device',
    config: device.config || {},
    status: device.status || {},
  };

  return normalized;
}

export function normalizeMeasurement(item) {
  if (!item) return null;

  const createdAt = item.createdAt || item.time || item.updatedAt;

  return {
    ...item,
    _id: getObjectId(item),
    device: item.device || DEFAULT_DEVICE_API,
    createdAt,
    time: formatShortTime(createdAt),
    temp: item.temp ?? item.temperature ?? null,
    wet: item.wet ?? item.humidity ?? null,
    co2: item.co2 ?? null,
    loud: item.loud ?? item.noise ?? null,
  };
}

export function normalizeNotification(item) {
  if (!item) return null;

  const severity = item.severity || 'info';
  const level = severity === 'success'
    ? 'success'
    : severity === 'danger' || severity === 'critical'
      ? 'critical'
      : severity === 'warning'
        ? 'warning'
        : 'info';

  return {
    ...item,
    _id: getObjectId(item),
    id: getObjectId(item),
    device: item.device || DEFAULT_DEVICE_API,
    level,
    unread: item.read === false,
    timestamp: formatRelativeTime(item.createdAt),
    recommendation: buildNotificationRecommendation(item),
  };
}

function buildNotificationRecommendation(item) {
  switch (item?.type) {
    case 'HIGH_CO2':
      return 'Recommendation: Ventilate the room.';
    case 'HIGH_NOISE':
      return 'Recommendation: Check the noise source or move the sensor.';
    case 'HIGH_HUMIDITY':
      return 'Recommendation: Improve ventilation or reduce humidity source.';
    case 'HIGH_TEMPERATURE':
      return 'Recommendation: Cool the room or reduce heat sources.';
    case 'LOW_TEMPERATURE':
      return 'Recommendation: Check heating or room insulation.';
    case 'DEVICE_OFFLINE':
      return 'Recommendation: Check power and Wi-Fi connection.';
    default:
      return '';
  }
}

export async function listDevicesShort() {
  const payload = await request('/device/list');
  return normalizeArray(payload).map(normalizeDevice).filter(Boolean);
}

export async function getDeviceById(deviceId) {
  const payload = await request(`/device/get/${encodeURIComponent(deviceId)}`);
  return normalizeDevice(payload?.device || payload);
}

export async function listDevices() {
  const shortDevices = await listDevicesShort();

  const fullDevices = await Promise.all(
    shortDevices.map(async (device) => {
      if (!device._id) return device;

      try {
        return await getDeviceById(device._id);
      } catch (error) {
        console.warn('Could not load full device details:', error);
        return device;
      }
    })
  );

  return fullDevices.filter(Boolean);
}

export async function getCurrentDevice(deviceApi = DEFAULT_DEVICE_API) {
  const devices = await listDevices();

  return (
    devices.find((device) => device.device === deviceApi) ||
    devices[0] ||
    null
  );
}

export async function listMeasurements(deviceApi = DEFAULT_DEVICE_API) {
  const payload = await request(`/data/list?device=${encodeURIComponent(deviceApi)}`);

  return normalizeArray(payload)
    .map(normalizeMeasurement)
    .filter(Boolean)
    .sort((a, b) => {
      const aDate = toDate(a.createdAt)?.getTime() || 0;
      const bDate = toDate(b.createdAt)?.getTime() || 0;
      return aDate - bDate;
    });
}

export async function listNotifications(deviceApi = DEFAULT_DEVICE_API) {
  const payload = await request(`/notification/list?device=${encodeURIComponent(deviceApi)}`);

  return normalizeArray(payload)
    .map(normalizeNotification)
    .filter(Boolean)
    .sort((a, b) => {
      const aDate = toDate(a.createdAt)?.getTime() || 0;
      const bDate = toDate(b.createdAt)?.getTime() || 0;
      return bDate - aDate;
    });
}

export async function updateDeviceName(deviceId, name) {
  return request(`/device/${encodeURIComponent(deviceId)}/name/update`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function updateDeviceConfig(deviceId, config) {
  return request(`/device/${encodeURIComponent(deviceId)}/config/update`, {
    method: 'PATCH',
    body: JSON.stringify({
      tempMin: Number(config.tempMin),
      tempMax: Number(config.tempMax),
      wet: Number(config.wet),
      co2: Number(config.co2),
      loud: Number(config.loud),
    }),
  });
}

export async function updateDeviceStatus(deviceId, status) {
  return request(`/device/${encodeURIComponent(deviceId)}/status/update`, {
    method: 'PATCH',
    body: JSON.stringify({
      online: Boolean(status.online),
      temp: Boolean(status.temp),
      wet: Boolean(status.wet),
      co2: Boolean(status.co2),
      loud: Boolean(status.loud),
    }),
  });
}

export async function markNotificationAsRead(notificationId) {
  return request(`/notification/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(deviceApi = DEFAULT_DEVICE_API) {
  return request(`/notification/read/all?device=${encodeURIComponent(deviceApi)}`, {
    method: 'PATCH',
  });
}

export async function checkOffline(deviceApi = DEFAULT_DEVICE_API, minutes = DEFAULT_OFFLINE_CHECK_MINUTES) {
  return request(`/notification/check-offline?device=${encodeURIComponent(deviceApi)}&minutes=${encodeURIComponent(minutes)}`, {
    method: 'POST',
  });
}

function toChartNumber(value, { positive = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (positive && number <= 0) return null;
  return Number(number.toFixed(1));
}

export function buildChartData(measurements) {
  return measurements
    .map((item, index) => {
      const date = toDate(item.createdAt);
      const timestamp = date ? date.getTime() : index;

      return {
        time: formatChartTime(item.createdAt),
        timestamp,
        co2: toChartNumber(item.co2, { positive: true }),
        temp: toChartNumber(item.temp),
        humidity: toChartNumber(item.wet, { positive: true }),
        noise: toChartNumber(item.loud, { positive: true }),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
