import {
  DEFAULT_DEVICE_API,
  buildChartData,
  formatTime,
  getCurrentDevice,
  listMeasurements,
  listNotifications,
} from './iotApi';
import {
  buildRecommendationList,
  getSensorHealth,
  isDeviceOnline,
} from '../utils/monitoring';

const MODE = import.meta.env.VITE_MONITORING_MODE || 'api';

function getLatest(measurements) {
  return measurements[measurements.length - 1] || null;
}

export function buildEmptyMonitoringData() {
  return {
    device: {
      id: '',
      apiKey: DEFAULT_DEVICE_API,
      name: 'Unknown',
      connection: 'offline',
      lastUpdate: '—',
      status: 'Offline',
      isOnline: false,
      raw: null,
      sensorHealth: {
        label: 'Offline',
        variant: 'danger',
        allReporting: false,
        missing: [],
      },
    },
    measurements: {
      co2: null,
      co2Unit: 'ppm',
      temperature: null,
      temperatureUnit: '°C',
      humidity: null,
      humidityUnit: '%',
      noise: null,
      noiseUnit: 'dB',
    },
    history: [],
    rawMeasurements: [],
    rawNotifications: [],
    notifications: {
      unreadCount: 0,
      latest: [],
    },
    recommendations: {
      current: {
        title: 'Backend is unavailable',
        message: 'Frontend cannot load current data from backend.',
      },
      items: [
        {
          id: 'backend-unavailable',
          title: 'Backend is unavailable',
          message: 'Check whether the backend server is running and reachable.',
          severity: 'danger',
        },
      ],
    },
  };
}

async function getApiMonitoringData() {
  const preferredDeviceApi = DEFAULT_DEVICE_API;
  const device = await getCurrentDevice(preferredDeviceApi);
  const deviceApi = device?.device || preferredDeviceApi;

  const [measurements, notifications] = await Promise.all([
    listMeasurements(deviceApi),
    listNotifications(deviceApi).catch(() => []),
  ]);

  const latest = getLatest(measurements);
  const status = device?.status || {};
  const lastUpdate = latest?.createdAt || status.updatedAt;
  const isOnline = isDeviceOnline(latest, status);
  const sensorHealth = getSensorHealth(latest, isOnline);
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const recommendations = buildRecommendationList(latest, device);

  return {
    device: {
      id: device?._id || '',
      apiKey: deviceApi,
      name: device?.name || deviceApi || 'Room Sensor',
      connection: isOnline ? 'online' : 'offline',
      lastUpdate: formatTime(lastUpdate),
      status: isOnline ? 'Online' : 'Offline',
      isOnline,
      raw: device,
      sensorHealth,
    },
    measurements: {
      co2: latest?.co2 ?? null,
      co2Unit: 'ppm',
      temperature: latest?.temp ?? null,
      temperatureUnit: '°C',
      humidity: latest?.wet ?? null,
      humidityUnit: '%',
      noise: latest?.loud ?? null,
      noiseUnit: 'dB',
    },
    history: buildChartData(measurements),
    rawMeasurements: measurements,
    rawNotifications: notifications,
    notifications: {
      unreadCount,
      latest: notifications.slice(0, 3),
    },
    recommendations: {
      current: recommendations[0],
      items: recommendations,
    },
  };
}

export async function getMonitoringData() {
  if (MODE === 'mock') {
    return buildEmptyMonitoringData();
  }

  return getApiMonitoringData();
}

export function getMonitoringMode() {
  return MODE;
}
