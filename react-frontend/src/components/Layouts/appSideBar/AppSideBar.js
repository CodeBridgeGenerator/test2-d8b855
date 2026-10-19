// AppSideBar.js
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { classNames } from 'primereact/utils';
import { useAppLauncher } from '../appLauncher/AppLauncherProvider';
import { DEFAULT_APP_KEY, getSidebarAppKey } from '../appLauncher/appLauncherApps';

import AppMenu from './AppMenu.js';
import AppFooter from '../AppFooter.js';
import AppSideBarProvider from './AppSideBarProvider.js';
import Toggle from '../../../assets/icons/Toggle.js';

import Home from '../../../assets/icons/Home.js';
import Data from '../../../assets/icons/Data.js';
import Messaging from '../../../assets/icons/Messaging.js';
import Report from '../../../assets/icons/Report.js';
import GenAI from '../../../assets/icons/GenAI.js';
import StaffInfo from '../../../assets/icons/StaffInfo.js';
import Stack from '../../../assets/icons/Stack.js';
import DynaLoader from '../../../assets/icons/DynaLoader.js';
import Server from '../../../assets/icons/Server.js';
import Email from '../../../assets/icons/Email.js';
import MailSent from '../../../assets/icons/MailSent.js';
import Load from '../../../assets/icons/Load.js';
import Chat from '../../../assets/icons/Chat.js';
import Terminal from '../../../assets/icons/Terminal.js';
import Documents from '../../../assets/icons/Documents.js';
import Admin from '../../../assets/icons/Admin.js';
import Users from '../../../assets/icons/Users.js';

import Building from '../../../assets/icons/Building.js';
import Profile from '../../../assets/icons/Profile.js';
import Profiles from '../../../assets/icons/Profiles.js';
import Employees from '../../../assets/icons/Employees.js';
import UserLogin from '../../../assets/icons/UserLogin.js';
import Superiors from '../../../assets/icons/Superiors.js';
import Roles from '../../../assets/icons/Roles.js';
import Positions from '../../../assets/icons/Positions.js';
import Addresses from '../../../assets/icons/Addresses.js';
import Phones from '../../../assets/icons/Phones.js';
import Companies from '../../../assets/icons/Companies.js';
import Branches from '../../../assets/icons/Branches.js';
import Sections from '../../../assets/icons/Sections.js';
import Permissions from '../../../assets/icons/Permissions.js';
import HeadOfSection from '../../../assets/icons/HeadOfSection.js';
import HeadOfDept from '../../../assets/icons/HeadOfDept.js';
import DepartmentAdmin from '../../../assets/icons/DepartmentAdmin.js';
import Files from '../../../assets/icons/Files.js';
import Errors from '../../../assets/icons/Errors.js';
import Audit from '../../../assets/icons/Audit.js';
import Notification from '../../../assets/icons/Notification.js';

// ~cb-add-import~

const iconMapping = {
    Home: <Home />,
    Data: <Data />,
    Messaging: <Messaging />,
    Report: <Report />,
    GenAI: <GenAI />,
    StaffInfo: <StaffInfo />,
    Stack: <Stack />,
    DynaLoader: <DynaLoader />,
    Server: <Server />,
    Email: <Email />,
    MailSent: <MailSent />,
    Load: <Load />,
    Chat: <Chat />,
    Terminal: <Terminal />,
    Documents: <Documents />,
    Admin: <Admin />,
    Users: <Users />,
    Building: <Building />,
    Profile: <Profile />,
    Profiles: <Profiles />,
    Employees: <Employees />,
    UserLogin: <UserLogin />,
    Superiors: <Superiors />,
    Roles: <Roles />,
    Positions: <Positions />,
    Addresses: <Addresses />,
    Phones: <Phones />,
    Companies: <Companies />,
    Branches: <Branches />,
    Sections: <Sections />,
    Permissions: <Permissions />,
    HeadOfSection: <HeadOfSection />,
    HeadOfDept: <HeadOfDept />,
    DepartmentAdmin: <DepartmentAdmin />,
    Files: <Files />,
    Errors: <Errors />,
    Notification: <Notification />
};

const getIconComponent = (iconPathOrName) => {
    if (!iconPathOrName) return <div className="h-5 w-5 bg-gray-300 rounded" />;

    // DB saves paths like "../../../assets/icons/Companies.js"
    const clean = iconPathOrName.toString().replace('../../../assets/icons/', '').replace('.js', '').replace('Icon', '').trim();

    return iconMapping[clean] || <div className="h-5 w-5 bg-gray-300 rounded" />;
};

const processDbMenus = (menus = []) => {
    return (menus || []).map((m) => ({
        ...m,
        icon: getIconComponent(m.icon),
        menus: m.menus ? processDbMenus(m.menus) : undefined
    }));
};

const AppSideBar = (props) => {
    const { activeKey: initialActiveKey, activeDropdown: initialActiveDropdown, dbMenus = [], isMenuLoading } = props;

    const [activeKey, setActiveKey] = useState(initialActiveKey);
    const [activeDropdown, setActiveDropdown] = useState(initialActiveDropdown);
    const [open, setOpen] = useState(true);
    const { selectedApp } = useAppLauncher();
    const location = useLocation();
    const visibleApp = getSidebarAppKey(selectedApp || DEFAULT_APP_KEY, location.pathname);

    const dbMenusProcessed = useMemo(() => processDbMenus(dbMenus), [dbMenus]);

    const useDbMenu = dbMenusProcessed && dbMenusProcessed.length > 0;

    return (
        <>
            <div className={classNames('duration-300 flex-shrink-0', open ? 'w-[280px]' : 'w-[calc(3rem+20px)]')}></div>

            <AppSideBarProvider activeKey={activeKey} setActiveKey={setActiveKey} open={open} setOpen={setOpen} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}>
                <div className={classNames('fixed z-[100] flex flex-col top-20 left-0 h-[calc(100vh-5rem)] overflow-y-hidden overflow-x-hidden flex-shrink-0 shadow bg-[#F8F9FA] border-r border-[#DEE2E6] border-solid duration-300', open ? 'w-[280px]' : 'w-[calc(3rem+20px)]')}>
                    <div className="flex-grow gap-1 p-2 overflow-x-hidden overflow-y-auto no-scrollbar">
                        <div className="flex gap-3 px-3 py-[10px]">
                            <span className="cursor-pointer" onClick={() => setOpen(!open)}>
                                <Toggle />
                            </span>
                        </div>

                        {/* OPTIONAL: small loading state (doesn't block) */}
                        {isMenuLoading && <div className={classNames('px-3 py-2 text-sm text-gray-500', open ? 'block' : 'hidden')}>Loading menu...</div>}

                        {visibleApp === 'my-app' &&
                            (useDbMenu ? (
                                dbMenusProcessed.map((menu, i) => <AppMenu key={i} defaultExpand icon={menu.icon} label={menu.label} menuKey={menu.menuKey} to={menu.to} menus={menu.menus} setActiveKey={setActiveKey} />)
                            ) : (
                                <AppMenu
                                    defaultExpand
                                    icon={<Home />}
                                    label="My app"
                                    menuKey="dashboard"
                                    to="/cbAdmin/dashboard"
                                    menus={
                                        [
{
                  icon: <Home />,
                  label: "Students",
                  menuKey: "students",
                  to: "/app/students",
                },
{
                  icon: <Home />,
                  label: "Courses",
                  menuKey: "courses",
                  to: "/app/courses",
                },
{
                  icon: <Home />,
                  label: "Enrollments",
                  menuKey: "enrollments",
                  to: "/app/enrollments",
                },
{
                  icon: <Home />,
                  label: "Classrooms",
                  menuKey: "classrooms",
                  to: "/app/classrooms",
                },
                                            /* ~cb-add-menu~ */
                                        ]
                                    }
                                />
                            ))}

                        {visibleApp === 'companies' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Building />}
                                    label="Organization"
                                    menuKey="organization-management"
                                    to="/cbAdmin/DashboardCompanyData"
                                    menus={[
                                        {
                                            label: ' Companies',
                                            icon: <Companies />,
                                            menuKey: 'companies',
                                            to: '/cbAdmin/companies'
                                        },

                                        {
                                            label: 'Branches',
                                            icon: <Branches />,
                                            menuKey: 'branches',
                                            to: '/cbAdmin/branches'
                                        },
                                        {
                                            label: 'Departments',
                                            icon: <Positions />,
                                            menuKey: 'departments',
                                            to: '/cbAdmin/departments'
                                        },
                                        {
                                            label: 'Sections',
                                            icon: <Sections />,
                                            menuKey: 'sections',
                                            to: '/cbAdmin/sections'
                                        },
                                        {
                                            icon: <Home />,
                                            label: 'Office',
                                            menuKey: 'office',
                                            menus: [
                                                {
                                                    icon: <DepartmentAdmin />,
                                                    label: 'Department Admins',
                                                    menuKey: 'department-admin',
                                                    to: '/cbAdmin/departmentAdmin'
                                                },
                                                {
                                                    icon: <HeadOfDept />,
                                                    label: 'Head of departments',
                                                    menuKey: 'head-of-department',
                                                    to: '/cbAdmin/departmentHOD'
                                                },
                                                {
                                                    icon: <HeadOfSection />,
                                                    label: 'Head of sections',
                                                    menuKey: 'haed-of-section',
                                                    to: '/cbAdmin/departmentHOS'
                                                },
                                                {
                                                    label: 'Superiors',
                                                    icon: <Superiors />,
                                                    menuKey: 'superiors',
                                                    to: '/cbAdmin/superior'
                                                },
                                                {
                                                    label: 'Employees',
                                                    icon: <Employees />,
                                                    menuKey: 'employees',
                                                    to: '/cbAdmin/employees'
                                                },
                                                {
                                                    label: 'Staff info',
                                                    icon: <StaffInfo />,
                                                    menuKey: 'staff-info',
                                                    to: '/cbAdmin/staffinfo'
                                                }
                                            ]
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'people' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Admin />}
                                    label="Users & Access"
                                    menuKey="users-access"
                                    to="/cbAdmin/DashboardHRControls"
                                    menus={[
                                        {
                                            label: 'Users',
                                            icon: <Profile />,
                                            menuKey: 'accounts',
                                            to: '/cbAdmin/users'
                                        },
                                        {
                                            label: 'Invites',
                                            icon: <MailSent />,
                                            menuKey: 'user-invites',
                                            to: '/cbAdmin/userInvites'
                                        },
                                        {
                                            label: 'Profiles',
                                            icon: <Profiles />,
                                            menuKey: 'profiles',
                                            to: '/cbAdmin/profiles'
                                        },

                                        {
                                            label: 'Roles',
                                            icon: <Roles />,
                                            menuKey: 'roles',
                                            to: '/cbAdmin/roles'
                                        },
                                        {
                                            label: 'Positions',
                                            icon: <Positions />,
                                            menuKey: 'positions',
                                            to: '/cbAdmin/positions'
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'communication' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Messaging />}
                                    label="Communication"
                                    menuKey="communication"
                                    menus={[
                                        {
                                            label: 'Notifications',
                                            icon: <Notification />,
                                            menuKey: 'notification-jobs',
                                            to: '/cbAdmin/notifications'
                                        },
                                        {
                                            label: 'FCM Messages',
                                            icon: <Email />,
                                            menuKey: 'fcm-push',
                                            to: '/cbAdmin/fcmMessages'
                                        },
                                        {
                                            label: 'Notification Templates',
                                            icon: <Data />,
                                            menuKey: 'notification-templates',
                                            menus: [
                                                {
                                                    label: 'In-app Notifications',
                                                    icon: <Notification />,
                                                    menuKey: 'fcm-templates',
                                                    to: '/cbAdmin/notificationTemplates'
                                                },
                                                {
                                                    label: 'Email Notifications',
                                                    icon: <Email />,
                                                    menuKey: 'email-notifications',
                                                    to: '/cbAdmin/templates'
                                                }
                                            ]
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'storage' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Data />}
                                    label="Documentation"
                                    menuKey="documentation"
                                    menus={[
                                        {
                                            label: 'Documents',
                                            icon: <Files />,
                                            menuKey: 'documents',
                                            to: '/cbAdmin/documentationDetails'
                                        },
                                        {
                                            label: 'Files',
                                            icon: <Documents />,
                                            menuKey: 'files',
                                            to: '/cbAdmin/documentStorages'
                                        },
                                        {
                                            label: 'Media',
                                            icon: <Files />,
                                            menuKey: 'media',
                                            to: '/cbAdmin/assets'
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'security' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Permissions />}
                                    label="Security"
                                    menuKey="security"
                                    menus={[
                                        {
                                            icon: <Permissions />,
                                            label: 'Permissions',
                                            menuKey: 'service-permissions',
                                            to: '/cbAdmin/permissionServices'
                                        },
                                        {
                                            label: 'Mails',
                                            icon: <MailSent />,
                                            menuKey: 'mail-sent-logs',
                                            to: '/cbAdmin/mails'
                                        },
                                        {
                                            label: 'Errors',
                                            menuKey: 'errors',
                                            icon: <Errors />,
                                            to: '/cbAdmin/errorLogs'
                                        },
                                        {
                                            label: 'Audits Logs',
                                            icon: <Audit />,
                                            menuKey: 'audits-jobs',
                                            to: '/cbAdmin/audits'
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'hypercare' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<Chat />}
                                    label="Hypercare"
                                    menuKey="hypercare"
                                    menus={[
                                        {
                                            label: 'Mail logs',
                                            icon: <MailSent />,
                                            menuKey: 'mail-sent-logs',
                                            to: '/cbAdmin/mails'
                                        },
                                        {
                                            label: 'Support Tickets',
                                            icon: <Chat />,
                                            menuKey: 'supportTickets',
                                            to: '/cbAdmin/supportTickets'
                                        },
                                        {
                                            label: 'Helpbar',
                                            icon: <Files />,
                                            menuKey: 'helpbar-Contents',
                                            to: '/cbAdmin/helpSidebarContents'
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}

                        {visibleApp === 'operations' && (
                                <AppMenu
                                    defaultExpand
                                    icon={<DynaLoader />}
                                    label="System Operations"
                                    menuKey="system-operations"
                                    menus={[
                                        {
                                            label: 'Mail Jobs',
                                            icon: <Email />,
                                            menuKey: 'mail-job-ques',
                                            to: '/cbAdmin/mailQues'
                                        }
                                    ]}
                                    setActiveKey={setActiveKey}
                                />
                        )}
                    </div>

                    <div className={classNames('text-center duration-300', open ? 'opacity-100' : 'opacity-0')}>
                        <AppFooter />
                    </div>
                </div>
            </AppSideBarProvider>
        </>
    );
};

export default AppSideBar;
