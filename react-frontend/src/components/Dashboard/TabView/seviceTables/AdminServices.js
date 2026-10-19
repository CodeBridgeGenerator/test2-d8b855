import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import client from '../../../../services/restClient';
import { TabView, TabPanel } from 'primereact/tabview';
import LoginHistoryLineChart from '../../Charts/LineChart/UserLineChart';
import AdminLineChart from '../../Charts/LineChart/AdminLineChart';

const AdminServices = (props) => {
    const [jobData, setJobData] = useState([]);
    const [mailJobData, setMailJobData] = useState([]);
    const [errorLogData, setErrorLogData] = useState([]);
    const [webTrackerData, setWebTrackerData] = useState([]);
    const [fcmsData, setFcMsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeIndex === 0) {
                    // Fetch Mail Jobs data
                    const res = await client.service('mailQues').find({
                        query: {
                            $limit: 5,
                            $populate: [
                                {
                                    path: 'createdBy',
                                    service: 'users',
                                    select: ['name']
                                }
                            ]
                        }
                    });
                    setMailJobData(res.data);
                } else if (activeIndex === 1) {
                    // Fetch Error Logs data
                    const res = await client.service('errorLogs').find({
                        query: {
                            $limit: 5,
                            $populate: [
                                {
                                    path: 'createdBy',
                                    service: 'users',
                                    select: ['name']
                                }
                            ]
                        }
                    });
                    setErrorLogData(res.data);
                } else if (activeIndex === 2) {
                    // Fetch FCM data
                    const res = await client.service('fcms').find({
                        query: {
                            $limit: 5,
                            $populate: [
                                {
                                    path: 'createdBy',
                                    service: 'users',
                                    select: ['name']
                                }
                            ]
                        }
                    });
                    setFcMsData(res.data);
                } else if (activeIndex === 3) {
                    // Fetch Web Tracker data
                    const res = await client.service('userTrackerId').find({ query: { $limit: 5 } });
                    setWebTrackerData(res.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                props.alert({
                    title: 'Error',
                    type: 'error',
                    message: error.message || 'Failed to fetch data'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeIndex, props]);

    const dropdownTemplate0 = (rowData, { rowIndex }) => <p>{rowData.jobId?.name}</p>;

    return (
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
            <TabPanel header="Sent Mail Logs">
                <div className="mail-jobs-table">
                    {loading ? (
                        <ProgressSpinner />
                    ) : (
                        <DataTable
                            value={mailJobData}
                            rowHover
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 50, 250, 500]}
                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                            currentPageReportTemplate="{first} to {last} of {totalRecords}"
                            rowClassName="cursor-pointer"
                        >
                            <Column field="name" header="Name" sortable />
                            <Column field="from" header="From" sortable />
                            <Column field="recipients" header="Recipients" sortable />
                            <Column field="status" header="Status" sortable />
                            <Column field="content" header="Content" innerHTML={true} />
                            <Column field="createdAt" header="Created At" sortable />
                            <Column field="createdBy" header="Created By" sortable />
                        </DataTable>
                    )}
                </div>
            </TabPanel>

            <TabPanel header="System Error Logs">
                <div className="error-logs-table">
                    {loading ? (
                        <ProgressSpinner />
                    ) : (
                        <DataTable
                            value={errorLogData}
                            rowHover
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 50, 250, 500]}
                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                            currentPageReportTemplate="{first} to {last} of {totalRecords}"
                            rowClassName="cursor-pointer"
                        >
                            <Column field="serviceName" header="Service Name" sortable />
                            <Column field="errorMessage" header="Error Message" />
                            <Column field="stack" header="Stack Trace" sortable />
                            <Column field="createdAt" header="Created At" sortable />
                            <Column field="createdBy" header="Created By" sortable />
                        </DataTable>
                    )}
                </div>
            </TabPanel>
            <TabPanel header="Push Notifications">
                <div className="fcm-push-table">
                    {loading ? (
                        <ProgressSpinner />
                    ) : (
                        <DataTable
                            value={fcmsData}
                            rowHover
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 50, 250, 500]}
                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                            currentPageReportTemplate="{first} to {last} of {totalRecords}"
                            rowClassName="cursor-pointer"
                        >
                            <Column field="title" header="Title" sortable />
                            <Column field="message" header="Message" sortable />
                            <Column field="recipient" header="Recipient" sortable />
                            <Column field="status" header="Status" sortable />
                            <Column field="createdAt" header="Created At" sortable />
                            <Column field="createdBy" header="Created By" sortable />
                        </DataTable>
                    )}
                </div>
            </TabPanel>
            <TabPanel header="Web Tracker ">
                <div className="web-tracker-table">
                    {loading ? (
                        <ProgressSpinner />
                    ) : (
                        <DataTable
                            value={webTrackerData}
                            rowHover
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 50, 250, 500]}
                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                            currentPageReportTemplate="{first} to {last} of {totalRecords}"
                            rowClassName="cursor-pointer"
                        >
                            <Column field="userId" header="User ID" sortable />
                            <Column field="sessionId" header="Session ID" sortable />
                            <Column field="ipAddress" header="IP Address" sortable />
                            <Column field="userAgent" header="User Agent" sortable />
                            <Column field="createdAt" header="Created At" sortable />
                            <Column field="createdBy" header="Created By" sortable />
                        </DataTable>
                    )}
                </div>
            </TabPanel>
        </TabView>
    );
};

const mapState = (state) => {
    const { user } = state.auth;
    return { user };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
    hasServicePermission: (service) => dispatch.perms.hasServicePermission(service),
    hasServiceFieldsPermission: (service) => dispatch.perms.hasServiceFieldsPermission(service)
});

export default connect(mapState, mapDispatch)(AdminServices);
