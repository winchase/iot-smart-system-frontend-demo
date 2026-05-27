import React from 'react';
import AppHeader from './AppHeader.jsx';

export default function AppLayout({
                                      children,
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
                                      unreadNotificationCount,
                                  }) {
    return (
        <div className="app-layout">
            <AppHeader
                currentPage={currentPage}
                theme={theme}
                currentUser={currentUser}
                onToggleTheme={onToggleTheme}
                onOpenDashboard={onOpenDashboard}
                onOpenHistory={onOpenHistory}
                onOpenNotifications={onOpenNotifications}
                onOpenSettings={onOpenSettings}
                onOpenSensorStatus={onOpenSensorStatus}
                onOpenAuth={onOpenAuth}
                onOpenAdmin={onOpenAdmin}
                unreadNotificationCount={unreadNotificationCount}
            />
            <main className={`app-layout__content ${currentPage === 'admin' ? 'app-layout__content--admin' : ''}`}>{children}</main>
        </div>
    );
}