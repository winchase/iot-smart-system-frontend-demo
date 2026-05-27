export const settingsMock = {
  pageTitle: 'Threshold Settings',
  pageSubtitle: 'Set custom thresholds for environmental sensors.',
  syncStatus: {
    state: 'synced', // "synced" | "offline" | "error"
    message: 'Device synced 2 mins ago',
  },
  limits: {
    co2: {
      label: 'CO₂ Limit',
      value: 1000,
      min: 400,
      max: 2000,
      unit: 'ppm',
      color: 'co2',
    },
    temperature: {
      label: 'Temperature Range',
      minValue: 20,
      maxValue: 25,
      min: 15,
      max: 40,
      unit: '°C',
      color: 'temperature',
    },
    humidity: {
      label: 'Humidity Limit',
      value: 60,
      min: 20,
      max: 80,
      unit: '%',
      color: 'humidity',
    },
    noise: {
      label: 'Noise Limit',
      value: 60,
      min: 30,
      max: 100,
      unit: 'dB',
      color: 'noise',
    },
  },
  loadState: 'ready', // "ready" | "error" | "offline"
};
