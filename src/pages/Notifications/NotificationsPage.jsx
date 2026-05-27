import React, { useEffect, useMemo, useState } from 'react';
import './NotificationsPage.css';
import {
  DEFAULT_DEVICE_API,
  checkOffline,
  getCurrentDevice,
  listNotifications,
  markAllNotificationsAsRead,
} from '../../services/iotApi';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'info', label: 'Info' },
];

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 10v5" /><path d="M12 7h.01" /></svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg>
  );
}

function NotificationIcon({ level }) {
  if (level === 'critical' || level === 'warning') return <AlertTriangleIcon />;
  if (level === 'success') return <CheckCircleIcon />;
  return <InfoIcon />;
}

function NotificationCard({ item }) {
  return (
    <div className={`notification-page-card notification-page-card--${item.level} ${item.unread ? '' : 'notification-page-card--read'}`}>
      <div className={`notification-page-card__icon notification-page-card__icon--${item.level}`}>
        <NotificationIcon level={item.level} />
      </div>
      <div className="notification-page-card__content">
        <div className="notification-page-card__top">
          <div className="notification-page-card__heading">
            <h3>{item.title}</h3>
            {!item.unread ? <span className="notification-page-card__read-label">Read</span> : null}
          </div>
          <div className="notification-page-card__time"><span>{item.timestamp}</span></div>
        </div>
        <p className="notification-page-card__message">{item.message}</p>
        {item.recommendation ? <p className="notification-page-card__recommendation">{item.recommendation}</p> : null}
      </div>
    </div>
  );
}

function getEmptyMessage(filter) {
  if (filter === 'unread') return 'No unread notifications for the selected device.';
  if (filter === 'warnings') return 'No warning notifications for the selected device.';
  if (filter === 'info') return 'No info notifications for the selected device.';
  return 'No active notifications for the selected device.';
}

export default function NotificationsPage({ onBack, onNotificationsChanged }) {
  const [device, setDevice] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadNotifications({ checkDevice = false } = {}) {
    try {
      setLoading(true);
      setError('');
      const loadedDevice = await getCurrentDevice(DEFAULT_DEVICE_API);
      const deviceApi = loadedDevice?.device || DEFAULT_DEVICE_API;

      if (checkDevice) {
        await checkOffline(deviceApi).catch(() => null);
      }

      const loadedNotifications = await listNotifications(deviceApi);
      setDevice(loadedDevice);
      setNotifications(loadedNotifications);
      onNotificationsChanged?.(loadedNotifications.filter((item) => item.unread).length);
    } catch (err) {
      console.error(err);
      setError('Notifications could not be loaded from backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((item) => item.unread);
    if (filter === 'warnings') return notifications.filter((item) => item.level === 'warning' || item.level === 'critical');
    if (filter === 'info') return notifications.filter((item) => item.level === 'info' || item.level === 'success');
    return notifications;
  }, [notifications, filter]);

  async function handleMarkAllAsRead() {
    const deviceApi = device?.device || DEFAULT_DEVICE_API;
    try {
      await markAllNotificationsAsRead(deviceApi);
      setNotifications((prev) => prev.map((item) => ({ ...item, unread: false, read: true })));
      setFilter('unread');
      onNotificationsChanged?.(0);
      await loadNotifications();
    } catch (err) {
      console.error(err);
      setError('Notifications could not be marked as read.');
    }
  }

  async function handleRefresh() {
    await loadNotifications({ checkDevice: true });
  }

  return (
    <div className="notifications-page">
      {onBack ? (
        <button type="button" className="page-back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
      ) : null}

      <div className="notifications-page__topbar">
        <div>
          <h2 className="notifications-page__title">Notifications</h2>
          <p className="notifications-page__subtitle">Review alerts, warnings, and device updates from backend.</p>
        </div>
        <div className="notifications-page__summary"><span className="notifications-page__badge">{unreadCount} unread</span></div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="notifications-page__filters">
        {FILTERS.map((item) => (
          <button key={item.key} type="button" className={`notifications-page__filter-btn ${filter === item.key ? 'notifications-page__filter-btn--active' : ''}`} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {item.label}
          </button>
        ))}
        <button type="button" className="notifications-page__filter-btn notifications-page__filter-btn--primary" onClick={handleRefresh} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      <section className="notifications-page__list">
        {filteredNotifications.length ? filteredNotifications.map((item) => <NotificationCard key={item.id || item._id} item={item} />) : (
          <div className="notification-page-card notification-page-card--success">
            <div className="notification-page-card__icon notification-page-card__icon--success"><CheckCircleIcon /></div>
            <div className="notification-page-card__content">
              <div className="notification-page-card__top"><h3>No notifications</h3><div className="notification-page-card__time"><span>{device?.name || DEFAULT_DEVICE_API}</span></div></div>
              <p className="notification-page-card__message">{getEmptyMessage(filter)}</p>
            </div>
          </div>
        )}
      </section>
      <div className="notifications-page__actions">
        <button type="button" className="notifications-page__mark-btn" onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || loading}>Mark all as read</button>
      </div>
    </div>
  );
}
