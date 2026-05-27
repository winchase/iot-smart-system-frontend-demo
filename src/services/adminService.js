import { getStoredToken } from './authService.js';
import { formatRelativeTime, formatTime, toDate } from './iotApi.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888';

async function adminRequest(path, options = {}) {
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

function getId(item) {
  if (!item) return '';
  if (typeof item._id === 'string') return item._id;
  if (item._id?.$oid) return item._id.$oid;
  if (typeof item.id === 'string') return item.id;
  return String(item._id || item.id || '');
}

export function getUserDisplayName(user) {
  return user?.username || user?.userName || user?.name || 'Unnamed user';
}

export function normalizeAdminUser(user) {
  if (!user) return null;

  return {
    ...user,
    _id: getId(user),
    id: getId(user),
    username: getUserDisplayName(user),
    email: user.email || 'No email',
    deviceCount: Number(user.deviceCount || user.devices?.length || 0),
  };
}

export function normalizeAdminDevice(device) {
  if (!device) return null;

  const assignedUsers = Array.isArray(device.assignedUsers)
    ? device.assignedUsers.map(normalizeAdminUser).filter(Boolean)
    : [];

  const lastUpdate = device.status?.updatedAt || device.updatedAt || device.createdAt;

  return {
    ...device,
    _id: getId(device),
    id: getId(device),
    device: device.device || 'unknown-device',
    name: device.name || device.device || 'Unnamed device',
    status: device.status || {},
    online: Boolean(device.status?.online),
    assignedUsers,
    assignedUserCount: Number(device.assignedUserCount ?? assignedUsers.length ?? 0),
    lastUpdate,
    lastUpdateText: lastUpdate ? formatRelativeTime(lastUpdate) : 'No data yet',
    lastUpdateTime: lastUpdate ? formatTime(lastUpdate) : '—',
  };
}

export async function getAdminSummary() {
  return adminRequest('/admin/summary');
}

export async function listAdminDevices() {
  const payload = await adminRequest('/admin/devices');
  const devices = Array.isArray(payload) ? payload : payload?.devices || payload?.items || [];
  return devices.map(normalizeAdminDevice).filter(Boolean);
}

export async function listAdminUsers() {
  const payload = await adminRequest('/admin/users');
  const users = Array.isArray(payload) ? payload : payload?.users || payload?.items || [];
  return users.map(normalizeAdminUser).filter(Boolean);
}

export async function createAdminDevice({ device, name }) {
  const payload = await adminRequest('/admin/devices', {
    method: 'POST',
    body: JSON.stringify({ device, name }),
  });

  return normalizeAdminDevice(payload?.device || payload);
}

export async function assignAdminDevice({ device, email }) {
  return adminRequest('/admin/devices/assign', {
    method: 'PATCH',
    body: JSON.stringify({ device, email }),
  });
}

export async function unassignAdminDevice({ device, email }) {
  return adminRequest('/admin/devices/unassign', {
    method: 'PATCH',
    body: JSON.stringify({ device, email }),
  });
}

export async function renameAdminDevice({ deviceId, name }) {
  const payload = await adminRequest(`/admin/devices/${encodeURIComponent(deviceId)}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

  return normalizeAdminDevice(payload?.device || payload);
}

export async function deleteAdminDevice(deviceId) {
  return adminRequest(`/admin/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}

export function buildAdminActivity(devices = []) {
  return devices
    .slice()
    .sort((a, b) => {
      const aTime = toDate(a.updatedAt || a.lastUpdate)?.getTime() || 0;
      const bTime = toDate(b.updatedAt || b.lastUpdate)?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 4)
    .map((device) => {
      if (device.online) {
        return {
          id: `online-${device.id}`,
          type: 'online',
          title: `Device ${device.device} is online`,
          time: device.lastUpdateText,
        };
      }

      return {
        id: `offline-${device.id}`,
        type: 'offline',
        title: `Device ${device.device} went offline`,
        time: device.lastUpdateText,
      };
    });
}
