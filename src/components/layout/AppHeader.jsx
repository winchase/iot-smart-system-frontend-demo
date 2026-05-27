import React from 'react';

function DashboardIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
    );
}

function HistoryIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-4 3 3 5-6" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17H5a2 2 0 0 1-2-2c0-1.1.9-2 2-2V11a7 7 0 1 1 14 0v2c1.1 0 2 .9 2 2a2 2 0 0 1-2 2h-4" />
            <path d="M9 21a3 3 0 0 0 6 0" />
        </svg>
    );
}

function LimitsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
    );
}

function SensorStatusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="7" y="3" width="10" height="18" rx="2" />
            <path d="M11 18h2" />
            <path d="M9 7h6" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="8" r="4" />
        </svg>
    );
}

function AdminIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}

function BrandIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h4l2-4 4 8 2-4h4" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a7 7 0 1 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    );
}

function HeaderIconButton({
                              icon,
                              label,
                              onClick,
                              badge = false,
                              isActive = false,
                          }) {
    return (
        <button
            type="button"
            className={`shared-header__icon-btn ${isActive ? 'shared-header__icon-btn--active' : ''}`}
            onClick={onClick}
            title={label}
            data-tooltip={label}
            aria-label={label}
        >
            {icon}
            {badge ? <span className="shared-header__icon-badge" /> : null}
        </button>
    );
}

export default function AppHeader({
                                      currentPage,
                                      theme,
                                      currentUser,
                                      onToggleTheme,
                                      onOpenDashboard,
                                      onOpenHistory,
                                      onOpenNotifications,
                                      onOpenSettings,
                                      onOpenSensorStatus,
                                      onOpenAuth,
                                      onOpenAdmin,
                                      unreadNotificationCount = 0,
                                  }) {
    return (
        <header className="shared-header">
            <div className="shared-header__left">
                <button
                    type="button"
                    className="shared-header__brand-btn"
                    onClick={onOpenDashboard}
                    aria-label="Dashboard"
                >
                    <div className="shared-header__logo">
                        <BrandIcon />
                    </div>

                    <div className="shared-header__brand">
                        <h1>Air Quality Analyzer</h1>
                        <p>Indoor Environment Monitoring</p>
                    </div>
                </button>
            </div>

            <div className="shared-header__right">
                <HeaderIconButton
                    icon={<DashboardIcon />}
                    label="Dashboard"
                    onClick={onOpenDashboard}
                    isActive={currentPage === 'monitoring'}
                />
                <HeaderIconButton
                    icon={<HistoryIcon />}
                    label="History"
                    onClick={onOpenHistory}
                    isActive={currentPage === 'history'}
                />
                <HeaderIconButton
                    icon={<BellIcon />}
                    label="Notifications"
                    onClick={onOpenNotifications}
                    isActive={currentPage === 'notifications'}
                    badge={unreadNotificationCount > 0}
                />
                <HeaderIconButton
                    icon={<SensorStatusIcon />}
                    label="Sensor Status"
                    onClick={onOpenSensorStatus}
                    isActive={currentPage === 'sensor-status'}
                />
                <HeaderIconButton
                    icon={<LimitsIcon />}
                    label="Limits"
                    onClick={onOpenSettings}
                    isActive={currentPage === 'settings'}
                />
                {currentUser?.admin ? (
                    <HeaderIconButton
                        icon={<AdminIcon />}
                        label="Admin Panel"
                        onClick={onOpenAdmin}
                        isActive={currentPage === 'admin'}
                    />
                ) : null}
                <HeaderIconButton
                    icon={<UserIcon />}
                    label={currentUser ? 'Profile' : 'Sign in'}
                    onClick={onOpenAuth}
                    isActive={currentPage === 'profile' || currentPage === 'login' || currentPage === 'register'}
                />
                <HeaderIconButton
                    icon={theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    label={theme === 'light' ? 'Dark theme' : 'Light theme'}
                    onClick={onToggleTheme}
                />
            </div>
        </header>
    );
}