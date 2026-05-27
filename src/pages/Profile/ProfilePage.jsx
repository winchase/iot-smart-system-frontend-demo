import React, { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_DEVICE_API,
  formatRelativeTime,
  listDevices,
  listMeasurements,
  listNotifications,
} from '../../services/iotApi.js';
import './ProfilePage.css';

function getDeviceState(device, measurements) {
  const latest = measurements[measurements.length - 1];
  const lastUpdate = latest?.createdAt || device?.status?.updatedAt;

  return {
    isOnline: Boolean(device?.status?.online),
    lastUpdate,
  };
}

export default function ProfilePage({ user, onLogout, onOpenNotifications, onOpenSensorStatus }) {
  const [status, setStatus] = useState('pending');
  const [devices, setDevices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfileData() {
      try {
        setStatus('pending');
        setError('');

        const [deviceItems, notificationItems, measurementItems] = await Promise.all([
          listDevices(),
          listNotifications(DEFAULT_DEVICE_API).catch(() => []),
          listMeasurements(DEFAULT_DEVICE_API).catch(() => []),
        ]);

        if (!mounted) return;

        setDevices(deviceItems);
        setNotifications(notificationItems);
        setMeasurements(measurementItems);
        setStatus('ready');
      } catch (loadError) {
        if (!mounted) return;

        setError(loadError.message || 'Profile data could not be loaded');
        setStatus('error');
      }
    }

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.unread),
    [notifications]
  );

  const primaryDevice = devices.find((device) => device.device === DEFAULT_DEVICE_API) || devices[0] || null;
  const primaryDeviceState = getDeviceState(primaryDevice, measurements);

  return (
    <section className="profile-page">
      <div className="profile-page__hero">
        <div>
          <p className="profile-page__eyebrow">My profile</p>
          <h2>{user?.username || 'User account'}</h2>
          <p>{user?.email || 'Signed in user'}</p>
        </div>

        <button type="button" className="profile-page__logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="profile-grid">
        <article className="profile-card">
          <div className="profile-card__header">
            <h3>My devices</h3>
            <span className="profile-card__badge">{status === 'pending' ? 'Loading...' : `${devices.length} device${devices.length === 1 ? '' : 's'}`}</span>
          </div>

          {devices.length ? (
            <div className="profile-device-list">
              {devices.map((device) => {
                const isOnline = Boolean(device.status?.online);

                return (
                  <div className="profile-device" key={device._id || device.device}>
                    <div>
                      <strong>{device.name || device.device}</strong>
                      <span>{device.device}</span>
                    </div>

                    <span className={`profile-pill ${isOnline ? 'profile-pill--success' : 'profile-pill--danger'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="profile-card__empty">No devices loaded yet.</p>
          )}
        </article>

        <article className="profile-card profile-card--clickable" onClick={onOpenSensorStatus}>
          <div className="profile-card__header">
            <h3>Device status</h3>
            <span className="profile-card__badge">{primaryDevice?.name || 'Current device'}</span>
          </div>

          <div className="profile-status-list">
            <div className="profile-status-row">
              <span>Connection</span>
              <strong className={primaryDeviceState.isOnline ? 'profile-text-success' : 'profile-text-danger'}>
                {primaryDeviceState.isOnline ? 'Online' : 'Offline'}
              </strong>
            </div>

            <div className="profile-status-row">
              <span>Last activity</span>
              <strong>{primaryDeviceState.lastUpdate ? formatRelativeTime(primaryDeviceState.lastUpdate) : '—'}</strong>
            </div>
          </div>
        </article>

        <article className="profile-card profile-card--clickable" onClick={onOpenNotifications}>
          <div className="profile-card__header">
            <h3>Recent notifications</h3>
            <span className="profile-card__badge">{unreadNotifications.length} unread</span>
          </div>

          {notifications.slice(0, 4).length ? (
            <div className="profile-notification-list">
              {notifications.slice(0, 4).map((notification) => (
                <div className="profile-notification" key={notification.id || notification._id}>
                  <strong>{notification.title || notification.type}</strong>
                  <span>{notification.timestamp}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-card__empty">No notifications loaded yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}
