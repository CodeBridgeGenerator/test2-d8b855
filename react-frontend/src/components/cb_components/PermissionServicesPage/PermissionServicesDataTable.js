import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import _ from "lodash";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";

import client from "../../../services/restClient";
import UploadService from "../../../services/UploadService";
import DownloadCSV from "../../../utils/DownloadCSV";

import ExportIcon from "../../../assets/media/Export & Share.png";
import CopyIcon from "../../../assets/media/Clipboard.png";
import DuplicateIcon from "../../../assets/media/Duplicate.png";
import DeleteIcon from "../../../assets/media/Trash.png";
import DeleteImage from "../../../assets/media/Delete.png";

const EMPTY_PERMISSIONS = {
  readOne: false,
  readAll: false,

  insert: false,
  insertBulk: false,

  edit: false,
  editBulk: false,

  deleteOne: false,
  deleteBulk: false,

  import: false,
  export: false,
  seeder: false,

  // Old compatibility fields
  read: false,
  create: false,
  update: false,
  delete: false,
};

const PermissionServicesDataTable = ({
  items = [],
  fields = [],

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

  selectedFilterFields = [],
  setSelectedFilterFields,

  selectedHideFields = [],
  setSelectedHideFields,

  onClickSaveHiddenfields,

  loading,
  user,

  setSelectedDelete,

  selectedUser,

  setPaginatorRecordsNo,
  paginatorRecordsNo = 10,

  hasServicePermission,
  hasServiceFieldsPermission,

  filename = "permissionServices",

  alert,
}) => {
  const dt = useRef(null);
  const toast = useRef(null);
  const urlParams = useParams();

  const [localItems, setLocalItems] = useState(items);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS);
  const [fieldPermissions, setFieldPermissions] = useState({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const [triggerDownload, setTriggerDownload] = useState(false);
  const [selectedExportData, setSelectedExportData] = useState([]);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setSelectedItems((currentItems) =>
      currentItems.filter((selectedItem) =>
        items.some((item) => item._id === selectedItem._id),
      ),
    );
  }, [items]);

  const normalizePermissions = (permissionData) => {
    const normalized = {
      ...EMPTY_PERMISSIONS,
      ...(permissionData || {}),
    };

    /*
     * Compatibility for old permission records.
     * New fields take priority when present.
     */
    if (typeof permissionData?.readOne !== "boolean") {
      normalized.readOne = Boolean(permissionData?.read);
    }

    if (typeof permissionData?.readAll !== "boolean") {
      normalized.readAll = Boolean(permissionData?.read);
    }

    if (typeof permissionData?.insert !== "boolean") {
      normalized.insert = Boolean(permissionData?.create);
    }

    if (typeof permissionData?.insertBulk !== "boolean") {
      normalized.insertBulk = Boolean(permissionData?.create);
    }

    if (typeof permissionData?.edit !== "boolean") {
      normalized.edit = Boolean(permissionData?.update);
    }

    if (typeof permissionData?.editBulk !== "boolean") {
      normalized.editBulk = Boolean(permissionData?.update);
    }

    if (typeof permissionData?.deleteOne !== "boolean") {
      normalized.deleteOne = Boolean(permissionData?.delete);
    }

    if (typeof permissionData?.deleteBulk !== "boolean") {
      normalized.deleteBulk = Boolean(permissionData?.delete);
    }

    normalized.read = normalized.readAll;
    normalized.create = normalized.insert;
    normalized.update = normalized.edit;
    normalized.delete = normalized.deleteOne;

    return normalized;
  };

  const fetchServicePermissions = async () => {
    setIsLoadingPermissions(true);

    try {
      const servicePermissions = await hasServicePermission(filename);

      const serviceFieldPermissions =
        typeof hasServiceFieldsPermission === "function"
          ? await hasServiceFieldsPermission(filename)
          : {};

      setPermissions(normalizePermissions(servicePermissions));
      setFieldPermissions(serviceFieldPermissions || {});
    } catch (error) {
      console.error("Failed to load permission-service permissions:", error);

      setPermissions(EMPTY_PERMISSIONS);
      setFieldPermissions({});
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchServicePermissions();
  }, [selectedUser, filename]);

  const getReferenceId = (value) => {
    if (!value) return undefined;

    if (typeof value === "object") {
      return value._id || value.id;
    }

    return value;
  };

  const getReferenceName = (value, fallback = "Unassigned") => {
    if (!value) return fallback;

    if (typeof value === "object") {
      return value.name || fallback;
    }

    return fallback;
  };

  const getPermissionValue = (rowData, newField, oldField) => {
    if (typeof rowData?.[newField] === "boolean") {
      return rowData[newField];
    }

    return Boolean(rowData?.[oldField]);
  };

  const permissionStatus = (allowed) => (
    <span
      className={allowed ? "text-green-600 font-semibold" : "text-500"}
    >
      {allowed ? "Yes" : "No"}
    </span>
  );

  const permissionPair = (
    firstLabel,
    firstValue,
    secondLabel,
    secondValue,
  ) => (
    <div className="flex flex-column gap-2">
      <div className="flex justify-content-between gap-3">
        <span>{firstLabel}</span>
        {permissionStatus(firstValue)}
      </div>

      <div className="flex justify-content-between gap-3">
        <span>{secondLabel}</span>
        {permissionStatus(secondValue)}
      </div>
    </div>
  );

  const permissionSetTemplate = (rowData) => (
    <div className="flex flex-column">
      <span className="font-semibold">
        {rowData.name || "Default Permission Set"}
      </span>

      {rowData.description ? (
        <small className="text-500 mt-1">{rowData.description}</small>
      ) : null}
    </div>
  );

  const serviceScopeTemplate = (rowData) => {
    const isExcludeMode =
      rowData.serviceMode === "exclude" || rowData.service === "*";

    if (isExcludeMode) {
      const excludedServices = Array.isArray(rowData.excludedServices)
        ? rowData.excludedServices
        : [];

      return (
        <div className="flex flex-column">
          <span className="font-semibold">All Services</span>

          <small className="text-500 mt-1">
            {excludedServices.length > 0
              ? `Except: ${excludedServices.join(", ")}`
              : "No excluded services"}
          </small>
        </div>
      );
    }

    return <span>{rowData.service || "-"}</span>;
  };

  const readTemplate = (rowData) =>
    permissionPair(
      "Read One",
      getPermissionValue(rowData, "readOne", "read"),
      "Read All",
      getPermissionValue(rowData, "readAll", "read"),
    );

  const insertTemplate = (rowData) =>
    permissionPair(
      "Insert",
      getPermissionValue(rowData, "insert", "create"),
      "Insert Bulk",
      getPermissionValue(rowData, "insertBulk", "create"),
    );

  const editPermissionsTemplate = (rowData) =>
    permissionPair(
      "Edit",
      getPermissionValue(rowData, "edit", "update"),
      "Edit Bulk",
      getPermissionValue(rowData, "editBulk", "update"),
    );

  const deletePermissionsTemplate = (rowData) =>
    permissionPair(
      "Delete One",
      getPermissionValue(rowData, "deleteOne", "delete"),
      "Delete Bulk",
      getPermissionValue(rowData, "deleteBulk", "delete"),
    );

  const administrationTemplate = (rowData) => (
    <div className="flex flex-column gap-2">
      <div className="flex justify-content-between gap-3">
        <span>Import</span>
        {permissionStatus(Boolean(rowData.import))}
      </div>

      <div className="flex justify-content-between gap-3">
        <span>Export</span>
        {permissionStatus(Boolean(rowData.export))}
      </div>

      <div className="flex justify-content-between gap-3">
        <span>Seeder</span>
        {permissionStatus(Boolean(rowData.seeder))}
      </div>
    </div>
  );

  const roleTemplate = (rowData) => (
    <span>{getReferenceName(rowData.roleId, "-")}</span>
  );

  const positionTemplate = (rowData) => (
    <span>{getReferenceName(rowData.positionId, "-")}</span>
  );

  const profileTemplate = (rowData) => (
    <span>{getReferenceName(rowData.profile, "-")}</span>
  );

  const roleGroupNameTemplate = (rowData) => (
    <div className="flex align-items-center gap-2 py-2">
      <i className="pi pi-users" />
      <span className="font-semibold">
        Role: {getReferenceName(rowData.roleId)}
      </span>
    </div>
  );

  const positionGroupNameTemplate = (rowData) => (
    <div className="flex align-items-center gap-2 py-2">
      <i className="pi pi-briefcase" />
      <span className="font-semibold">
        Position: {getReferenceName(rowData.positionId)}
      </span>
    </div>
  );

  const profileGroupNameTemplate = (rowData) => (
    <div className="flex align-items-center gap-2 py-2">
      <i className="pi pi-user" />
      <span className="font-semibold">
        Profile: {getReferenceName(rowData.profile)}
      </span>
    </div>
  );

  const roleItems = useMemo(
    () => localItems.filter((item) => Boolean(item.roleId)),
    [localItems],
  );

  const positionItems = useMemo(
    () => localItems.filter((item) => Boolean(item.positionId)),
    [localItems],
  );

  const profileItems = useMemo(
    () => localItems.filter((item) => Boolean(item.profile)),
    [localItems],
  );

  const canSelectRows =
    permissions.insertBulk ||
    permissions.deleteBulk ||
    permissions.export;

  const header = (
    <div
      className="table-header flex flex-wrap justify-content-between align-items-center gap-3"
    >
      <div className="flex align-items-center gap-2">
        {selectedItems.length > 0 ? (
          <span className="font-medium">
            {selectedItems.length} selected
          </span>
        ) : (
          <span />
        )}
      </div>

      <span className="p-input-icon-left">
        <i className="pi pi-search" />

        <InputText
          type="search"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Keyword Search"
        />
      </span>
    </div>
  );

  const paginatorTemplate = {
    layout:
      "RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink JumpToPageInput NextPageLink LastPageLink",

    RowsPerPageDropdown: (options) => {
      const dropdownOptions = [
        { label: 5, value: 5 },
        { label: 10, value: 10 },
        { label: 20, value: 20 },
        { label: 50, value: 50 },
        { label: 120, value: 120 },
      ];

      return (
        <div className="flex align-items-center">
          <Dropdown
            value={paginatorRecordsNo}
            options={dropdownOptions}
            onChange={(event) => {
              options.onChange(event);

              if (typeof setPaginatorRecordsNo === "function") {
                setPaginatorRecordsNo(event.value);
              }
            }}
          />

          <span
            className="mr-3 ml-2"
            style={{
              color: "var(--text-color)",
              userSelect: "none",
            }}
          >
            items per page
          </span>
        </div>
      );
    },

    CurrentPageReport: (options) => (
      <div>
        <span
          style={{
            color: "grey",
            userSelect: "none",
          }}
        >
          <span className="mr-3 ml-2">|</span>

          <span>
            {options.first} - {options.last} of {options.totalRecords} items
          </span>
        </span>
      </div>
    ),

    JumpToPageInput: (options) => (
      <div className="flex align-items-center gap-2">
        <span>Page</span>
        {options.element}
        <span>of {options.props.totalPages}</span>
      </div>
    ),
  };

  const showToast = (severity, summary, detail) => {
    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  const deselectAllRows = () => {
    setSelectedItems([]);
  };

  const handleCopy = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    try {
      const dataToCopy = selectedItems.map((item) =>
        _.omit(item, ["__v"]),
      );

      await navigator.clipboard.writeText(
        JSON.stringify(dataToCopy, null, 2),
      );

      showToast(
        "success",
        "Copied",
        `${selectedItems.length} permission record(s) copied to the clipboard.`,
      );
    } catch (error) {
      console.error("Failed to copy permission records:", error);

      showToast(
        "error",
        "Copy Failed",
        error.message || "Failed to copy permission records.",
      );
    }
  };

  const prepareDuplicateRecord = (item) => {
    const record = _.omit(item, [
      "_id",
      "__v",
      "createdAt",
      "updatedAt",
    ]);

    const roleId = getReferenceId(item.roleId);
    const positionId = getReferenceId(item.positionId);
    const profileId = getReferenceId(item.profile);
    const userId = getReferenceId(item.userId);

    if (roleId) {
      record.roleId = roleId;
    } else {
      delete record.roleId;
    }

    if (positionId) {
      record.positionId = positionId;
    } else {
      delete record.positionId;
    }

    if (profileId) {
      record.profile = profileId;
    } else {
      delete record.profile;
    }

    if (userId) {
      record.userId = userId;
    } else {
      delete record.userId;
    }

    record.name = `${item.name || "Permission Set"} Copy`;
    record.createdBy = user?._id;
    record.updatedBy = user?._id;

    return record;
  };

  const handleDuplicate = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    if (!permissions.insertBulk) {
      showToast(
        "error",
        "Permission Denied",
        "You do not have Insert Bulk permission.",
      );

      return;
    }

    setDuplicateLoading(true);

    try {
      const recordsToCreate = selectedItems.map(prepareDuplicateRecord);

      const response = await client
        .service("permissionServices")
        .create(recordsToCreate);

      const createdRecords = Array.isArray(response) ? response : [response];

      setLocalItems((currentItems) => [
        ...currentItems,
        ...createdRecords,
      ]);

      setSelectedItems([]);

      showToast(
        "success",
        "Duplicated",
        `${createdRecords.length} permission record(s) duplicated successfully.`,
      );
    } catch (error) {
      console.error("Failed to duplicate permission records:", error);

      showToast(
        "error",
        "Duplicate Failed",
        error.message || "Failed to duplicate permission records.",
      );
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleExport = () => {
    if (!permissions.export) {
      showToast(
        "error",
        "Permission Denied",
        "You do not have Export permission.",
      );

      return;
    }

    const dataToExport =
      selectedItems.length > 0 ? selectedItems : localItems;

    if (dataToExport.length === 0) {
      showToast(
        "warn",
        "No Data",
        "There are no permission records to export.",
      );

      return;
    }

    setSelectedExportData(dataToExport);
    setTriggerDownload(true);

    showToast(
      "success",
      "Export Started",
      `${dataToExport.length} permission record(s) prepared for export.`,
    );
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) {
      return;
    }

    if (!permissions.deleteBulk) {
      showToast(
        "error",
        "Permission Denied",
        "You do not have Delete Bulk permission.",
      );

      return;
    }

    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    setDeleteLoading(true);

    try {
      const selectedIds = selectedItems.map((item) => item._id);

      /*
       * This is a real bulk remove.
       *
       * permissionServices service options must contain:
       * multi: ["create", "patch", "remove"]
       */
      await client.service("permissionServices").remove(null, {
        query: {
          _id: {
            $in: selectedIds,
          },
        },
      });

      setLocalItems((currentItems) =>
        currentItems.filter(
          (item) => !selectedIds.includes(item._id),
        ),
      );

      if (typeof setSelectedDelete === "function") {
        setSelectedDelete(selectedIds);
      }

      setSelectedItems([]);
      setShowDeleteConfirmation(false);

      showToast(
        "success",
        "Deleted",
        `${selectedIds.length} permission record(s) deleted successfully.`,
      );
    } catch (error) {
      console.error("Failed to delete permission records:", error);

      showToast(
        "error",
        "Delete Failed",
        error.message || "Failed to delete selected permission records.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRowClick = (event) => {
    if (!permissions.readOne) {
      showToast(
        "error",
        "Permission Denied",
        "You do not have Read One permission.",
      );

      return;
    }

    if (typeof onRowClick === "function") {
      onRowClick(event);
    }
  };

  const editActionTemplate = (rowData) => (
    <Button
      icon="pi pi-pencil"
      tooltip="Edit"
      tooltipOptions={{
        position: "top",
      }}
      className="p-button-rounded p-button-text p-button-warning"
      onClick={(event) => {
        event.stopPropagation();

        if (typeof onEditRow === "function") {
          onEditRow(rowData);
        }
      }}
    />
  );

  const deleteActionTemplate = (rowData) => (
    <Button
      icon="pi pi-trash"
      tooltip="Delete"
      tooltipOptions={{
        position: "top",
      }}
      className="p-button-rounded p-button-text p-button-danger"
      onClick={(event) => {
        event.stopPropagation();

        if (typeof onRowDelete === "function") {
          onRowDelete(rowData._id);
        }
      }}
    />
  );

  const renderSkeleton = () => (
    <DataTable
      value={Array.from({
        length: 5,
      })}
      className="p-datatable-striped"
    >
      <Column body={<Skeleton />} />
      <Column body={<Skeleton />} />
      <Column body={<Skeleton />} />
      <Column body={<Skeleton />} />
      <Column body={<Skeleton />} />
      <Column body={<Skeleton />} />
    </DataTable>
  );

  const renderEmptyMessage = (message) => (
    <div className="p-5 text-center text-500">{message}</div>
  );

  const renderDataTable = ({
    tableItems,
    groupField,
    groupHeaderTemplate,
    targetField,
    targetHeader,
    targetTemplate,
  }) => {
    if (isLoadingPermissions) {
      return renderSkeleton();
    }

    if (!permissions.readAll) {
      return renderEmptyMessage(
        "You do not have permission to view permission records.",
      );
    }

    if (!tableItems.length) {
      return renderEmptyMessage(`No ${targetHeader.toLowerCase()} records found.`);
    }

    return (
      <DataTable
        value={tableItems}
        ref={dt}
        dataKey="_id"
        removableSort
        scrollable
        rowHover
        stripedRows
        paginator
        rows={paginatorRecordsNo}
        rowsPerPageOptions={[5, 10, 20, 50, 120]}
        size="small"
        paginatorTemplate={paginatorTemplate}
        currentPageReportTemplate="{first} to {last} of {totalRecords}"
        alwaysShowPaginator={!urlParams.singleUsersId}
        loading={loading}
        globalFilter={globalFilter}
        globalFilterFields={[
          "name",
          "description",
          "service",
          "roleId.name",
          "positionId.name",
          "profile.name",
        ]}
        header={header}
        selection={selectedItems}
        onSelectionChange={(event) => setSelectedItems(event.value)}
        onRowClick={handleRowClick}
        rowClassName={() =>
          permissions.readOne ? "cursor-pointer" : ""
        }
        rowGroupMode="subheader"
        groupRowsBy={groupField}
        sortField={groupField}
        sortOrder={1}
        rowGroupHeaderTemplate={groupHeaderTemplate}
        emptyMessage="No permission records found."
      >
        {canSelectRows ? (
          <Column
            selectionMode="multiple"
            headerStyle={{
              width: "3rem",
            }}
            frozen
          />
        ) : null}

        <Column
          field="name"
          header="Permission Set"
          body={permissionSetTemplate}
          filter={selectedFilterFields.includes("name")}
          hidden={selectedHideFields.includes("name")}
          sortable
          style={{
            minWidth: "13rem",
          }}
          frozen
        />

        <Column
          field={targetField}
          header={targetHeader}
          body={targetTemplate}
          filter={selectedFilterFields.includes(targetField)}
          hidden={selectedHideFields.includes(targetField)}
          sortable
          style={{
            minWidth: "10rem",
          }}
        />

        <Column
          field="service"
          header="Service Scope"
          body={serviceScopeTemplate}
          filter={selectedFilterFields.includes("service")}
          hidden={selectedHideFields.includes("service")}
          sortable
          style={{
            minWidth: "14rem",
          }}
        />

        <Column
          field="readPermissions"
          header="Read"
          body={readTemplate}
          hidden={selectedHideFields.includes("readPermissions")}
          style={{
            minWidth: "12rem",
          }}
        />

        <Column
          field="insertPermissions"
          header="Insert"
          body={insertTemplate}
          hidden={selectedHideFields.includes("insertPermissions")}
          style={{
            minWidth: "12rem",
          }}
        />

        <Column
          field="editPermissions"
          header="Edit"
          body={editPermissionsTemplate}
          hidden={selectedHideFields.includes("editPermissions")}
          style={{
            minWidth: "12rem",
          }}
        />

        <Column
          field="deletePermissions"
          header="Delete"
          body={deletePermissionsTemplate}
          hidden={selectedHideFields.includes("deletePermissions")}
          style={{
            minWidth: "12rem",
          }}
        />

        <Column
          field="administration"
          header="Administration"
          body={administrationTemplate}
          hidden={selectedHideFields.includes("administration")}
          style={{
            minWidth: "12rem",
          }}
        />

        {permissions.edit ? (
          <Column
            header="Edit"
            body={editActionTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{
              width: "5rem",
            }}
          />
        ) : null}

        {permissions.deleteOne ? (
          <Column
            header="Delete"
            body={deleteActionTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{
              width: "5rem",
            }}
          />
        ) : null}
      </DataTable>
    );
  };

  const actionToolbar =
    selectedItems.length > 0 ? (
      <div
        className="card flex flex-wrap align-items-center justify-content-between gap-3"
        style={{
          position: "fixed",
          bottom: "20px",
          left: "200px",
          right: 0,
          margin: "0 auto",
          width: "min(56rem, calc(100vw - 240px))",
          padding: "10px 14px",
          color: "#2A4454",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
        }}
      >
        <div
          className="flex align-items-center gap-2"
          style={{
            border: "1px solid #2A4454",
            padding: "6px 10px",
            borderRadius: "6px",
          }}
        >
          <span>{selectedItems.length} selected</span>

          <button
            type="button"
            aria-label="Clear selection"
            className="p-link"
            onClick={deselectAllRows}
          >
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="flex flex-wrap align-items-center gap-2">
          <Button
            label="Copy"
            icon={
              <img
                src={CopyIcon}
                alt=""
                style={{
                  width: "1em",
                  height: "1em",
                }}
              />
            }
            onClick={handleCopy}
            className="p-button-rounded p-button-text"
          />

          {permissions.insertBulk ? (
            <Button
              label="Duplicate"
              icon={
                <img
                  src={DuplicateIcon}
                  alt=""
                  style={{
                    width: "1em",
                    height: "1em",
                  }}
                />
              }
              onClick={handleDuplicate}
              loading={duplicateLoading}
              className="p-button-rounded p-button-text"
            />
          ) : null}

          {permissions.export ? (
            <Button
              label="Export"
              icon={
                <img
                  src={ExportIcon}
                  alt=""
                  style={{
                    width: "1em",
                    height: "1em",
                  }}
                />
              }
              onClick={handleExport}
              className="p-button-rounded p-button-text"
            />
          ) : null}

          {permissions.deleteBulk ? (
            <Button
              label="Delete"
              icon={
                <img
                  src={DeleteIcon}
                  alt=""
                  style={{
                    width: "1em",
                    height: "1em",
                  }}
                />
              }
              onClick={handleDelete}
              className="p-button-rounded p-button-text p-button-danger"
            />
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <>
      <TabView>
        <TabPanel
          header={`Roles (${roleItems.length})`}
          leftIcon="pi pi-users mr-2"
        >
          {renderDataTable({
            tableItems: roleItems,
            groupField: "roleId.name",
            groupHeaderTemplate: roleGroupNameTemplate,
            targetField: "roleId.name",
            targetHeader: "Role",
            targetTemplate: roleTemplate,
          })}
        </TabPanel>

        <TabPanel
          header={`Positions (${positionItems.length})`}
          leftIcon="pi pi-briefcase mr-2"
        >
          {renderDataTable({
            tableItems: positionItems,
            groupField: "positionId.name",
            groupHeaderTemplate: positionGroupNameTemplate,
            targetField: "positionId.name",
            targetHeader: "Position",
            targetTemplate: positionTemplate,
          })}
        </TabPanel>

        <TabPanel
          header={`Profiles (${profileItems.length})`}
          leftIcon="pi pi-user mr-2"
        >
          {renderDataTable({
            tableItems: profileItems,
            groupField: "profile.name",
            groupHeaderTemplate: profileGroupNameTemplate,
            targetField: "profile.name",
            targetHeader: "Profile",
            targetTemplate: profileTemplate,
          })}
        </TabPanel>
      </TabView>

      {actionToolbar}

      <Dialog
        header="Upload Permission Services Data"
        visible={showUpload}
        onHide={() => setShowUpload(false)}
        style={{
          width: "40rem",
        }}
      >
        <UploadService
          user={user}
          serviceName="permissionServices"
          onUploadComplete={() => {
            setShowUpload(false);

            showToast(
              "success",
              "Upload Complete",
              "Permission service records uploaded successfully.",
            );
          }}
        />
      </Dialog>

      <Dialog
        header="Search Permission Services"
        visible={searchDialog}
        onHide={() => setSearchDialog(false)}
        style={{
          width: "35rem",
        }}
      >
        <div className="p-fluid">
          <label htmlFor="permissionServiceSearch">
            Search permission records
          </label>

          <span className="p-input-icon-left mt-2">
            <i className="pi pi-search" />

            <InputText
              id="permissionServiceSearch"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search by permission set, service or target"
            />
          </span>
        </div>
      </Dialog>

      <Dialog
        header="Filter Permission Services"
        visible={showFilter}
        onHide={() => setShowFilter(false)}
        style={{
          width: "35rem",
        }}
      >
        <div className="p-fluid">
          <MultiSelect
            value={selectedFilterFields}
            onChange={(event) => setSelectedFilterFields(event.value)}
            options={fields}
            optionLabel="name"
            optionValue="value"
            filter
            showClear
            placeholder="Select filter fields"
            maxSelectedLabels={6}
            className="w-full"
          />

          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Clear"
              className="p-button-text p-button-secondary"
              onClick={() => setSelectedFilterFields([])}
            />

            <Button
              label="Save"
              icon="pi pi-check"
              onClick={() => {
                if (typeof onClickSaveFilteredfields === "function") {
                  onClickSaveFilteredfields(selectedFilterFields);
                }

                setShowFilter(false);
              }}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Hide Columns"
        visible={showColumns}
        onHide={() => setShowColumns(false)}
        style={{
          width: "35rem",
        }}
      >
        <div className="p-fluid">
          <MultiSelect
            value={selectedHideFields}
            onChange={(event) => setSelectedHideFields(event.value)}
            options={[
              ...fields,
              {
                name: "Read Permissions",
                value: "readPermissions",
              },
              {
                name: "Insert Permissions",
                value: "insertPermissions",
              },
              {
                name: "Edit Permissions",
                value: "editPermissions",
              },
              {
                name: "Delete Permissions",
                value: "deletePermissions",
              },
              {
                name: "Administration",
                value: "administration",
              },
            ]}
            optionLabel="name"
            optionValue="value"
            filter
            showClear
            placeholder="Select columns to hide"
            maxSelectedLabels={6}
            className="w-full"
          />

          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Reset"
              className="p-button-text p-button-secondary"
              onClick={() => setSelectedHideFields([])}
            />

            <Button
              label="Save"
              icon="pi pi-check"
              onClick={() => {
                if (typeof onClickSaveHiddenfields === "function") {
                  onClickSaveHiddenfields(selectedHideFields);
                }

                setShowColumns(false);
              }}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Delete Permission Records"
        visible={showDeleteConfirmation}
        onHide={() => {
          if (!deleteLoading) {
            setShowDeleteConfirmation(false);
          }
        }}
        closable={!deleteLoading}
        modal
        style={{
          width: "32rem",
        }}
        footer={
          <div className="flex justify-content-center gap-3">
            <Button
              label="Cancel"
              outlined
              severity="secondary"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={deleteLoading}
              style={{
                minWidth: "9rem",
              }}
            />

            <Button
              label="Delete"
              icon="pi pi-trash"
              severity="danger"
              onClick={confirmDelete}
              loading={deleteLoading}
              style={{
                minWidth: "9rem",
              }}
            />
          </div>
        }
      >
        <div className="flex flex-column align-items-center text-center">
          <img
            src={DeleteImage}
            alt="Delete"
            style={{
              width: "130px",
              height: "130px",
              objectFit: "contain",
              marginBottom: "1rem",
            }}
          />

          <span className="font-bold text-xl mb-2">
            Delete {selectedItems.length} permission record
            {selectedItems.length === 1 ? "" : "s"}?
          </span>

          <p className="m-0 text-600">
            This action cannot be undone. The selected permission records
            will be deleted permanently.
          </p>
        </div>
      </Dialog>

      <DownloadCSV
        data={selectedExportData.length > 0 ? selectedExportData : localItems}
        selectedData={selectedExportData}
        fileName={filename}
        triggerDownload={triggerDownload}
        setTriggerDownload={(value) => {
          setTriggerDownload(value);

          if (!value) {
            setSelectedExportData([]);
          }
        }}
      />

      <Toast ref={toast} />
    </>
  );
};

const mapState = (state) => {
  const { isLoggedIn, user } = state.auth;

  return {
    isLoggedIn,
    user,
  };
};

const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),

  get: () => dispatch.cache.get(),

  set: (data) => dispatch.cache.set(data),

  hasServicePermission: (service) =>
    dispatch.perms.hasServicePermission(service),

  hasServiceFieldsPermission: (service) =>
    dispatch.perms.hasServiceFieldsPermission(service),
});

export default connect(
  mapState,
  mapDispatch,
)(PermissionServicesDataTable);