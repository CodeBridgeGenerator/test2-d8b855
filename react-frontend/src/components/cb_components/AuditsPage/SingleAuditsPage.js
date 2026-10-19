import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { SplitButton } from 'primereact/splitbutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import moment from 'moment';
import client from '../../../services/restClient';
import CommentsSection from '../../common/CommentsSection';
import ProjectLayout from '../../Layouts/ProjectLayout';

const SingleAuditsPage = (props) => {
    const navigate = useNavigate();
    const urlParams = useParams();
    const [_entity, set_entity] = useState({});
    const [isHelpSidebarVisible, setHelpSidebarVisible] = useState(false);
    const [detailsData, setDetailsData] = useState([]);

    // Function to convert camelCase to normal words
    const camelCaseToNormalWords = (camelCaseStr) => {
        if (!camelCaseStr || typeof camelCaseStr !== 'string') return camelCaseStr;

        // Add space before uppercase letters and trim
        const result = camelCaseStr
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

        return result;
    };

    // Function to check if a value is a valid MongoDB ObjectId
    const isObjectId = (value) => {
        return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
    };

    // Fallback mapping for known fields and their referenced services
    const fallbackMapping = {
        createdBy: 'users',
        updatedBy: 'users',
        machineId: 'external_machines',
        externalUser: 'profiles',
        assignedSupervisor: 'profiles',
        assignedTechnician: 'profiles',
        machineImage: 'document_storages',
        uploadOfPictureBeforeRepair: 'document_storages',
        uploadOfPictureAfterRepair: 'document_storages',
        vendingMachineId: 'vending_machines',
        atlasCheckListId: 'atlas_checklists',
        ownership: 'branches',
        vendingMachineType: 'vending_machines'
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text) => {
        if (!text) return;

        navigator.clipboard
            .writeText(String(text))
            .then(() => {
                props.alert({
                    type: 'success',
                    message: 'Copied to clipboard!'
                });
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
                props.alert({
                    type: 'error',
                    message: 'Failed to copy to clipboard.'
                });
            });
    };

    useEffect(() => {
        // Fetch audit record
        client
            .service('audits')
            .get(urlParams.singleAuditsId, {
                query: {
                    $populate: [
                        {
                            path: 'createdBy',
                            service: 'users',
                            select: ['name']
                        },
                        {
                            path: 'updatedBy',
                            service: 'users',
                            select: ['name']
                        }
                    ]
                }
            })
            .then(async (res) => {
                set_entity(res || {});
                // Parse details JSON string and convert to array for DataTable
                if (res.details && res.serviceName) {
                    try {
                        const parsedDetails = typeof res.details === 'string' ? JSON.parse(res.details) : res.details;

                        const detailsArray = await Promise.all(
                            Object.entries(parsedDetails).map(async ([field, value]) => {
                                let displayValue = value;

                                // Fallback resolution for ObjectId fields
                                const refService = fallbackMapping[field];
                                if (refService) {
                                    if (Array.isArray(value)) {
                                        displayValue = await Promise.all(
                                            value.map(async (id) => {
                                                if (isObjectId(id)) {
                                                    try {
                                                        const refRecord = await client.service(refService).get(id);
                                                        const dispVal = refRecord.name || Object.entries(refRecord).find(([key, val]) => key !== '_id' && typeof val === 'string')?.[1] || id;
                                                        return dispVal;
                                                    } catch (error) {
                                                        console.error(`Failed to fetch ${refService} record for ${field}:`, error.message);
                                                        return `Record not found (${id})`;
                                                    }
                                                }
                                                return id;
                                            })
                                        );
                                        displayValue = displayValue.join(', ');
                                    } else if (isObjectId(value)) {
                                        try {
                                            const refRecord = await client.service(refService).get(value);
                                            displayValue = refRecord.name || Object.entries(refRecord).find(([key, val]) => key !== '_id' && typeof val === 'string')?.[1] || value;
                                        } catch (error) {
                                            console.error(`Failed to fetch ${refService} record for ${field}:`, error.message);
                                            displayValue = `Record not found (${value})`;
                                        }
                                    }
                                }

                                // Handle arrays and objects for display
                                if (Array.isArray(displayValue)) {
                                    displayValue = displayValue.join(', ');
                                } else if (typeof displayValue === 'object' && displayValue !== null) {
                                    displayValue = JSON.stringify(displayValue);
                                }

                                return {
                                    field: camelCaseToNormalWords(field), // Format field name
                                    value: displayValue
                                };
                            })
                        );
                        setDetailsData(detailsArray);
                    } catch (error) {
                        console.error('Failed to parse details:', error.message);
                        props.alert({
                            title: 'Error',
                            type: 'error',
                            message: 'Failed to parse audit details.'
                        });
                    }
                }
            })
            .catch((error) => {
                props.alert({
                    title: 'Audits',
                    type: 'error',
                    message: error.message || 'Failed to get audits'
                });
            });
    }, [props, urlParams.singleAuditsId]);

    const goBack = () => {
        navigate(-1);
    };

    const toggleHelpSidebar = () => {
        setHelpSidebarVisible(!isHelpSidebarVisible);
    };

    const copyPageLink = () => {
        const currentUrl = window.location.href;

        navigator.clipboard
            .writeText(currentUrl)
            .then(() => {
                props.alert({
                    title: 'Link Copied',
                    type: 'success',
                    message: 'Page link copied to clipboard!'
                });
            })
            .catch((err) => {
                props.alert({
                    title: 'Error',
                    type: 'error',
                    message: 'Failed to copy page link.'
                });
            });
    };

    const menuItems = [
        {
            label: 'Copy link',
            icon: 'pi pi-copy',
            command: () => copyPageLink()
        },
        {
            label: 'Help',
            icon: 'pi pi-question-circle',
            command: () => toggleHelpSidebar()
        }
    ];

    // Template for rendering field names with copy button
    const fieldTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <span className="flex-1">{rowData.field}</span>
                <Button icon="pi pi-copy" className="p-button-text p-button-sm p-button-rounded" onClick={() => copyToClipboard(rowData.field)} aria-label="Copy field name" />
            </div>
        );
    };

    // Template for rendering field values with copy button
    const valueTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <span className="flex-1">{rowData.value}</span>
                <Button icon="pi pi-copy" className="p-button-text p-button-sm p-button-rounded" onClick={() => copyToClipboard(rowData.value)} aria-label="Copy value" />
            </div>
        );
    };

    return (
        <ProjectLayout>
            <div className="col-12 flex flex-column align-items-center">
                <div className="col-12">
                    <div className="flex align-items-center justify-content-between">
                        <div className="flex align-items-center">
                            <Button className="p-button-text" icon="pi pi-chevron-left" onClick={() => goBack()} />
                            <h3 className="m-0">Audits</h3>
                            <SplitButton model={menuItems.filter((m) => !(m.icon === 'pi pi-trash' && items?.length === 0))} dropdownIcon="pi pi-ellipsis-h" buttonClassName="hidden" menuButtonClassName="ml-1 p-button-text" />
                        </div>
                    </div>
                    <div className="card w-full">
                        <div className="grid">
                            <div className="col-12 md:col-6 lg:col-3">
                                <label className="text-sm text-gray-600">Service Name</label>
                                <p className="m-0 ml-3">{_entity?.serviceName}</p>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <label className="text-sm text-gray-600">Action</label>
                                <p className="m-0 ml-3">{_entity?.action}</p>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <label className="text-sm text-gray-600">User</label>
                                <p className="m-0 ml-3">{_entity?.createdBy?.name}</p>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <label className="text-sm text-gray-600">Timestamp</label>
                                <p className="m-0 ml-3">{moment(_entity?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                            </div>
                            <div className="col-12">
                                <label className="text-sm text-gray-600">Details</label>
                                <DataTable value={detailsData} className="p-datatable-sm" scrollable style={{ marginTop: '1rem' }}>
                                    <Column field="field" header="Field" body={fieldTemplate} style={{ minWidth: '12rem' }} />
                                    <Column field="value" header="Value" body={valueTemplate} style={{ minWidth: '12rem' }} />
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-2">
                <TabView></TabView>
            </div>

            <CommentsSection recordId={urlParams.singleAuditsId} user={props.user} alert={props.alert} serviceName="audits" />
            <div
                id="rightsidebar"
                className={classNames('overlay-auto z-10 surface-overlay shadow-2 fixed top-0 right-0 w-20rem animation-duration-150 animation-ease-in-out', { hidden: !isHelpSidebarVisible, block: isHelpSidebarVisible })}
                style={{
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="flex flex-column h-full p-4 bg-white" style={{ height: 'calc(100% - 60px)', marginTop: '60px' }}>
                    <span className="text-xl font-medium text-900 mb-3">Help bar</span>
                    <div className="border-2 border-dashed surface-border border-round surface-section flex-auto"></div>
                </div>
            </div>
        </ProjectLayout>
    );
};

const mapState = (state) => {
    const { user, isLoggedIn } = state.auth;
    return { user, isLoggedIn };
};

const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data)
});

export default connect(mapState, mapDispatch)(SingleAuditsPage);
