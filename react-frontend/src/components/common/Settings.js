import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { v4 as uuidv4 } from 'uuid';

const Settings = (props) => {
    const { user, cache } = props;
    const navigate = useNavigate();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState();

    const getOrSetTabId = () => {
        let tabId = sessionStorage.getItem('browserTabId');
        if (!tabId) {
            tabId = uuidv4();
            sessionStorage.setItem('browserTabId', tabId);
        }
        return tabId;
    };

    useEffect(() => {
        const tabId = getOrSetTabId();
        if (selectedUser) {
            localStorage.setItem(`selectedUser_${tabId}`, selectedUser);
        }
    }, [selectedUser]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const tabId = getOrSetTabId();
                const response = await props.get();
                const currentCache = response?.results;
                const storedUser = localStorage.getItem(`selectedUser_${tabId}`);
                const activeUser = storedUser || currentCache?.selectedUser;

                setSelectedUser(activeUser);

                const selectedUserProfile = currentCache?.profiles?.find((profile) => profile.profileId === activeUser);

                if (selectedUserProfile?.preferences?.settings) {
                    setSettings(selectedUserProfile.preferences.settings);
                } else {
                    console.warn('Selected user profile or preferences.settings not found.');
                    setSettings({});
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
                props.alert({
                    title: 'Error',
                    type: 'error',
                    message: 'Failed to load settings'
                });
            }
        };

        fetchSettings();
    }, [props]);

    const paginatorOptions = [
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '120', value: 120 }
    ];

    const saveSettings = async () => {
        try {
            setSaveLoading(true);
            const tabId = getOrSetTabId();
            const response = await props.get();
            const currentCache = response?.results;
            const selectedUserId = localStorage.getItem(`selectedUser_${tabId}`) || currentCache?.selectedUser;

            if (!currentCache || !selectedUserId) {
                throw new Error('Cache or selected user not available');
            }

            const profileIndex = currentCache.profiles.findIndex((profile) => profile.profileId === selectedUserId);

            if (profileIndex === -1) {
                throw new Error('User profile not found in cache');
            }

            currentCache.profiles[profileIndex].preferences.settings = settings;
            await props.set(currentCache);

            props.alert({
                title: 'Success',
                type: 'success',
                message: 'Settings saved successfully'
            });
        } catch (error) {
            console.error('Failed to save settings', error);
            props.alert({
                title: 'Error',
                type: 'error',
                message: 'Failed to save settings: ' + (error.message || 'Unknown error')
            });
        } finally {
            setSaveLoading(false);
        }
    };

    // Refresh Permissions Function
    const handleRefreshPermissions = async () => {
        try {
            setLoading(true);
            props.alert({
                title: 'Permissions',
                type: 'info',
                message: 'Refreshing permissions from server...'
            });

            await props.get(); // Force reload cache

            props.alert({
                title: 'Success',
                type: 'success',
                message: 'Permissions refreshed successfully!'
            });
        } catch (error) {
            console.error('Failed to refresh permissions', error);
            props.alert({
                title: 'Error',
                type: 'error',
                message: 'Failed to refresh permissions'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatSettingName = (name) =>
        name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

    const formatServiceName = (name) =>
        name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

    return (
        <div className="flex flex-column bg-white h-screen">
            <div className="p-3 mt-20">
                <Button
                    onClick={() => navigate('/project')}
                    icon="pi pi-angle-left"
                    label="Back to dashboard"
                    className="gap-1.5 font-semibold tracking-wide text-[#D30000] bg-transparent border-0"
                    style={{
                        color: '#D30000',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '13px'
                    }}
                />
            </div>

            <Card title="Settings" className="flex-1 p-5 overflow-y-auto w-full mx-3">
                <Accordion multiple activeIndex={[0]}>
                    {/* Notifications - Now at the top and blank */}
                    <AccordionTab header="Notifications">
                        <div className="grid">
                            <div className="col-12 p-field">
                                <p className="text-500">Notification settings will appear here in the future.</p>
                            </div>
                        </div>
                    </AccordionTab>

                    {/* Permissions - Only Refresh button */}
                    <AccordionTab header="Permissions">
                        <div className="grid">
                            <div className="col-12 p-field">
                                <label className="font-bold block mb-2">Refresh Permissions</label>
                                <p className="text-500 text-sm mt-1 mb-4">If your access rights were recently updated by an administrator, click the button below to apply the latest permissions immediately.</p>
                                <Button label="Refresh Permissions Now" icon="pi pi-refresh" onClick={handleRefreshPermissions} loading={loading} className="p-button-help" size="large" />
                            </div>
                        </div>
                    </AccordionTab>

                    {/* Dynamic Service Settings (e.g., paginator, etc.) */}
                    {Object.entries(settings)
                        .filter(([service]) => !['permissions', 'notifications'].includes(service))
                        .map(([service, serviceSettings]) => (
                            <AccordionTab key={service} header={formatServiceName(service)}>
                                <div className="grid">
                                    {Object.entries(serviceSettings).map(([settingName, settingValue]) => (
                                        <div key={settingName} className="col-12 md:col-6 lg:col-4 p-field mb-2">
                                            <label htmlFor={settingName}>{formatSettingName(settingName)}:</label>
                                            {settingName === 'paginatorRecordsNo' ? (
                                                <Dropdown
                                                    id={settingName}
                                                    value={settingValue}
                                                    options={paginatorOptions}
                                                    onChange={(e) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            [service]: {
                                                                ...prev[service],
                                                                [settingName]: e.value
                                                            }
                                                        }))
                                                    }
                                                    placeholder="Select"
                                                />
                                            ) : (
                                                <InputText
                                                    id={settingName}
                                                    value={settingValue || ''}
                                                    onChange={(e) =>
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            [service]: {
                                                                ...prev[service],
                                                                [settingName]: e.target.value
                                                            }
                                                        }))
                                                    }
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </AccordionTab>
                        ))}
                </Accordion>

                <Divider />

                <div className="flex justify-content-end gap-3 mt-4">
                    <Button label="Refresh Permissions" icon="pi pi-refresh" onClick={handleRefreshPermissions} loading={loading} className="p-button-outlined p-button-help" />
                    <Button label="Save Settings" icon="pi pi-save" onClick={saveSettings} loading={saveLoading} className="p-button-primary" />
                </div>
            </Card>
        </div>
    );
};

const mapState = (state) => {
    const { user, isLoggedIn } = state.auth;
    const { cache } = state.cache;
    return { user, isLoggedIn, cache };
};

const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
    get: () => dispatch.cache.get(),
    set: (data) => dispatch.cache.set(data)
});

export default connect(mapState, mapDispatch)(Settings);
