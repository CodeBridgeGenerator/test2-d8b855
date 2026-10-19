import React, { useEffect, useState } from 'react';
import AppSideBar from './appSideBar/AppSideBar.js';
import { connect } from 'react-redux';
import client from '../../services/restClient.js';
import { classNames } from 'primereact/utils';
import { v4 as uuidv4 } from 'uuid';

const SkeletonLoader = ({ open }) => {
    return (
        <div className={classNames('flex flex-col gap-2 p-2 h-full bg-[#F8F9FA] transition-all duration-300', open ? 'w-[280px]' : 'w-[calc(3rem+20px)]')}>
            {open ? (
                // Full skeleton when sidebar is open
                <>
                    <div className="flex gap-3 px-3 py-[10px]">
                        <div className="h-6 w-6 bg-gray-200 animate-pulse rounded-full" />
                    </div>
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="h-10 w-full bg-gray-200 animate-pulse rounded-md" />
                    ))}
                </>
            ) : (
                // Collapsed skeleton when sidebar is closed
                <>
                    <div className="flex gap-3 px-3 py-[10px]">
                        <div className="h-6 w-6 bg-gray-200 animate-pulse rounded-full" />
                    </div>
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="h-6 w-6 bg-gray-200 animate-pulse rounded-full mx-auto" />
                    ))}
                </>
            )}
        </div>
    );
};

const ProjectSideBarLayout = (props) => {
    const { children, activeKey, activeDropdown } = props;
    const [userRoleName, setUserRoleName] = useState('Unknown Role');
    const [companyType, setCompanyType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const getOrSetTabId = () => {
        let tabId = sessionStorage.getItem('browserTabId');
        if (!tabId) {
            tabId = uuidv4();
            sessionStorage.setItem('browserTabId', tabId);
        }
        return tabId;
    };

    useEffect(() => {
        const fetchUserRole = async () => {
            setIsLoading(true);
            try {
                let tabId = getOrSetTabId();
                let selectedProfileId = localStorage.getItem('selectedUser_' + tabId);
                let profileBelongsToCurrentUser = false;

                // Check if the selected profile belongs to current user
                if (selectedProfileId && props.user?._id) {
                    try {
                        const profileResponse = await client.service('profiles').get(selectedProfileId, {
                            query: { $select: ['userId'] }
                        });
                        profileBelongsToCurrentUser = profileResponse.userId === props.user._id;
                    } catch (error) {
                        console.warn('Error verifying profile ownership:', error);
                        profileBelongsToCurrentUser = false;
                    }
                }

                // If no selected profile or it doesn't belong to current user, get first profile
                if ((!selectedProfileId || !profileBelongsToCurrentUser) && props.user?._id) {
                    const userProfiles = await client.service('profiles').find({
                        query: {
                            userId: props.user._id,
                            $limit: 1
                        }
                    });

                    if (userProfiles.data.length > 0) {
                        selectedProfileId = userProfiles.data[0]._id;
                        localStorage.setItem('selectedUser_' + tabId, selectedProfileId);
                    }
                }

                if (!selectedProfileId) {
                    console.warn('No selected profile ID found.');
                    setIsLoading(false);
                    return;
                }

                const profileResponse = await client
                    .service('profiles')
                    .get(selectedProfileId, {
                        query: { $select: ['position', 'company'] }
                    })
                    .catch((err) => {
                        console.log(err.message);
                        return null;
                    });

                if (profileResponse?.position) {
                    const positionId = profileResponse.position;

                    const positionResponse = await client
                        .service('positions')
                        .get(positionId, {
                            query: { $select: ['name'] }
                        })
                        .catch((err) => {
                            console.log(err.message);
                            return null;
                        });

                    if (positionResponse?.name) {
                        setUserRoleName(positionResponse.name);
                    } else {
                        console.warn('Position name not found for the given position ID.');
                    }

                    if (profileResponse?.company) {
                        const companyResponse = await client
                            .service('companies')
                            .get(profileResponse.company, {
                                query: { $select: ['companyType'] }
                            })
                            .catch((err) => {
                                console.log(err.message);
                                return null;
                            });

                        if (companyResponse?.companyType) {
                            setCompanyType(companyResponse.companyType);
                        }
                    }
                } else {
                    console.warn('Position field not found in the profile data.');
                }
            } catch (error) {
                console.error('Error fetching user role data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserRole();
    }, [props.getCache, props.user?._id]);

    return props.isLoggedIn ? (
        <div className="flex min-h-[calc(100vh-5rem)] mt-2 bg-white">
            {isLoading || userRoleName === 'Unknown Role' ? (
                <div className={classNames('bg-[#F8F9FA] border-r border-[#DEE2E6] flex-shrink-0', sidebarOpen ? 'w-[280px]' : 'w-[calc(3rem+20px)]')}>
                    <SkeletonLoader open={sidebarOpen} />
                </div>
            ) : (
                <AppSideBar className={classNames('', { hidden: !children })} userRole={userRoleName} companyType={companyType} activeKey={activeKey} activeDropdown={activeDropdown} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            )}
            <div className="flex-1" style={{ overflowX: 'auto' }}>
                {children}
            </div>
        </div>
    ) : (
        children
    );
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

export default connect(mapState, mapDispatch)(ProjectSideBarLayout);
