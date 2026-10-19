import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
    APP_LAUNCHER_APPS,
    APP_LAUNCHER_STORAGE_KEY,
    DEFAULT_APP_KEY,
    appHasSidebarMenus,
    createCustomApp,
    getAppLauncherApp,
    orderApps,
    readAppOrder,
    readCustomApps,
    writeAppOrder,
    writeCustomApps
} from './appLauncherApps';

const AppLauncherContext = createContext(null);

const allAppsFrom = (customApps) => [...APP_LAUNCHER_APPS, ...customApps];

const readStoredAppKey = (extraApps = []) => {
    try {
        const storedKey = getAppLauncherApp(sessionStorage.getItem(APP_LAUNCHER_STORAGE_KEY), extraApps).key;
        return appHasSidebarMenus(storedKey) ? storedKey : DEFAULT_APP_KEY;
    } catch (error) {
        return DEFAULT_APP_KEY;
    }
};

export const AppLauncherProvider = ({ children }) => {
    const [customApps, setCustomApps] = useState(readCustomApps);
    const [appOrder, setAppOrder] = useState(() => readAppOrder(allAppsFrom(readCustomApps())));
    const [selectedApp, setSelectedAppState] = useState(() => readStoredAppKey(readCustomApps()));

    const persistOrder = useCallback((keys) => {
        setAppOrder(keys);
        writeAppOrder(keys);
    }, []);

    const apps = useMemo(() => orderApps(allAppsFrom(customApps), appOrder), [appOrder, customApps]);

    const setSelectedApp = useCallback(
        (key) => {
            const nextKey = getAppLauncherApp(key, customApps).key;
            setSelectedAppState(nextKey);

            try {
                sessionStorage.setItem(APP_LAUNCHER_STORAGE_KEY, nextKey);
            } catch (error) {
                // Ignore storage errors and keep the in-memory selection.
            }
        },
        [customApps]
    );

    const addCustomApp = useCallback(({ label, to, iconClass }) => {
        const nextApp = createCustomApp({ label, to, iconClass });
        if (!nextApp.label || !nextApp.to) return null;

        setCustomApps((current) => {
            const nextApps = [...current, nextApp];
            writeCustomApps(nextApps);
            return nextApps;
        });
        setAppOrder((current) => {
            const nextOrder = current.includes(nextApp.key) ? current : [...current, nextApp.key];
            writeAppOrder(nextOrder);
            return nextOrder;
        });
        return nextApp;
    }, []);

    const removeCustomApp = useCallback((key) => {
        setCustomApps((current) => {
            const nextApps = current.filter((app) => app.key !== key);
            writeCustomApps(nextApps);
            return nextApps;
        });
        setAppOrder((current) => {
            const nextOrder = current.filter((appKey) => appKey !== key);
            writeAppOrder(nextOrder);
            return nextOrder;
        });
    }, []);

    const reorderApps = useCallback(
        (fromIndex, toIndex) => {
            if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
                return;
            }

            persistOrder(
                (() => {
                    const keys = apps.map((app) => app.key);
                    if (fromIndex >= keys.length || toIndex >= keys.length) return keys;
                    const next = [...keys];
                    const [moved] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, moved);
                    return next;
                })()
            );
        },
        [apps, persistOrder]
    );

    const value = useMemo(
        () => ({
            apps,
            selectedApp,
            selectedAppMeta: getAppLauncherApp(selectedApp, customApps),
            setSelectedApp,
            addCustomApp,
            removeCustomApp,
            reorderApps
        }),
        [apps, customApps, selectedApp, setSelectedApp, addCustomApp, removeCustomApp, reorderApps]
    );

    return <AppLauncherContext.Provider value={value}>{children}</AppLauncherContext.Provider>;
};

export const useAppLauncher = () => {
    const context = useContext(AppLauncherContext);

    if (!context) {
        return {
            apps: APP_LAUNCHER_APPS,
            selectedApp: DEFAULT_APP_KEY,
            selectedAppMeta: getAppLauncherApp(DEFAULT_APP_KEY),
            setSelectedApp: () => {},
            addCustomApp: () => null,
            removeCustomApp: () => {},
            reorderApps: () => {}
        };
    }

    return context;
};
