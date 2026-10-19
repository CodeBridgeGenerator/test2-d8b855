import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import client from '../../../services/restClient';
import AccountChangePassword from './AccountChangePassword';
import AccountChangeName from './AccountChangeName';
import AccountChangeImage from './AccountChangeImage';
import ProfilesCreateDialogComponent from '../ProfilesPage/FilteredProfilesCreateDialogComponent';
import ProfileCard from './Profilecard';
import { v4 as uuidv4 } from 'uuid';
import { classNames } from 'primereact/utils';

const Account = (props) => {
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showChangeName, setShowChangeName] = useState(false);
    const [showChangeImage, setShowChangeImage] = useState(false);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [addProfile, setAddProfile] = useState(false);
    const [iprofile, setIProfile] = useState(0);
    const [role, setRole] = useState('');
    const [data, setData] = useState([]);
    const [lastLogin, setLastLogin] = useState('');
    const [loginHistoryData, setLoginHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState('');
    const [userRoleName, setUserRoleName] = useState('Unknown Role');
    const [addProfileVisible, setAddProfileVisible] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('accountSidebarOpen');
        return saved !== null ? JSON.parse(saved) : false; // Closed by default on mobile
    });
    const [activeMenuKey, setActiveMenuKey] = useState(null);
    const [expandedMenus, setExpandedMenus] = useState(() => {
        const saved = localStorage.getItem('accountExpandedMenus');
        return saved ? JSON.parse(saved) : {};
    });
    const { user } = props;
    const navigate = useNavigate();

    const getOrSetTabId = () => {
        let tabId = sessionStorage.getItem('browserTabId');
        if (!tabId) {
            tabId = uuidv4();
            sessionStorage.setItem('browserTabId', tabId);
        }
        return tabId;
    };

    useEffect(() => {
        if (iprofile && data[iprofile]?.position?.roleId)
            client
                .service('roles')
                .find({ query: { roleId: data[iprofile].position.roleId } })
                .then((res) => setRole(res.data[0].name));
    }, [iprofile]);

    useEffect(() => {
        client
            .service('loginHistories')
            .find({
                query: { userId: user._id, $limit: 1, $sort: { loginTime: -1 } }
            })
            .then((res) => {
                if (res.data.length > 0) {
                    setLastLogin(new Date(res.data[0].loginTime).toLocaleString());
                } else {
                    setLastLogin('No login records available');
                }
            })
            .catch((error) => {
                console.error('Failed to fetch last login', error);
                setLastLogin('Failed to fetch last login');
            });

        client
            .service('loginHistories')
            .find({
                query: { userId: user._id, $limit: 10, $sort: { loginTime: -1 } }
            })
            .then((res) => {
                setLoginHistoryData(res.data);
                setLoadingHistory(false);
            })
            .catch((err) => {
                setHistoryError('Failed to fetch login history');
                setLoadingHistory(false);
                console.error(err);
            });
    }, [user._id]);

    useEffect(() => {
        client
            .service('profiles')
            .find({
                query: {
                    $limit: 10000,
                    $populate: [
                        { path: 'userId', service: 'users', select: ['name'] },
                        { path: 'company', service: 'companies', select: ['name'] },
                        {
                            path: 'position',
                            service: 'positions',
                            select: ['name', 'roleId']
                        },
                        { path: 'branch', service: 'branches', select: ['name'] },
                        { path: 'section', service: 'sections', select: ['name'] },
                        { path: 'department', service: 'departments', select: ['name'] }
                    ]
                }
            })
            .then((res) => {
                let results = res.data;
                setData(results);
            })
            .catch((error) => {
                props.alert({
                    title: 'User Profiles',
                    type: 'error',
                    message: error.message || 'Failed get profiles'
                });
            });
    }, []);

    useEffect(() => {
        const fetchRoleForSelectedUser = async () => {
            try {
                let tabId = getOrSetTabId();
                let selectedProfileId = localStorage.getItem('selectedUser_' + tabId);
                const profileResponse = await client.service('profiles').get(selectedProfileId, { query: { $select: ['role'] } });

                if (profileResponse?.role) {
                    const roleId = profileResponse.role;
                    const roleResponse = await client.service('roles').get(roleId, {
                        query: { $select: ['name'] }
                    });
                    if (roleResponse?.name) {
                        setRole(roleResponse.name);
                        setAddProfileVisible(roleResponse.name === 'Admin' || roleResponse.name === 'Super');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch role for selected user:', error);
            }
        };

        fetchRoleForSelectedUser();
    }, [props]);

    useEffect(() => {
        localStorage.setItem('accountSidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    useEffect(() => {
        localStorage.setItem('accountExpandedMenus', JSON.stringify(expandedMenus));
    }, [expandedMenus]);

    const handleChangePassword = () => {
        setShowChangePassword(true);
        setActiveMenuKey('change-password');
    };

    const handleAddProfile = () => {
        setAddProfile(true);
        setAddProfileVisible(true);
        setActiveMenuKey('add-profile');
    };

    function ProfileField({ label, value }) {
        return (
            <div className="flex flex-col mt-5 w-full">
                <label className="text-gray-600 text-sm">{label}</label>
                <p className="font-semibold">{value}</p>
            </div>
        );
    }

    function BackButton() {
        return (
            <Button
                onClick={() => {
                    navigate('/project');
                    setActiveMenuKey('back-to-dashboard');
                }}
                icon="pi pi-angle-left"
                label="Back to dashboard"
                className="gap-1.5 font-semibold tracking-wide text-right text-[#D30000] bg-transparent border-0 ml-[-1.2rem]"
                style={{
                    color: '#D30000',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '13px'
                }}
            />
        );
    }

    const profileData = [
        { label: 'Email', value: user.email },
        { label: 'User ID', value: user._id },
        { label: 'Last login', value: lastLogin }
    ];

    const sidebarMenus = [
        {
            icon: <i className="pi pi-arrow-left" />,
            label: 'Back to dashboard',
            menuKey: 'back-to-dashboard',
            action: () => navigate('/project')
        },
        {
            icon: <i className="pi pi-key" />,
            label: 'Change password',
            menuKey: 'change-password',
            action: handleChangePassword
        },
        {
            icon: <i className="pi pi-user" />,
            label: 'Profile Info',
            menuKey: 'profile-info',
            menus: profileData.map((field, index) => ({
                label: field.label,
                menuKey: `profile-field-${index}`,
                content: <ProfileField label={field.label} value={field.value} />
            }))
        }
    ];

    const profile = (data, i, len) => (
        <div className="px-6 py-5" style={{ backgroundColor: 'white' }}>
            <div>
                <ProfileCard />
            </div>
        </div>
    );

    const loginHistory = () => {
        if (loadingHistory) return <p>Loading login history...</p>;
        if (historyError) return <p>{historyError}</p>;

        return (
            <div className="py-5" style={{ backgroundColor: 'white' }}>
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Login Time</th>
                            <th className="py-2 px-4 border-b">IP Address</th>
                            <th className="py-2 px-4 border-b">Device and Browser Info</th>
                            <th className="py-2 px-4 border-b">Logout Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loginHistoryData.map((record, index) => (
                            <tr key={index}>
                                <td className="py-2 px-4 border-b">{new Date(record.loginTime).toLocaleString()}</td>
                                <td className="py-2 px-4 border-b">{record.ip || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{record.userAgent || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{record.logoutTime && !isNaN(new Date(record.logoutTime).getTime()) ? new Date(record.logoutTime).toLocaleString() : 'Not Logged Out'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const toggleSubMenu = (menuKey) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    const renderMenuItem = (menu, isSubMenu = false, parentActive = false) => {
        const active = activeMenuKey === menu.menuKey;
        const haveChildren = menu.menus && menu.menus.length > 0;
        const indentClass = isSubMenu ? 'pl-5' : 'pl-3';

        return (
            <div key={menu.menuKey}>
                <div
                    className={classNames('flex items-center justify-between py-2 px-3 rounded-md duration-300 hover:bg-[#F8ECEC] cursor-pointer', active ? 'bg-[#F8ECEC] text-[#D30000]' : 'bg-transparent text-gray-600', indentClass)}
                    onClick={() => {
                        if (haveChildren) {
                            toggleSubMenu(menu.menuKey);
                        } else {
                            setActiveMenuKey(menu.menuKey);
                            if (menu.action) menu.action();
                        }
                    }}
                >
                    <div className="flex gap-3 items-center">
                        <span className={classNames('text-sm', active ? 'text-[#D30000]' : 'text-gray-600', isSidebarOpen ? 'opacity-100' : 'opacity-100')}>{menu.icon}</span>
                        <p className={classNames('font-semibold text-sm text-nowrap', active ? 'text-[#D30000]' : 'text-gray-600', isSidebarOpen ? 'opacity-100' : 'opacity-0')}>{menu.label}</p>
                    </div>
                    {haveChildren && isSidebarOpen && <i className={classNames('pi pi-chevron-down text-xs', active ? 'text-[#D30000]' : 'text-gray-600', expandedMenus[menu.menuKey] ? 'rotate-180' : '')} />}
                </div>
                {haveChildren && (
                    <div
                        className="overflow-hidden transition-all duration-300"
                        style={{
                            maxHeight: isSidebarOpen && expandedMenus[menu.menuKey] ? '1000px' : '0'
                        }}
                    >
                        <div className="flex flex-col gap-1 pl-5">
                            {menu.menus.map((subMenu, index) => (
                                <div key={subMenu.menuKey} className={classNames('py-2 px-3', activeMenuKey === subMenu.menuKey ? 'bg-[#F8ECEC]' : '', isSidebarOpen ? 'opacity-100' : 'opacity-0')}>
                                    {subMenu.content}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const sidebarContent = (
        <nav className={classNames('fixed z-[100] flex flex-col top-0 left-0 h-screen bg-[#F8F9FA] border-r border-[#DEE2E6] shadow-md transition-all duration-300', isSidebarOpen ? 'w-[280px]' : 'w-[calc(3rem+20px)]')} style={{ maxWidth: '280px' }}>
            <div className="flex gap-3 mt-14 px-3 py-4">
                <Button icon={`pi ${isSidebarOpen ? 'pi-times' : 'pi-bars'}`} className="p-button-rounded p-button-text" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ color: '#D30000' }} />
            </div>
            <div className="flex-grow gap-1 p-2 overflow-y-auto no-scrollbar">
                <h1 className={classNames(' px-3 text-2xl font-bold text-slate-700', isSidebarOpen ? 'opacity-100' : 'opacity-0')}>Profile</h1>
                {sidebarMenus.map((menu) => renderMenuItem(menu))}
            </div>
            <footer className={classNames('text-center text-xs text-zinc-500 p-4', isSidebarOpen ? 'opacity-100' : 'opacity-0')}>© 2024 CodeBridge Sdn Bhd. All rights reserved.</footer>
        </nav>
    );

    const onTabChange = (e) => {
        setActiveTabIndex(e.index);
    };

    return (
        <div className="flex bg-white min-h-screen">
            {sidebarContent}
            <div className={classNames('flex-1 transition-all duration-300 p-4', isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[calc(3rem+20px)]')} style={{ width: '100%', overflowX: 'auto' }}>
                <div className="w-full mt-4">
                    <div className="flex flex-column align-items-start mb-3">
                        <div className="surface-ground" style={{ backgroundColor: 'white' }}>
                            <div className="surface-section px-6 pt-5">
                                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                                    <TabPanel header="Profile">
                                        <div className="flex justify-content-center w-full">{addProfileVisible && <Button label="Add new profile" onClick={handleAddProfile} icon="pi pi-plus" className="p-button-rounded p-button-primary" />}</div>
                                        {profile(data[iprofile], iprofile, data.length)}
                                    </TabPanel>
                                    <TabPanel header="Login History">{loginHistory()}</TabPanel>
                                </TabView>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AccountChangePassword show={showChangePassword} onHide={() => setShowChangePassword(false)} />
            <AccountChangeName show={showChangeName} onHide={() => setShowChangeName(false)} />
            <AccountChangeImage show={showChangeImage} onHide={() => setShowChangeImage(false)} />
            <ProfilesCreateDialogComponent show={addProfile} onHide={() => setAddProfile(false)} userId={props.user._id} />
        </div>
    );
};

const mapState = (state) => {
    const { user } = state.auth;
    return { user };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
    get: () => dispatch.cache.get()
});

export default connect(mapState, mapDispatch)(Account);
