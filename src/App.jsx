import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout.jsx';
import MonitoringPage from './pages/Monitoring/MonitoringPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';
import HistoryPage from './pages/History/HistoryPage.jsx';
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx';
import SensorStatusPage from './pages/SensorStatus/SensorStatusPage.jsx';
import AuthPage from './pages/Auth/AuthPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import AdminPage from './pages/Admin/AdminPage.jsx';
import { DEFAULT_DEVICE_API, listNotifications } from './services/iotApi.js';
import {
    clearAuthSession,
    getStoredToken,
    getStoredUser,
    loadCurrentUser,
} from './services/authService.js';

const PAGE_TO_PATH = {
    monitoring: '/',
    history: '/history',
    notifications: '/notifications',
    settings: '/settings',
    'sensor-status': '/sensor-status',
    login: '/login',
    register: '/register',
    profile: '/profile',
    admin: '/admin',
};

function getPageFromPath(pathname) {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';

    if (cleanPath === '/history') return 'history';
    if (cleanPath === '/notifications') return 'notifications';
    if (cleanPath === '/settings') return 'settings';
    if (cleanPath === '/sensor-status') return 'sensor-status';
    if (cleanPath === '/login') return 'login';
    if (cleanPath === '/register') return 'register';
    if (cleanPath === '/profile') return 'profile';
    if (cleanPath === '/admin') return 'admin';

    return 'monitoring';
}

function updateBrowserUrl(page, mode = 'push') {
    const path = PAGE_TO_PATH[page] || PAGE_TO_PATH.monitoring;

    if (window.location.pathname === path) {
        return;
    }

    const state = { page };

    if (mode === 'replace') {
        window.history.replaceState(state, '', path);
        return;
    }

    window.history.pushState(state, '', path);
}

export default function App() {
    const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        updateBrowserUrl(currentPage, 'replace');

        function handlePopState() {
            setCurrentPage(getPageFromPath(window.location.pathname));
        }

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        let mounted = true;

        async function refreshUser() {
            if (!getStoredToken()) {
                return;
            }

            try {
                const user = await loadCurrentUser();

                if (mounted) {
                    setCurrentUser(user);
                }
            } catch (error) {
                console.warn('Stored auth token is not valid anymore:', error);
                clearAuthSession();

                if (mounted) {
                    setCurrentUser(null);
                }
            }
        }

        refreshUser();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const navigateTo = useCallback((page) => {
        setCurrentPage(page);
        updateBrowserUrl(page);
    }, []);

    const refreshUnreadNotifications = useCallback(async (nextUnreadCount) => {
        if (typeof nextUnreadCount === 'number') {
            setUnreadNotificationCount(Math.max(0, nextUnreadCount));
            return;
        }

        try {
            const notifications = await listNotifications(DEFAULT_DEVICE_API);
            const unreadCount = notifications.filter((notification) => notification.unread).length;
            setUnreadNotificationCount(unreadCount);
        } catch (error) {
            console.warn('Unread notifications could not be loaded:', error);
            setUnreadNotificationCount(0);
        }
    }, []);

    useEffect(() => {
        refreshUnreadNotifications();
        const intervalId = setInterval(() => refreshUnreadNotifications(), 15000);
        return () => clearInterval(intervalId);
    }, [refreshUnreadNotifications]);

    function openNotificationsPage() {
        navigateTo('notifications');
        refreshUnreadNotifications();
    }

    function openAuthPage() {
        navigateTo(currentUser ? 'profile' : 'login');
    }

    function handleAuthSuccess(user) {
        setCurrentUser(user);
        navigateTo('profile');
        refreshUnreadNotifications();
    }

    function handleLogout() {
        clearAuthSession();
        setCurrentUser(null);
        navigateTo('login');
    }

    function toggleTheme() {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }

    return (
        <AppLayout
            currentPage={currentPage}
            theme={theme}
            currentUser={currentUser}
            onToggleTheme={toggleTheme}
            onOpenDashboard={() => navigateTo('monitoring')}
            onOpenHistory={() => navigateTo('history')}
            onOpenNotifications={openNotificationsPage}
            unreadNotificationCount={unreadNotificationCount}
            onOpenSettings={() => navigateTo('settings')}
            onOpenSensorStatus={() => navigateTo('sensor-status')}
            onOpenAuth={openAuthPage}
            onOpenAdmin={() => navigateTo('admin')}
        >
            {currentPage === 'monitoring' && (
                <MonitoringPage
                    onOpenSettings={() => navigateTo('settings')}
                    onOpenHistory={() => navigateTo('history')}
                    onOpenNotifications={openNotificationsPage}
                    onOpenSensorStatus={() => navigateTo('sensor-status')}
                />
            )}

            {currentPage === 'settings' && (
                <SettingsPage onBack={() => navigateTo('monitoring')} />
            )}

            {currentPage === 'history' && (
                <HistoryPage />
            )}

            {currentPage === 'notifications' && (
                <NotificationsPage
                    onNotificationsChanged={refreshUnreadNotifications}
                />
            )}

            {currentPage === 'sensor-status' && (
                <SensorStatusPage />
            )}

            {currentPage === 'login' && (
                <AuthPage
                    mode="login"
                    onModeChange={(mode) => navigateTo(mode)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            {currentPage === 'register' && (
                <AuthPage
                    mode="register"
                    onModeChange={(mode) => navigateTo(mode)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            {currentPage === 'profile' && (
                currentUser ? (
                    <ProfilePage
                        user={currentUser}
                        onLogout={handleLogout}
                        onOpenNotifications={openNotificationsPage}
                        onOpenSensorStatus={() => navigateTo('sensor-status')}
                    />
                ) : (
                    <AuthPage
                        mode="login"
                        onModeChange={(mode) => navigateTo(mode)}
                        onAuthSuccess={handleAuthSuccess}
                    />
                )
            )}

            {currentPage === 'admin' && (
                currentUser?.admin ? (
                    <AdminPage />
                ) : currentUser ? (
                    <section className="admin-message admin-message--error">
                        You do not have permission to open the Admin Panel.
                    </section>
                ) : (
                    <AuthPage
                        mode="login"
                        onModeChange={(mode) => navigateTo(mode)}
                        onAuthSuccess={handleAuthSuccess}
                    />
                )
            )}
        </AppLayout>
    );
}
