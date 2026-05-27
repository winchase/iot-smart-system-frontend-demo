import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminPage.css';
import {
  assignAdminDevice,
  buildAdminActivity,
  createAdminDevice,
  deleteAdminDevice,
  getAdminSummary,
  getUserDisplayName,
  listAdminDevices,
  listAdminUsers,
  renameAdminDevice,
  unassignAdminDevice,
} from '../../services/adminService.js';

function Icon({ type }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    device: (
      <>
        <rect x="4" y="8" width="16" height="10" rx="2" />
        <path d="M8 8V5h8v3" />
        <path d="M8 14h.01" />
        <path d="M12 14h4" />
      </>
    ),
    online: (
      <>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M8.5 16a6 6 0 0 1 7 0" />
        <path d="M12 20h.01" />
      </>
    ),
    offline: (
      <>
        <path d="M2 2l20 20" />
        <path d="M8.5 16a6 6 0 0 1 7 0" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5-2.39" />
        <path d="M14 10.17a10.94 10.94 0 0 1 5 2.38" />
        <path d="M12 20h.01" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    assign: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
    filter: (
      <>
        <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[type] || paths.info}</svg>;
}

function MetricCard({ type, label, value, caption, tone = 'blue' }) {
  return (
    <article className={`admin-metric admin-metric--${tone}`}>
      <div className="admin-metric__icon"><Icon type={type} /></div>
      <div className="admin-metric__body">
        <p>{label}</p>
        <strong>{value ?? '—'}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function StatusBadge({ online }) {
  return (
    <span className={`admin-status-badge ${online ? 'admin-status-badge--online' : 'admin-status-badge--offline'}`}>
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="admin-modal__header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Message({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`admin-message admin-message--${type}`}>{children}</div>;
}

function getDeviceAssignedUsersText(device) {
  if (!device?.assignedUsers?.length) return 'Unassigned';
  return device.assignedUsers.map(getUserDisplayName).join(', ');
}

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [working, setWorking] = useState(false);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) || devices[0] || null,
    [devices, selectedDeviceId]
  );

  function getAssignedUserEmails(device) {
    return new Set((device?.assignedUsers || []).map((user) => user.email).filter(Boolean));
  }

  function getModalUserOptions(device, mode) {
    if (mode === 'unassign') {
      return (device?.assignedUsers || []).filter((user) => user.email);
    }

    const assignedEmails = getAssignedUserEmails(device);
    return users.filter((user) => user.email && !assignedEmails.has(user.email));
  }

  const modalUserOptions = useMemo(
    () => getModalUserOptions(selectedDevice, modal),
    [selectedDevice, modal, users]
  );

  const refreshAdminData = useCallback(async () => {
    setError('');
    setStatus((current) => (current === 'ready' ? 'refreshing' : 'pending'));

    try {
      const [nextSummary, nextDevices, nextUsers] = await Promise.all([
        getAdminSummary(),
        listAdminDevices(),
        listAdminUsers(),
      ]);

      setSummary(nextSummary);
      setDevices(nextDevices);
      setUsers(nextUsers);
      setSelectedDeviceId((current) => current || nextDevices[0]?.id || '');
      setSelectedEmail((current) => current || nextUsers[0]?.email || '');
      setStatus('ready');
    } catch (requestError) {
      console.error('Admin data could not be loaded:', requestError);
      setError(requestError.message || 'Admin data could not be loaded.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const filteredDevices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return devices;

    return devices.filter((device) => {
      const searchable = [
        device.name,
        device.device,
        device.assignedUsers.map((user) => `${getUserDisplayName(user)} ${user.email}`).join(' '),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [devices, query]);

  const recentActivity = useMemo(() => buildAdminActivity(devices), [devices]);

  const assignmentStats = useMemo(() => {
    const totalDevices = summary?.totalDevices ?? devices.length;
    const assigned = summary?.assignedDevices ?? devices.filter((device) => device.assignedUserCount > 0).length;
    const unassigned = summary?.unassignedDevices ?? Math.max(0, totalDevices - assigned);
    const online = summary?.onlineDevices ?? devices.filter((device) => device.online).length;
    const offline = summary?.offlineDevices ?? Math.max(0, totalDevices - online);

    return { totalDevices, assigned, unassigned, online, offline };
  }, [devices, summary]);

  async function handleCreateDevice(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setWorking(true);

    const formData = new FormData(event.currentTarget);
    const device = String(formData.get('device') || '').trim();
    const name = String(formData.get('name') || '').trim();

    try {
      await createAdminDevice({ device, name });
      setSuccess(`Device ${device} was created.`);
      setModal(null);
      await refreshAdminData();
    } catch (requestError) {
      setError(requestError.message || 'Device could not be created.');
    } finally {
      setWorking(false);
    }
  }

  async function handleRenameDevice(event) {
    event.preventDefault();
    if (!selectedDevice) return;

    setError('');
    setSuccess('');
    setWorking(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();

    try {
      await renameAdminDevice({ deviceId: selectedDevice.id, name });
      setSuccess(`Device ${selectedDevice.device} was renamed.`);
      setModal(null);
      await refreshAdminData();
    } catch (requestError) {
      setError(requestError.message || 'Device could not be renamed.');
    } finally {
      setWorking(false);
    }
  }

  async function handleAssignDevice(event) {
    event.preventDefault();
    const device = selectedDevice?.device;
    const email = selectedEmail;

    if (!device || !email) return;

    setError('');
    setSuccess('');
    setWorking(true);

    try {
      await assignAdminDevice({ device, email });
      setSuccess(`Device ${device} was assigned to ${email}.`);
      setModal(null);
      await refreshAdminData();
    } catch (requestError) {
      setError(requestError.message || 'Device could not be assigned.');
    } finally {
      setWorking(false);
    }
  }

  async function handleUnassignDevice(event) {
    event.preventDefault();
    const device = selectedDevice?.device;
    const email = selectedEmail;

    if (!device || !email) return;

    setError('');
    setSuccess('');
    setWorking(true);

    try {
      await unassignAdminDevice({ device, email });
      setSuccess(`Assignment for ${device} was removed from ${email}.`);
      setModal(null);
      await refreshAdminData();
    } catch (requestError) {
      setError(requestError.message || 'Device assignment could not be removed.');
    } finally {
      setWorking(false);
    }
  }

  async function handleDeleteDevice(device) {
    if (!device?.id) return;

    const confirmed = window.confirm(`Delete device ${device.device}? This action cannot be undone.`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setWorking(true);

    try {
      await deleteAdminDevice(device.id);
      setSuccess(`Device ${device.device} was deleted.`);
      await refreshAdminData();
    } catch (requestError) {
      setError(requestError.message || 'Device could not be deleted.');
    } finally {
      setWorking(false);
    }
  }

  function selectModalDefaults(device, mode) {
    if (!device) {
      setSelectedDeviceId('');
      setSelectedEmail('');
      return;
    }

    setSelectedDeviceId(device.id);
    const options = getModalUserOptions(device, mode);
    setSelectedEmail(options[0]?.email || '');
  }

  function handleModalDeviceChange(event) {
    const nextDeviceId = event.target.value;
    const nextDevice = devices.find((device) => device.id === nextDeviceId) || null;

    setSelectedDeviceId(nextDeviceId);
    const options = getModalUserOptions(nextDevice, modal);
    setSelectedEmail(options[0]?.email || '');
  }

  function openAssignModal(device = selectedDevice) {
    selectModalDefaults(device, 'assign');
    setModal('assign');
  }

  function openUnassignModal(device = selectedDevice) {
    selectModalDefaults(device, 'unassign');
    setModal('unassign');
  }

  function openRenameModal(device) {
    setSelectedDeviceId(device.id);
    setModal('rename');
  }

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <div>
          <div className="admin-page__title-row">
            <h1>Admin Panel</h1>
            <span className="admin-access-badge"><Icon type="shield" /> Admin access</span>
          </div>
          <p>Manage devices, users and assignments</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={() => setModal('create')}>
          <Icon type="plus" /> Create Device
        </button>
      </div>

      <Message type="error">{error}</Message>
      <Message type="success">{success}</Message>
      {status === 'pending' ? <Message>Loading admin data...</Message> : null}

      <div className="admin-metrics-grid">
        <MetricCard type="device" label="Total Devices" value={summary?.totalDevices ?? devices.length} caption="All registered devices" tone="blue" />
        <MetricCard type="online" label="Online Devices" value={summary?.onlineDevices ?? 0} caption="Currently online" tone="green" />
        <MetricCard type="offline" label="Offline Devices" value={summary?.offlineDevices ?? 0} caption="Currently offline" tone="red" />
        <MetricCard type="users" label="Total Users" value={summary?.totalUsers ?? users.length} caption="Registered users" tone="purple" />
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-main-column">
          <article className="admin-card admin-card--device-table">
          <div className="admin-card__header admin-card__header--table">
            <div>
              <h2>Device Management</h2>
              <p>Create, assign, rename and remove IoT devices.</p>
            </div>
            <div className="admin-search-wrap">
              <Icon type="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search devices or users"
              />
              <button type="button" className="admin-filter-btn" onClick={() => refreshAdminData()} title="Refresh data">
                <Icon type="filter" />
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-device-table">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>Device ID</th>
                  <th>Status</th>
                  <th>Assigned User</th>
                  <th>Last Update</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <strong>{device.name}</strong>
                    </td>
                    <td><code>{device.device}</code></td>
                    <td><StatusBadge online={device.online} /></td>
                    <td className={device.assignedUsers.length ? '' : 'admin-muted'}>{getDeviceAssignedUsersText(device)}</td>
                    <td title={device.lastUpdateTime}>{device.lastUpdateText}</td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" title="Assign device" onClick={() => openAssignModal(device)}><Icon type="assign" /></button>
                        <button type="button" title="Rename device" onClick={() => openRenameModal(device)}><Icon type="edit" /></button>
                        <button type="button" title="Delete device" className="admin-action-danger" onClick={() => handleDeleteDevice(device)}><Icon type="trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredDevices.length ? (
                  <tr>
                    <td colSpan="6" className="admin-empty-row">No devices found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          </article>

          <div className="admin-bottom-grid">
            <article className="admin-card admin-card--users">
              <div className="admin-card__header">
                <h2>User Accounts</h2>
                <span>{users.length} users</span>
              </div>
              <div className="admin-users-table">
                <div className="admin-users-table__head">
                  <span>User</span>
                  <span>Email</span>
                  <span>Devices Assigned</span>
                </div>
                {users.slice(0, 6).map((user) => (
                  <div key={user.id} className="admin-user-row">
                    <span className="admin-user-row__name"><Icon type="users" /> {user.username}</span>
                    <span>{user.email}</span>
                    <strong>{user.deviceCount}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-card admin-card--overview">
              <div className="admin-card__header">
                <h2>Assignment Overview</h2>
                <span>Live data</span>
              </div>
              <div className="admin-overview-content">
                <div
                  className="admin-donut"
                  style={{
                    '--assigned': `${assignmentStats.totalDevices ? (assignmentStats.assigned / assignmentStats.totalDevices) * 100 : 0}%`,
                    '--online': `${assignmentStats.totalDevices ? (assignmentStats.online / assignmentStats.totalDevices) * 100 : 0}%`,
                  }}
                />
                <div className="admin-overview-stats">
                  <span><i className="dot dot--blue" /> Assigned <strong>{assignmentStats.assigned}</strong></span>
                  <span><i className="dot dot--orange" /> Unassigned <strong>{assignmentStats.unassigned}</strong></span>
                  <span><i className="dot dot--green" /> Online <strong>{assignmentStats.online}</strong></span>
                  <span><i className="dot dot--red" /> Offline <strong>{assignmentStats.offline}</strong></span>
                  <p>Total Devices: {assignmentStats.totalDevices}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <aside className="admin-sidebar">
          <article className="admin-card admin-card--quick">
            <h2>Quick Actions</h2>
            <button type="button" className="admin-quick-btn admin-quick-btn--primary" onClick={() => setModal('create')}>
              <Icon type="plus" /> Add Device
            </button>
            <button type="button" className="admin-quick-btn" onClick={() => openAssignModal()}>
              <Icon type="assign" /> Assign Device
            </button>
            <button type="button" className="admin-quick-btn admin-quick-btn--danger" onClick={() => openUnassignModal()}>
              <Icon type="trash" /> Remove Assignment
            </button>
          </article>

          <article className="admin-card admin-card--notifications">
            <div className="admin-card__header">
              <h2>Recent Notifications</h2>
              <button type="button" onClick={refreshAdminData}>View all</button>
            </div>
            <div className="admin-activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="admin-activity-item">
                  <span className={`admin-activity-icon admin-activity-icon--${activity.type}`}>
                    <Icon type={activity.type === 'online' ? 'online' : 'offline'} />
                  </span>
                  <strong>{activity.title}</strong>
                  <time>{activity.time}</time>
                </div>
              ))}
              {!recentActivity.length ? <p className="admin-muted">No recent device activity.</p> : null}
            </div>
          </article>

          <article className="admin-card admin-card--note">
            <span className="admin-note-icon"><Icon type="info" /></span>
            <div>
              <h2>Admin Notes</h2>
              <p>Only admins can create, delete and assign devices.</p>
            </div>
          </article>
        </aside>
      </div>

      

      {modal === 'create' ? (
        <Modal title="Create Device" subtitle="Register a new ESP32 device key." onClose={() => setModal(null)}>
          <form className="admin-form" onSubmit={handleCreateDevice}>
            <label>
              Device Name
              <input name="name" placeholder="Hallway Sensor" required />
            </label>
            <label>
              Device API Key
              <input name="device" placeholder="esp32005" required />
            </label>
            <button type="submit" className="admin-primary-btn" disabled={working}>{working ? 'Creating...' : 'Create Device'}</button>
          </form>
        </Modal>
      ) : null}

      {modal === 'rename' && selectedDevice ? (
        <Modal title="Rename Device" subtitle={selectedDevice.device} onClose={() => setModal(null)}>
          <form className="admin-form" onSubmit={handleRenameDevice}>
            <label>
              New Device Name
              <input name="name" defaultValue={selectedDevice.name} required />
            </label>
            <button type="submit" className="admin-primary-btn" disabled={working}>{working ? 'Saving...' : 'Save Name'}</button>
          </form>
        </Modal>
      ) : null}

      {(modal === 'assign' || modal === 'unassign') ? (
        <Modal
          title={modal === 'assign' ? 'Assign Device' : 'Remove Device Assignment'}
          subtitle={modal === 'assign' ? 'Connect a device to a user account.' : 'Remove user access from a device.'}
          onClose={() => setModal(null)}
        >
          <form className="admin-form" onSubmit={modal === 'assign' ? handleAssignDevice : handleUnassignDevice}>
            <label>
              Device
              <select value={selectedDeviceId} onChange={handleModalDeviceChange} required>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>{device.name} — {device.device}</option>
                ))}
              </select>
            </label>
            <label>
              User Email
              <select
                value={selectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
                required
                disabled={!modalUserOptions.length}
              >
                {modalUserOptions.map((user) => (
                  <option key={user.id || user.email} value={user.email}>{getUserDisplayName(user)} — {user.email}</option>
                ))}
              </select>
              {modal === 'assign' && !modalUserOptions.length ? (
                <p className="admin-form__hint">All users are already assigned to this device.</p>
              ) : null}
              {modal === 'unassign' && !modalUserOptions.length ? (
                <p className="admin-form__hint admin-form__hint--warning">This device has no assigned users.</p>
              ) : null}
            </label>
            <button type="submit" className={modal === 'assign' ? 'admin-primary-btn' : 'admin-danger-btn'} disabled={working || !modalUserOptions.length}>
              {working ? 'Saving...' : modal === 'assign' ? 'Assign Device' : 'Remove Assignment'}
            </button>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
