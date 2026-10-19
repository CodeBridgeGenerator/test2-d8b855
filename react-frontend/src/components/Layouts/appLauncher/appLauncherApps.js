export const DEFAULT_APP_KEY = 'my-app';
export const APP_LAUNCHER_STORAGE_KEY = 'selectedAppLauncher';
export const CUSTOM_APPS_STORAGE_KEY = 'customAppLauncherProducts';
export const APP_ORDER_STORAGE_KEY = 'appLauncherOrder';

export const APP_LAUNCHER_ICON_OPTIONS = [
    'pi pi-globe',
    'pi pi-link',
    'pi pi-briefcase',
    'pi pi-building',
    'pi pi-sitemap',
    'pi pi-th-large',
    'pi pi-desktop',
    'pi pi-mobile',
    'pi pi-cloud',
    'pi pi-database',
    'pi pi-chart-bar',
    'pi pi-chart-line',
    'pi pi-users',
    'pi pi-user',
    'pi pi-id-card',
    'pi pi-envelope',
    'pi pi-send',
    'pi pi-comments',
    'pi pi-calendar',
    'pi pi-clock',
    'pi pi-folder',
    'pi pi-file',
    'pi pi-image',
    'pi pi-video',
    'pi pi-shopping-cart',
    'pi pi-credit-card',
    'pi pi-wallet',
    'pi pi-map-marker',
    'pi pi-compass',
    'pi pi-bolt',
    'pi pi-star',
    'pi pi-heart',
    'pi pi-shield',
    'pi pi-lock',
    'pi pi-key',
    'pi pi-cog',
    'pi pi-wrench',
    'pi pi-box',
    'pi pi-server',
    'pi pi-code'
];

export const APP_LAUNCHER_APPS = [
    {
        key: 'my-app',
        label: 'My App',
        to: '/cbAdmin/dashboard',
        iconClass: 'pi pi-th-large',
        hasSidebarMenu: true
    },
    {
        key: 'people',
        label: 'People',
        to: '/cbAdmin/users',
        iconClass: 'pi pi-users',
        hasSidebarMenu: true
    },
    {
        key: 'companies',
        label: 'Companies',
        to: '/cbAdmin/companies',
        iconClass: 'pi pi-building',
        hasSidebarMenu: true
    },
    {
        key: 'security',
        label: 'Security',
        to: '/cbAdmin/permissionServices',
        iconClass: 'pi pi-shield',
        hasSidebarMenu: true
    },
    {
        key: 'storage',
        label: 'Storage',
        to: '/cbAdmin/documentStorages',
        iconClass: 'pi pi-folder',
        hasSidebarMenu: true
    },
    {
        key: 'hypercare',
        label: 'Hypercare',
        to: '/cbAdmin/mails',
        iconClass: 'pi pi-heart',
        hasSidebarMenu: true
    },
    {
        key: 'communication',
        label: 'Communication',
        to: '/cbAdmin/notifications',
        iconClass: 'pi pi-comments',
        hasSidebarMenu: true
    },
    {
        key: 'operations',
        label: 'Operations',
        to: '/cbAdmin/mailQues',
        iconClass: 'pi pi-cog',
        hasSidebarMenu: true
    }
];

const PATH_APP_PREFIXES = [
    [
        'companies',
        [
            '/cbAdmin/companies',
            '/cbAdmin/branches',
            '/cbAdmin/departments',
            '/cbAdmin/sections',
            '/cbAdmin/departmentAdmin',
            '/cbAdmin/departmentHOD',
            '/cbAdmin/departmentHOS',
            '/cbAdmin/superior',
            '/cbAdmin/employees',
            '/cbAdmin/staffinfo',
            '/cbAdmin/DashboardCompanyData'
        ]
    ],
    [
        'people',
        [
            '/cbAdmin/users',
            '/cbAdmin/userInvites',
            '/cbAdmin/profiles',
            '/cbAdmin/roles',
            '/cbAdmin/positions',
            '/cbAdmin/DashboardHRControls',
            '/cbAdmin/userLogin',
            '/cbAdmin/userAddresses',
            '/cbAdmin/userPhones'
        ]
    ],
    [
        'communication',
        ['/cbAdmin/notifications', '/cbAdmin/fcmMessages', '/cbAdmin/notificationTemplates', '/cbAdmin/templates', '/cbAdmin/inbox']
    ],
    ['storage', ['/cbAdmin/documentationDetails', '/cbAdmin/documentStorages', '/cbAdmin/assets']],
    ['security', ['/cbAdmin/permissionServices', '/cbAdmin/errorLogs', '/cbAdmin/audits']],
    ['hypercare', ['/cbAdmin/helpSidebarContents', '/cbAdmin/supportTickets', '/supportTickets']],
    ['operations', ['/cbAdmin/mailQues']]
];

export const isExternalAppLink = (to = '') => /^https?:\/\//i.test(String(to).trim());

export const normalizeAppLink = (to = '') => {
    const value = String(to).trim();
    if (!value) return '';
    if (value.startsWith('/') || isExternalAppLink(value)) return value;
    return `https://${value}`;
};

export const createCustomApp = ({ label, to, iconClass }) => ({
    key: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: String(label || '').trim(),
    to: normalizeAppLink(to),
    iconClass: APP_LAUNCHER_ICON_OPTIONS.includes(iconClass) ? iconClass : APP_LAUNCHER_ICON_OPTIONS[0],
    hasSidebarMenu: false,
    custom: true
});

export const readCustomApps = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_APPS_STORAGE_KEY) || '[]');
        if (!Array.isArray(stored)) return [];

        return stored
            .filter((app) => app && app.key && app.label && app.to)
            .map((app) => ({
                key: String(app.key),
                label: String(app.label),
                to: normalizeAppLink(app.to),
                iconClass: APP_LAUNCHER_ICON_OPTIONS.includes(app.iconClass) ? app.iconClass : APP_LAUNCHER_ICON_OPTIONS[0],
                hasSidebarMenu: false,
                custom: true
            }));
    } catch (error) {
        return [];
    }
};

export const writeCustomApps = (apps) => {
    try {
        localStorage.setItem(CUSTOM_APPS_STORAGE_KEY, JSON.stringify(apps));
    } catch (error) {
        // Ignore storage errors and keep the in-memory list.
    }
};

export const orderApps = (apps, orderKeys = []) => {
    const byKey = Object.fromEntries(apps.map((app) => [app.key, app]));
    const ordered = orderKeys.map((key) => byKey[key]).filter(Boolean);
    const missing = apps.filter((app) => !orderKeys.includes(app.key));
    return [...ordered, ...missing];
};

export const readAppOrder = (apps = []) => {
    const fallback = apps.map((app) => app.key);

    try {
        const stored = JSON.parse(localStorage.getItem(APP_ORDER_STORAGE_KEY) || '[]');
        if (!Array.isArray(stored)) return fallback;
        return orderApps(apps, stored.map(String)).map((app) => app.key);
    } catch (error) {
        return fallback;
    }
};

export const writeAppOrder = (keys) => {
    try {
        localStorage.setItem(APP_ORDER_STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
        // Ignore storage errors and keep the in-memory order.
    }
};

export const getAppLauncherApp = (key, extraApps = []) => [...APP_LAUNCHER_APPS, ...extraApps].find((app) => app.key === key) || APP_LAUNCHER_APPS[0];

export const appHasSidebarMenus = (key) => Boolean(APP_LAUNCHER_APPS.find((app) => app.key === key)?.hasSidebarMenu);

const pathMatchesPrefix = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getSidebarAppKey = (key, pathname = '') => {
    const path = String(pathname || '');

    if (path.startsWith('/app/hypercare')) return 'hypercare';
    if (path.startsWith('/app/')) return 'my-app';

    for (const [appKey, prefixes] of PATH_APP_PREFIXES) {
        if (prefixes.some((prefix) => pathMatchesPrefix(path, prefix))) {
            return appKey;
        }
    }

    return appHasSidebarMenus(key) ? key : DEFAULT_APP_KEY;
};
