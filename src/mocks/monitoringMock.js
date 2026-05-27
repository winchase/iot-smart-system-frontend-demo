export const baseMonitoringMock = {
  app: {
    title: "Air Quality Analyzer",
  },
  notifications: {
    unreadCount: 1,
  },
  user: {
    profile: {
      name: "Sergey",
    },
  },
  device: {
    connection: "online",
    lastUpdate: "just now",
    status: "Online",
    isOnline: true,
  },
  measurements: {
    co2: 950,
    co2Unit: "ppm",
    temperature: 23,
    temperatureUnit: "°C",
    humidity: 46,
    humidityUnit: "%",
    noise: 52,
    noiseUnit: "dB",
  },
  statusPanels: [
    {
      id: "main-device",
      title: "Device Status",
      state: "Online",
      updatedAt: "just now",
    },
    {
      id: "secondary-device",
      title: "Sensor / Gateway Status",
      state: "Connected",
      updatedAt: "just now",
    },
  ],
  recommendations: {
    current: {
      title: "Consider ventilating the room",
      message:
        "CO₂ levels are getting a bit high. Open a window to reduce CO₂ levels.",
    },
  },
};
