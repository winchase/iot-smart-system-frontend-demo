const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888';

export const AUTH_TOKEN_KEY = 'iot_auth_token';
export const AUTH_USER_KEY = 'iot_auth_user';

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function saveAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function authRequest(path, options = {}) {
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

export async function loginUser({ email, password }) {
  const payload = await authRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  saveAuthSession(payload);
  return payload.user;
}

export async function registerUser({ username, email, password }) {
  const payload = await authRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

  saveAuthSession(payload);
  return payload.user;
}

export async function loadCurrentUser() {
  const user = await authRequest('/auth/me');
  const token = getStoredToken();

  saveAuthSession({ token, user });
  return user;
}
