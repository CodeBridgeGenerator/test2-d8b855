import React, { useState, useRef, useEffect } from 'react';
import _ from 'lodash';
import { Button } from 'primereact/button';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import UploadService from '../../../services/UploadService';
import InboxCreateDialogComponent from '../../cb_components/InboxPage/InboxCreateDialogComponent';
import InviteIcon from '../../../assets/media/Invite.png';
import ExportIcon from '../../../assets/media/Export & Share.png';
import CopyIcon from '../../../assets/media/Clipboard.png';
import DuplicateIcon from '../../../assets/media/Duplicate.png';
import DeleteIcon from '../../../assets/media/Trash.png';
import client from '../../../services/restClient';

const AuditsDataTable = ({
    items,
    fields,
    onEditRow,
    onRowDelete,
    onRowClick,
    searchDialog,
    setSearchDialog,
    showUpload,
    setShowUpload,
    showFilter,
    setShowFilter,
    showColumns,
    setShowColumns,
    onClickSaveFilteredfields,
    selectedFilterFields,
    setSelectedFilterFields,
    selectedHideFields,
    setSelectedHideFields,
    onClickSaveHiddenfields,
    loading,
    user,
    selectedDelete,
    setSelectedDelete,
    onCreateResult,
    first,
    rows,
    onPage
}) => {
    const dt = useRef(null);
    const urlParams = useParams();
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [filteredItems, setFilteredItems] = useState(items);
    const [activeFilters, setActiveFilters] = useState([]);

    // Custom paginator template
    const template1 = {
        layout: 'RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink JumpToPageInput NextPageLink LastPageLink',
        RowsPerPageDropdown: (options) => {
            const dropdownOptions = [
                { label: 10, value: 10 },
                { label: 20, value: 20 },
                { label: 50, value: 50 },
                { label: 100, value: 100 }
            ];
            return (
                <React.Fragment>
                    <div>
                        <Dropdown value={options.value} options={dropdownOptions} onChange={options.onChange} />
                        <span className="mr-3 ml-2" style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                            items per page
                        </span>
                    </div>
                </React.Fragment>
            );
        },
        CurrentPageReport: (options) => {
            return (
                <div className=" mr-20">
                    <span style={{ color: 'grey', userSelect: 'none' }}>
                        <span className="mr-3 ml-2">|</span>
                        <span className="mr-20">
                            {options.first} - {options.last} of {options.totalRecords} items{' '}
                        </span>
                    </span>
                </div>
            );
        },
        JumpToPageInput: (options) => {
            return (
                <div>
                    <span>Page</span>
                    {options.element}
                    <span>of {options.props.totalPages}</span>
                </div>
            );
        }
    };

    // Extract unique service names and user names for filter options
    useEffect(() => {
        const uniqueServices = [...new Set(items.map((item) => item.serviceName))].filter(Boolean).map((service) => ({ label: service, value: service }));
        const uniqueUsers = [...new Set(items.map((item) => item.createdBy?.name).filter(Boolean))].map((name) => ({ label: name, value: name }));
        setServiceOptions(uniqueServices);
        setUserOptions(uniqueUsers);
    }, [items]);

    // Update active filters when filters change
    useEffect(() => {
        const newActiveFilters = [];

        if (globalFilter) {
            newActiveFilters.push({
                type: 'search',
                label: `Search: "${globalFilter}"`,
                key: 'search',
                value: globalFilter
            });
        }

        if (selectedServices.length > 0) {
            selectedServices.forEach((service) => {
                newActiveFilters.push({
                    type: 'service',
                    label: `Service: ${service}`,
                    key: `service_${service}`,
                    value: service
                });
            });
        }

        if (selectedUsers.length > 0) {
            selectedUsers.forEach((user) => {
                newActiveFilters.push({
                    type: 'user',
                    label: `User: ${user}`,
                    key: `user_${user}`,
                    value: user
                });
            });
        }

        setActiveFilters(newActiveFilters);
    }, [globalFilter, selectedServices, selectedUsers]);

    // Apply filters: global search, services, and users
    const applyFilters = () => {
        let filtered = items;

        // Apply global filter
        if (globalFilter) {
            const lowercaseFilter = globalFilter.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.serviceName?.toLowerCase().includes(lowercaseFilter) ||
                    item.action?.toLowerCase().includes(lowercaseFilter) ||
                    item.method?.toLowerCase().includes(lowercaseFilter) ||
                    (typeof item.details === 'string' && item.details.toLowerCase().includes(lowercaseFilter)) ||
                    item.createdBy?.name?.toLowerCase().includes(lowercaseFilter) ||
                    moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss').includes(lowercaseFilter)
            );
        }

        // Apply service filter
        if (selectedServices.length > 0) {
            filtered = filtered.filter((item) => selectedServices.includes(item.serviceName));
        }

        // Apply user filter
        if (selectedUsers.length > 0) {
            filtered = filtered.filter((item) => selectedUsers.includes(item.createdBy?.name));
        }

        setFilteredItems(filtered);
    };

    // Re-apply filters when globalFilter, selectedServices, or selectedUsers change
    useEffect(() => {
        applyFilters();
    }, [globalFilter, selectedServices, selectedUsers, items]);

    // Function to remove a specific filter
    const removeFilter = (filterKey, filterType, filterValue) => {
        switch (filterType) {
            case 'search':
                setGlobalFilter('');
                break;
            case 'service':
                setSelectedServices((prev) => prev.filter((service) => service !== filterValue));
                break;
            case 'user':
                setSelectedUsers((prev) => prev.filter((user) => user !== filterValue));
                break;
            default:
                break;
        }
    };

    // Function to clear all filters
    const clearAllFilters = () => {
        setGlobalFilter('');
        setSelectedServices([]);
        setSelectedUsers([]);
    };

    const serviceNameTemplate = (rowData) => {
        return <p>{rowData.serviceName}</p>;
    };

    const actionTemplate = (rowData) => {
        return <p>{rowData.action}</p>;
    };

    const methodTemplate = (rowData) => {
        return <p>{rowData.method}</p>;
    };

    const detailsTemplate = (rowData) => {
        return <p>{rowData.details}</p>;
    };

    const createdByTemplate = (rowData) => {
        return <p>{rowData.createdBy?.name}</p>;
    };

    const timestampTemplate = (rowData) => {
        return <p>{moment(rowData.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>;
    };

    const editTemplate = (rowData, { rowIndex }) => {
        return <Button onClick={() => onEditRow(rowData, rowIndex)} icon={`pi ${rowData.isEdit ? 'pi-check' : 'pi-pencil'}`} className={`p-button-rounded p-button-text ${rowData.isEdit ? 'p-button-success' : 'p-button-warning'}`} />;
    };

    const deleteTemplate = (rowData, { rowIndex }) => {
        return <Button onClick={() => onRowDelete(rowData._id)} icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-text" />;
    };

    const checkboxTemplate = (rowData) => {
        return (
            <Checkbox
                checked={selectedItems.some((item) => item._id === rowData._id)}
                onChange={(e) => {
                    let _selectedItems = [...selectedItems];
                    if (e.checked) {
                        _selectedItems.push(rowData);
                    } else {
                        _selectedItems = _selectedItems.filter((item) => item._id !== rowData._id);
                    }
                    setSelectedItems(_selectedItems);
                }}
            />
        );
    };

    const deselectAllRows = () => {
        setSelectedItems([]);
    };

    const handleDelete = async () => {
        if (!selectedItems || selectedItems.length === 0) return;

        try {
            const promises = selectedItems.map((item) => client.service('audits').remove(item._id));
            await Promise.all(promises);
            const updatedData = filteredItems.filter((item) => !selectedItems.find((selected) => selected._id === item._id));
            setFilteredItems(updatedData);
            setSelectedDelete(selectedItems.map((item) => item._id));
            deselectAllRows();
        } catch (error) {
            console.error('Failed to delete selected records', error);
        }
    };

    const handleMessage = () => {
        setShowDialog(true);
    };

    const handleHideDialog = () => {
        setShowDialog(false);
    };

    const renderDataTable = () => (
        <DataTable
            value={filteredItems}
            ref={dt}
            removableSort
            onRowClick={onRowClick}
            scrollable
            rowHover
            stripedRows
            paginator
            first={first}
            rows={rows}
            onPage={onPage}
            totalRecords={filteredItems.length}
            rowsPerPageOptions={[10, 50, 250, 500]}
            paginatorTemplate={template1}
            rowClassName={() => ({ 'cursor-pointer': true })}
            alwaysShowPaginator={!urlParams.singleUsersId}
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            onCreateResult={onCreateResult}
        >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} body={checkboxTemplate} />
            <Column field="serviceName" header="Service Name" body={serviceNameTemplate} filter={selectedFilterFields.includes('serviceName')} hidden={selectedHideFields?.includes('serviceName')} sortable style={{ minWidth: '8rem' }} frozen />
            <Column field="action" header="Action" body={actionTemplate} filter={selectedFilterFields.includes('action')} hidden={selectedHideFields?.includes('action')} sortable style={{ minWidth: '8rem' }} />
            <Column field="createdBy" header="User" body={createdByTemplate} filter={selectedFilterFields.includes('createdBy')} hidden={selectedHideFields?.includes('createdBy')} sortable style={{ minWidth: '8rem' }} />
            <Column field="createdAt" header="Timestamp" body={timestampTemplate} filter={selectedFilterFields.includes('createdAt')} hidden={selectedHideFields?.includes('createdAt')} sortable style={{ minWidth: '8rem' }} />
            <Column header="Edit" body={editTemplate} style={{ minWidth: '3rem' }} />
            <Column header="Delete" body={deleteTemplate} style={{ minWidth: '3rem' }} />
        </DataTable>
    );

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    gap: '1rem'
                }}
            >
                <div style={{ flex: 1 }}>
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search audits..." style={{ width: '100%', padding: '0.5rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <MultiSelect value={selectedServices} onChange={(e) => setSelectedServices(e.value)} options={serviceOptions} placeholder="Filter by Service" style={{ width: '100%' }} filter maxSelectedLabels={3} />
                </div>
                <div style={{ flex: 1 }}>
                    <MultiSelect value={selectedUsers} onChange={(e) => setSelectedUsers(e.value)} options={userOptions} placeholder="Filter by User" style={{ width: '100%' }} filter maxSelectedLabels={3} />
                </div>
            </div>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}
                    >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Active Filters:</span>
                        <Button icon="pi pi-times" label="Clear All" onClick={clearAllFilters} className="p-button-text p-button-sm" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}
                    >
                        {activeFilters.map((filter) => (
                            <div
                                key={filter.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: '#e3f2fd',
                                    padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                                    borderRadius: '16px',
                                    fontSize: '0.85rem',
                                    border: '1px solid #bbdefb'
                                }}
                            >
                                <span style={{ marginRight: '0.5rem' }}>{filter.label}</span>
                                <button
                                    onClick={() => removeFilter(filter.key, filter.type, filter.value)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#666',
                                        fontSize: '0.9rem',
                                        padding: '0',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#ffcdd2';
                                        e.target.style.color = '#d32f2f';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#666';
                                    }}
                                    title="Remove filter"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {renderDataTable()}

            {selectedItems.length > 0 ? (
                <div
                    className="card center"
                    style={{
                        width: '51rem',
                        margin: '20px auto 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#2A4454'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #2A4454',
                            padding: '5px',
                            borderRadius: '5px'
                        }}
                    >
                        {selectedItems.length} selected
                        <span
                            className="pi pi-times"
                            style={{
                                cursor: 'pointer',
                                marginLeft: '10px',
                                color: '#2A4454'
                            }}
                            onClick={deselectAllRows}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            label="Copy"
                            labelposition="right"
                            icon={<img src={CopyIcon} style={{ marginRight: '4px', width: '1em', height: '1em' }} />}
                            className="p-button-rounded p-button-text"
                            style={{
                                backgroundColor: 'white',
                                color: '#2A4454',
                                border: '1px solid transparent',
                                transition: 'border-color 0.3s',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                marginRight: '8px',
                                gap: '4px'
                            }}
                        />

                        <Button
                            label="Duplicate"
                            labelposition="right"
                            icon={<img src={DuplicateIcon} style={{ marginRight: '4px', width: '1em', height: '1em' }} />}
                            className="p-button-rounded p-button-text"
                            style={{
                                backgroundColor: 'white',
                                color: '#2A4454',
                                border: '1px solid transparent',
                                transition: 'border-color 0.3s',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                marginRight: '8px',
                                gap: '4px'
                            }}
                        />

                        <Button
                            label="Export"
                            labelposition="right"
                            icon={<img src={ExportIcon} style={{ marginRight: '4px', width: '1em', height: '1em' }} />}
                            className="p-button-rounded p-button-text"
                            style={{
                                backgroundColor: 'white',
                                color: '#2A4454',
                                border: '1px solid transparent',
                                transition: 'border-color 0.3s',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                marginRight: '8px',
                                gap: '4px'
                            }}
                        />

                        <Button
                            label="Message"
                            labelposition="right"
                            icon={<img src={InviteIcon} style={{ marginRight: '4px', width: '1em', height: '1em' }} />}
                            onClick={handleMessage}
                            className="p-button-rounded p-button-text"
                            style={{
                                backgroundColor: 'white',
                                color: '#2A4454',
                                border: '1px solid transparent',
                                transition: 'border-color 0.3s',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                marginRight: '8px',
                                gap: '4px'
                            }}
                        />

                        <InboxCreateDialogComponent show={showDialog} onHide={handleHideDialog} serviceInbox="audits" onCreateResult={onCreateResult} selectedItemsId={selectedItems} />

                        <Button
                            label="Delete"
                            labelposition="right"
                            icon={<img src={DeleteIcon} style={{ marginRight: '4px', width: '1em', height: '1em' }} />}
                            onClick={handleDelete}
                            style={{
                                backgroundColor: 'white',
                                color: '#2A4454',
                                border: '1px solid transparent',
                                transition: 'border-color 0.3s',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                gap: '4px'
                            }}
                        />
                    </div>
                </div>
            ) : null}

            <Dialog header="Upload Audits Data" visible={showUpload} onHide={() => setShowUpload(false)}>
                <UploadService
                    user={user}
                    serviceName="audits"
                    onUploadComplete={() => {
                        setShowUpload(false);
                    }}
                />
            </Dialog>

            <Dialog header="Search Audits" visible={searchDialog} onHide={() => setSearchDialog(false)}>
                Search
            </Dialog>
            <Dialog header="Filter Columns" visible={showFilter} onHide={() => setShowFilter(false)}>
                <div className="card flex justify-content-center">
                    <MultiSelect value={selectedFilterFields} onChange={(e) => setSelectedFilterFields(e.value)} options={fields} optionLabel="name" optionValue="value" filter placeholder="Select Fields" maxSelectedLabels={6} className="w-full md:w-20rem" />
                </div>
                <Button
                    text
                    label="Save as Preference"
                    onClick={() => {
                        console.debug(selectedFilterFields);
                        onClickSaveFilteredfields(selectedFilterFields);
                        setSelectedFilterFields(selectedFilterFields);
                        setShowFilter(false);
                    }}
                />
            </Dialog>

            <Dialog header="Hide Columns" visible={showColumns} onHide={() => setShowColumns(false)}>
                <div className="card flex justify-content-center">
                    <MultiSelect value={selectedHideFields} onChange={(e) => setSelectedHideFields(e.value)} options={fields} optionLabel="name" optionValue="value" filter placeholder="Select Fields" maxSelectedLabels={6} className="w-full md:w-20rem" />
                </div>
                <Button
                    text
                    label="Save as Preference"
                    onClick={() => {
                        console.debug(selectedHideFields);
                        onClickSaveHiddenfields(selectedHideFields);
                        setSelectedHideFields(selectedHideFields);
                        setShowColumns(false);
                    }}
                />
            </Dialog>
        </>
    );
};

export default AuditsDataTable;
