import React, { useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import client from '../../services/restClient';
import Email from '../../assets/icons/Email.js';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import './Notification.css';
import NotificationMenu from './NotificationMenu.js';
import AppLauncherMenu from './appLauncher/AppLauncherMenu.js';
import { v4 as uuidv4 } from 'uuid';

const AppTopbar = (props) => {
    const navigate = useNavigate();
    const userMenuRef = useRef(null);
    const profileMenuRef = useRef(null);
    const [ticker, setTicker] = useState('');
    const label = process.env.REACT_APP_PROJECT_LABEL || process.env.REACT_APP_PROJECT_NAME;
    const [profiles, setProfiles] = useState([]);
    const [roleNames, setRoleNames] = useState({});
    const [userItems, setUserItems] = useState([]);
    const [isHelpSidebarVisible, setHelpSidebarVisible] = useState(false);
    const [url, setUrl] = useState([]);
    const [imageUrls, setImageUrls] = useState({});
    const [isUserMenuVisible, setUserMenuVisible] = useState(false);
    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);

    const getOrSetTabId = () => {
        let tabId = sessionStorage.getItem('browserTabId');
        if (!tabId) {
            tabId = uuidv4();
            sessionStorage.setItem('browserTabId', tabId);
        }
        return tabId;
    };
    const browserTabId = getOrSetTabId();
    const userProfiles = profiles.filter((profile) => profile.userId?._id === props.user._id);
    const [selectedUser, setSelectedUser] = useState(localStorage.getItem('selectedUser_' + browserTabId) || userProfiles[0]?._id || null);
    const [selectedUserName, setSelectedUserName] = useState('');
    const [selectedUserAvatar, setSelectedUserAvatar] = useState(null);
    const helpSidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpSidebarRef.current && !helpSidebarRef.current.contains(event.target) && isHelpSidebarVisible) {
                setHelpSidebarVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isHelpSidebarVisible]);

    const toggleHelpSidebar = () => {
        setHelpSidebarVisible(!isHelpSidebarVisible);
    };

    useEffect(() => {
        if (selectedUser) {
            localStorage.setItem('selectedUser_' + browserTabId, selectedUser);
        }
    }, [selectedUser, browserTabId]);

    useEffect(() => {
        if (props.user && props.user._id && props.isLoggedIn) {
            const fetchAndSetProfile = async () => {
                try {
                    const res = await client.service('profiles').find({
                        query: {
                            userId: props.user._id,
                            $limit: 10000,
                            $populate: ['position', 'company']
                        }
                    });

                    const userProfiles = res.data;
                    setProfiles(userProfiles);

                    const currentSelected = localStorage.getItem('selectedUser_' + browserTabId);
                    const isValidSelected = userProfiles.some((p) => p._id === currentSelected);

                    const newSelectedUser = isValidSelected ? currentSelected : userProfiles[0]?._id || null;
                    setSelectedUser(newSelectedUser);

                    await initializeCacheStructure();
                } catch (error) {
                    console.error('Error fetching profiles:', error);
                }
            };

            fetchAndSetProfile();
        }
    }, [props.user._id]);

    const initializeCacheStructure = async () => {
        try {
            const profilesResponse = await client.service('profiles').find({
                query: {
                    userId: props.user._id,
                    $limit: 10000,
                    $populate: ['position']
                }
            });
            const profilesData = profilesResponse.data;

            const response = await props.getCache();
            const currentCache = response.results || {};

            const defaultCacheStructure = {
                profiles: profilesData.map((profile) => ({
                    profileId: profile._id,
                    role: profile.position?.roleId || 'Unknown Role',
                    preferences: {
                        dashboardCards: [],
                        recent: [],
                        favourites: [],
                        settings: {}
                    }
                })),
                selectedUser: selectedUser || profilesData[0]?._id,
                browserTabId: browserTabId
            };

            if (!currentCache.profiles || currentCache.profiles.length !== profilesData.length || currentCache.selectedUser !== (selectedUser || profilesData[0]?._id)) {
                await props.setCache(defaultCacheStructure);
            }
        } catch (error) {
            console.error('Error initializing cache structure:', error);
        }
    };

    useEffect(() => {
        const handlePatchedUser = (user) => {
            if (props.user._id === user?._id) {
                props.logout();
            }
        };

        client.service('users').on('patched', handlePatchedUser);

        return () => {
            client.service('users').off('patched', handlePatchedUser);
        };
    }, [props.user._id, props.logout]);

    const showMenu = (e) => {
        if (userMenuRef.current) {
            userMenuRef.current.show(e);
        } else {
            console.warn('userMenuRef is not initialized');
        }
    };

    const showProfileMenu = (e) => {
        if (profileMenuRef.current) {
            profileMenuRef.current.show(e);
        } else {
            console.warn('profileMenuRef is not initialized');
        }
    };

    const fetchRoleNames = async (profiles) => {
        const uniqueRoleIds = [...new Set(profiles.map((profile) => profile.position?.roleId).filter(Boolean))];
        const rolePromises = uniqueRoleIds.map((roleId) => client.service('roles').get(roleId));

        try {
            const roles = await Promise.all(rolePromises);
            const roleMap = roles.reduce((acc, role) => {
                acc[role._id] = role.name;
                return acc;
            }, {});
            setRoleNames(roleMap);
        } catch (error) {
            console.error('Error fetching role names:', error);
        }
    };

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await client.service('profiles').find({
                    query: {
                        $limit: 10000,
                        $populate: [
                            { path: 'userId', service: 'users', select: ['name'] },
                            { path: 'company', service: 'companies', select: ['name'] },
                            {
                                path: 'position',
                                service: 'positions',
                                select: ['name', 'roleId', 'description']
                            },
                            { path: 'branch', service: 'branches', select: ['name'] },
                            { path: 'section', service: 'sections', select: ['name'] },
                            { path: 'department', service: 'departments', select: ['name'] },
                            {
                                path: 'address',
                                service: 'user_addresses',
                                select: ['Street1', 'City', 'State', 'Country']
                            },
                            {
                                path: 'phone',
                                service: 'user_phones',
                                select: ['countryCode', 'operatorCode', 'number']
                            },
                            { path: 'position.roleId', service: 'roles', select: ['name'] }
                        ]
                    }
                });
                setProfiles(res.data);
                fetchRoleNames(res.data);
            } catch (error) {
                console.error('Error fetching profiles:', error);
            }
        };

        fetchProfiles();
    }, [props.user]);

    useEffect(() => {
        profiles.forEach((profile) => {
            const imageId = profile.image?.[0];
            if (imageId && !imageUrls[imageId]) {
                client
                    .service('documentStorages')
                    .get(imageId)
                    .then((record) => {
                        setImageUrls((prev) => ({ ...prev, [imageId]: record.url }));
                    })
                    .catch((error) => console.error('Error fetching image URL:', error));
            }
        });
    }, [profiles, imageUrls]);

    const fetchImageUrl = async (imageId) => {
        if (!imageId) {
            return '';
        }
        try {
            const record = await client.service('documentStorages').get(imageId);
            setUrl(record.url);
            return record.url ? record.url : '';
        } catch (error) {
            console.error('Error fetching image URL:', error);
            return '';
        }
    };

    useEffect(() => {
        const formattedUserItems = profiles
            .filter((profile) => profile.userId?._id === props.user._id)
            .map((profile) => ({
                id: profile._id,
                name: profile.name || 'Unknown',
                position: profile.position?.description || 'Unknown Position',
                role: roleNames[profile.position?.roleId] || 'Unknown Role',
                company: profile.company?.name || '',
                branch: profile.branch?.name || '',
                status: 'success',
                avatarContent: {
                    type: profile.image && profile.image.length > 0 ? 'image' : 'text',
                    id: profile.image?.[0],
                    url: imageUrls[profile.image?.[0]]
                }
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        setUserItems(formattedUserItems);

        let initialSelectedUser = selectedUser;
        if (!initialSelectedUser && formattedUserItems[0]) {
            initialSelectedUser = formattedUserItems[0].id;
            setSelectedUser(initialSelectedUser);
        }

        const selectedUserProfile = formattedUserItems.find((user) => user.id === initialSelectedUser);
        if (selectedUserProfile) {
            setSelectedUserName(selectedUserProfile.name);
            if (selectedUserProfile.avatarContent.type === 'image' && selectedUserProfile.avatarContent.url) {
                setSelectedUserAvatar(selectedUserProfile.avatarContent.url);
            } else {
                setSelectedUserAvatar(
                    (() => {
                        const tokens = selectedUserProfile.name.split(' ').filter((token) => token !== '-' && token.trim() !== '');
                        if (tokens.length >= 2) {
                            return tokens
                                .slice(0, 2)
                                .map((n) => n.charAt(0).toUpperCase())
                                .join('');
                        }
                        return selectedUserProfile.name.substring(0, 2).toUpperCase();
                    })()
                );
            }
        }
    }, [profiles, roleNames, imageUrls, props.user?._id, selectedUser]);

    const handleUserChange = async (e) => {
        const userId = e.target.value;
        setSelectedUser(userId);

        const selectedProfile = profiles.find((profile) => profile?._id === userId);
        const selectedRole = selectedProfile?.position?.roleId || 'Unknown Role';

        try {
            await updateCache(userId, selectedRole);
            console.debug('Cache updated successfully for user:', userId);
        } catch (error) {
            console.error('Error updating cache:', error);
        }
    };

    const updateCache = async (userId, selectedRole) => {
        try {
            const response = await props.getCache();
            const currentCache = response.results || {};
            const updatedCache = {
                ...currentCache,
                selectedUser: userId,
                browserTabId: browserTabId
            };

            if (updatedCache.results) {
                delete updatedCache.results;
            }

            await props.setCache(updatedCache);
            navigate('/');
            window.location.reload();
        } catch (error) {
            console.error('Error updating cache:', error);
        }
    };

    const profileItems = [
        ...userItems.map((user) => ({
            label: (
                <div
                    className="container flex flex-row ms-0 p-2 rounded-lg"
                    style={{
                        width: '300px',
                        cursor: 'pointer',
                        backgroundColor: selectedUser === user.id ? '#E6F2FF' : 'transparent',
                        border: selectedUser === user.id ? '1px solid #0066CC' : 'none'
                    }}
                    onClick={() => handleUserChange({ target: { value: user.id } })}
                >
                    <div className="ps-0 flex items-center">
                        {user.avatarContent.type === 'image' && user.avatarContent.url ? (
                            <Avatar
                                image={user.avatarContent.url}
                                className="mr-2"
                                shape="circle"
                                size="large"
                                style={{
                                    borderRadius: '50%',
                                    border: '2px solid #D30000'
                                }}
                            />
                        ) : (
                            <Avatar
                                label={(() => {
                                    const tokens = user.name.split(' ').filter((token) => token !== '-' && token.trim() !== '');
                                    if (tokens.length >= 2) {
                                        return tokens
                                            .slice(0, 2)
                                            .map((token) => token.charAt(0).toUpperCase())
                                            .join('');
                                    }
                                    return user.name.substring(0, 2).toUpperCase();
                                })()}
                                className="mr-2"
                                shape="circle"
                                size="large"
                                style={{
                                    borderRadius: '50%',
                                    backgroundColor: '#D30000',
                                    color: '#ffffff',
                                    border: '2px solid #D30000'
                                }}
                            />
                        )}
                    </div>
                    <div className="container flex-grow">
                        <div
                            className="justify-start"
                            style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2A4454',
                                textAlign: 'left',
                                width: '100%'
                            }}
                        >
                            <div
                                style={{
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    maxWidth: '250px'
                                }}
                            >
                                {user.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-1">
                                <Tag value={user.role} severity="info" className="text-xs py-1" style={{ background: '#E6F2FF', color: '#0066CC' }} />
                                <span className="text-xs text-gray-600">{user.position}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {user.company && <Tag value={user.company} severity="success" className="text-xs py-1" style={{ background: '#E6F7EE', color: '#00875A' }} />}
                            {user.branch && <Tag value={user.branch} severity="warning" className="text-xs py-1" style={{ background: '#FFF4E6', color: '#FF8B00' }} />}
                        </div>
                    </div>
                </div>
            ),
            command: () => {
                console.debug(`Selected user object:`, user);
            }
        }))
    ];

    const items = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: (event) => {
                navigate('/account');
                event.originalEvent.stopPropagation();
            }
        },
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            command: (event) => {
                navigate('/cbAdmin/settings');
                event.originalEvent.stopPropagation();
            }
        },
        {
            label: 'Help',
            icon: 'pi pi-question-circle',
            command: () => toggleHelpSidebar()
        },
        {
            label: 'Log Out',
            icon: 'pi pi-fw pi-sign-out',
            template: (item) => {
                return (
                    <ul className="p-menu-list p-reset">
                        <li className="p-menu-list p-reset" key={item.label}>
                            <a className="p-menuitem-link" onClick={onLogout} role="menuitem">
                                <span className={'p-menuitem-icon pi pi-sign-out text-primary'}></span>
                                <span className={'p-menuitem-text text-primary'}>{item.label}</span>
                            </a>
                        </li>
                    </ul>
                );
            }
        }
    ];

    const onLogout = async () => {
        try {
            const latestLogin = await client.service('loginHistories').find({
                query: {
                    userId: props.user._id,
                    $limit: 1,
                    $sort: { loginTime: -1 }
                }
            });

            if (latestLogin.data.length > 0) {
                const latestRecordId = latestLogin.data[0]._id;
                await client.service('loginHistories').patch(latestRecordId, {
                    logoutTime: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating logout time:', error);
        }
        setSelectedUser(null);
        await props.logout();
        navigate('/', { replace: true });
    };

    return props.isLoggedIn ? (
        <div className="layout-topbar">
            <div className="layout-topbar">
                {/* Left-aligned logo and name */}
                <div className="flex align-items-center">
                    <Link to="/project">
                        <div className="cursor-pointer flex align-items-end">
                            <img src={'./assets/logo/cb-logo-256.png'} height={50} className="mt-0" alt="Logo" />
                            <h3
                                className="text-red-500 hidden sm:block"
                                style={{
                                    fontFamily: 'MarlinGeo',
                                    fontWeight: 'bolder',
                                    margin: 0,
                                    marginBottom: 8,
                                    marginLeft: '0.5rem'
                                }}
                            >
                                <i className="pi pi-menu" style={{ fontSize: '1.5rem' }}></i> {label !== '' ? label : 'CB App'}
                            </h3>
                        </div>
                    </Link>
                </div>

                {/* Right-aligned navigation items */}
                <div className="flex align-items-center gap-2">
                    <ul className="flex align-items-center list-none p-0 m-0 gap-2">
                        {/* Profile menu item */}
                        <li className="flex align-items-center">
                            <div
                                style={{
                                    backgroundColor: 'rgba(139, 139, 139, 0.1)',
                                    borderRadius: '10px',
                                    cursor: 'pointer'
                                }}
                                onClick={showProfileMenu}
                                aria-controls="profile-popup-menu"
                                aria-haspopup
                                className="mr-4"
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.25rem 0.5rem'
                                    }}
                                >
                                    {selectedUserAvatar && (
                                        <Avatar
                                            image={typeof selectedUserAvatar === 'string' && selectedUserAvatar.startsWith('http') ? selectedUserAvatar : null}
                                            label={typeof selectedUserAvatar === 'string' && !selectedUserAvatar.startsWith('http') ? selectedUserAvatar : null}
                                            className="mr-2"
                                            shape="circle"
                                            size="small"
                                            style={{
                                                borderRadius: '50%',
                                                backgroundColor: '#D30000',
                                                color: '#ffffff'
                                            }}
                                        />
                                    )}
                                    <span className="font-medium hidden sm:inline">{selectedUserName}</span>
                                </div>
                            </div>
                        </li>

                        {/* Email icon */}
                        <li className="flex align-items-center">
                            <Link to="/cbAdmin/inbox">
                                <Email />
                            </Link>
                        </li>

                        {/* Notification menu */}
                        <li className="flex align-items-center">
                            <NotificationMenu />
                        </li>

                        {/* 9-dot apps launcher */}
                        <li className="flex align-items-center">
                            <AppLauncherMenu />
                        </li>

                        {/* Settings button */}
                        {props.onSettings && (
                            <li className="flex align-items-center">
                                <button className="p-link layout-topbar-button" onClick={props.onSettings}>
                                    <i className="pi pi-cog" />
                                    <span className="hidden sm:inline">Settings</span>
                                </button>
                            </li>
                        )}

                        {/* Profile button */}
                        {props.onAccount && (
                            <li className="flex align-items-center">
                                <button className="p-link layout-topbar-button" onClick={props.onAccount}>
                                    <i className="pi pi-user" />
                                    <span className="hidden sm:inline">Profile</span>
                                </button>
                            </li>
                        )}
                    </ul>

                    {/* User avatar */}
                    <Avatar
                        label={(() => {
                            if (props.user.name) {
                                const tokens = props.user.name.split(' ').filter((token) => token !== '-' && token.trim() !== '');
                                if (tokens.length >= 2) {
                                    return tokens
                                        .slice(0, 2)
                                        .map((token) => token.charAt(0).toUpperCase())
                                        .join('');
                                }
                                return props.user.name.substring(0, 2).toUpperCase();
                            } else {
                                return ' ';
                            }
                        })()}
                        shape="circle"
                        onClick={showMenu}
                        aria-controls="user-popup-menu"
                        aria-haspopup
                        style={{
                            borderRadius: '50%',
                            backgroundColor: '#D30000',
                            color: '#ffffff'
                        }}
                    />
                </div>
            </div>

            {/* Menu components with key fixes */}
            <Menu
                model={items}
                popup
                ref={userMenuRef}
                id="user-popup-menu"
                key="user-menu"
                style={{
                    width: '310px',
                    marginTop: '15px',
                    transform: 'translateX(20px)',
                    maxHeight: '800px',
                    overflowY: 'auto'
                }}
                appendTo={typeof document !== 'undefined' ? document.body : 'self'}
            />

            <Menu
                model={profileItems}
                popup
                ref={profileMenuRef}
                id="profile-popup-menu"
                key="profile-menu"
                style={{
                    width: '340px',
                    transform: 'translateX(80px)',
                    marginTop: '15px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}
                appendTo={typeof document !== 'undefined' ? document.body : 'self'}
            />
        </div>
    ) : null;
};

const mapState = (state) => {
    const { isLoggedIn, user } = state.auth;
    return { isLoggedIn, user };
};

const mapDispatch = (dispatch) => ({
    logout: () => dispatch.auth.logout(),
    getCache: () => dispatch.cache.get(),
    setCache: (data) => dispatch.cache.set(data)
});

export default connect(mapState, mapDispatch)(AppTopbar);
