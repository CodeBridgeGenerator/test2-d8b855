import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { connect } from "react-redux";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import _ from "lodash";

import client from "../../../services/restClient";
import entityCreate from "../../../utils/entity";

import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";

import DownloadCSV from "../../../utils/DownloadCSV";
import AreYouSureDialog from "../../common/AreYouSureDialog";

import PermissionServicesDatatable from "./PermissionServicesDataTable";
import PermissionServicesEditDialogComponent from "./PermissionServicesEditDialogComponent";
import PermissionServicesCreateDialogComponent from "./PermissionServicesCreateDialogComponent";
import PermissionServicesFakerDialogComponent from "./PermissionServicesFakerDialogComponent";
import PermissionServicesSeederDialogComponent from "./PermissionServicesSeederDialogComponent";

import SortIcon from "../../../assets/media/Sort.png";
import FilterIcon from "../../../assets/media/Filter.png";
import HelpbarService from "../../../services/HelpbarService";

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

  // Old permission names
  read: false,
  create: false,
  update: false,
  delete: false,
};

const PermissionServicesPage = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = useParams();

  const filename = "permissionServices";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [fields, setFields] = useState([]);

  const [permissions, setPermissions] =
    useState(EMPTY_PERMISSIONS);

  const [selectedUser, setSelectedUser] = useState(null);
  const [paginatorRecordsNo, setPaginatorRecordsNo] =
    useState(10);

  const [showAreYouSureDialog, setShowAreYouSureDialog] =
    useState(false);

  const [showEditDialog, setShowEditDialog] =
    useState(false);

  const [showCreateDialog, setShowCreateDialog] =
    useState(false);

  const [showFakerDialog, setShowFakerDialog] =
    useState(false);

  const [showDeleteAllDialog, setShowDeleteAllDialog] =
    useState(false);

  const [showSeederDialog, setShowSeederDialog] =
    useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);

  const [isHelpSidebarVisible, setHelpSidebarVisible] =
    useState(false);

  const [newRecord, setRecord] = useState({});
  const [selectedEntityId, setSelectedEntityId] =
    useState(null);

  const [selectedFilterFields, setSelectedFilterFields] =
    useState([]);

  const [selectedHideFields, setSelectedHideFields] =
    useState([]);

  const [selectedDelete, setSelectedDelete] = useState([]);

  const [triggerDownload, setTriggerDownload] =
    useState(false);

  const [refresh, setRefresh] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] =
    useState(false);

  const getOrCreateBrowserTabId = () => {
    let tabId = sessionStorage.getItem("browserTabId");

    if (!tabId) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        tabId = crypto.randomUUID();
      } else {
        tabId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
      }

      sessionStorage.setItem("browserTabId", tabId);
    }

    return tabId;
  };

  const normalizePermissions = (permissionData) => {
    const normalized = {
      ...EMPTY_PERMISSIONS,
      ...(permissionData || {}),
    };

    /*
     * Support old permission records.
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

    if (
      typeof permissionData?.insertBulk !== "boolean"
    ) {
      normalized.insertBulk = Boolean(
        permissionData?.create,
      );
    }

    if (typeof permissionData?.edit !== "boolean") {
      normalized.edit = Boolean(permissionData?.update);
    }

    if (typeof permissionData?.editBulk !== "boolean") {
      normalized.editBulk = Boolean(
        permissionData?.update,
      );
    }

    if (
      typeof permissionData?.deleteOne !== "boolean"
    ) {
      normalized.deleteOne = Boolean(
        permissionData?.delete,
      );
    }

    if (
      typeof permissionData?.deleteBulk !== "boolean"
    ) {
      normalized.deleteBulk = Boolean(
        permissionData?.delete,
      );
    }

    /*
     * Preserve old property names so existing JSX still works.
     */
    normalized.read = normalized.readAll;
    normalized.create = normalized.insert;
    normalized.update = normalized.edit;
    normalized.delete = normalized.deleteOne;

    return normalized;
  };

  const loadPagePermissions = useCallback(async () => {
    try {
      const result =
        await props.hasServicePermission(filename);

      setPermissions(normalizePermissions(result));
    } catch (error) {
      console.error(
        "Failed to get permission-services permissions:",
        error,
      );

      setPermissions(EMPTY_PERMISSIONS);
    }
  }, [props.hasServicePermission]);

  const loadSchema = useCallback(async () => {
    try {
      const response =
        await props.getSchema("permissionServices");

      const schemaFields = Array.isArray(response)
        ? response
        : response?.data || [];

      const mappedFields = schemaFields
        .filter((field) => field?.field)
        .map((field) => ({
          name: field.field,
          value: field.field,
          type: field?.properties?.type || field?.type,
        }));

      setFields(mappedFields);

      /*
       * Hide only technical columns by default.
       * Do not use an array index because new model fields change
       * the schema field positions.
       */
      const technicalFields = [
        "_id",
        "__v",
        "createdBy",
        "updatedBy",
        "createdAt",
        "updatedAt",
        "userId",
      ];

      setSelectedHideFields((currentFields) => {
        if (currentFields.length > 0) {
          return currentFields;
        }

        return mappedFields
          .map((field) => field.value)
          .filter((field) =>
            technicalFields.includes(field),
          );
      });
    } catch (error) {
      console.error(
        "Failed to get permission-services schema:",
        error,
      );

      props.alert({
        title: "Permission Sets",
        type: "error",
        message:
          error.message ||
          "Failed to load permission schema.",
      });
    }
  }, [props.getSchema]);

  const loadSelectedProfileAndPreferences =
    useCallback(async () => {
      try {
        const tabId = getOrCreateBrowserTabId();

        const response = await props.get();
        const currentCache = response?.results;

        const storedProfileId = localStorage.getItem(
          `selectedUser_${tabId}`,
        );

        const profileId =
          storedProfileId ||
          currentCache?.selectedUser ||
          null;

        setSelectedUser(profileId);

        if (!currentCache || !profileId) {
          return;
        }

        const profiles = Array.isArray(
          currentCache.profiles,
        )
          ? currentCache.profiles
          : [];

        const selectedProfile = profiles.find(
          (profile) =>
            String(profile.profileId) ===
            String(profileId),
        );

        const recordsPerPage = _.get(
          selectedProfile,
          "preferences.settings.permissionServices.paginatorRecordsNo",
          10,
        );

        setPaginatorRecordsNo(recordsPerPage || 10);
      } catch (error) {
        console.error(
          "Failed to load the selected profile:",
          error,
        );
      }
    }, [props.get]);

  const buildFindQuery = () => {
    const query = {
      $limit: 10000,
      $sort: {
        name: 1,
        service: 1,
      },
      $populate: [
        {
          path: "profile",
          service: "profiles",
          select: ["name"],
        },
        {
          path: "roleId",
          service: "roles",
          select: ["name"],
        },
        {
          path: "positionId",
          service: "positions",
          select: ["name"],
        },
        {
          path: "userId",
          service: "users",
          select: ["name", "email"],
        },
      ],
    };

    if (urlParams.singleProfilesId) {
      query.profile = urlParams.singleProfilesId;
    }

    if (urlParams.singleRolesId) {
      query.roleId = urlParams.singleRolesId;
    }

    if (urlParams.singlePositionsId) {
      query.positionId =
        urlParams.singlePositionsId;
    }

    if (urlParams.singleUsersId) {
      query.userId = urlParams.singleUsersId;
    }

    return query;
  };

  const loadPermissionRecords = useCallback(async () => {
    setLoading(true);
    props.show();

    try {
      const response = await client
        .service("permissionServices")
        .find({
          query: buildFindQuery(),
        });

      const results = Array.isArray(response)
        ? response
        : response?.data || [];

      setData(results);
      setInitialData(_.cloneDeep(results));
    } catch (error) {
      console.error(
        "Failed to get permission sets:",
        error,
      );

      props.alert({
        title: "Permission Sets",
        type: "error",
        message:
          error.message ||
          "Failed to get permission sets.",
      });
    } finally {
      setLoading(false);
      props.hide();
    }
  }, [
    urlParams.singleProfilesId,
    urlParams.singleRolesId,
    urlParams.singlePositionsId,
    urlParams.singleUsersId,
    refresh,
  ]);

  useEffect(() => {
    loadSchema();
    loadSelectedProfileAndPreferences();

    if (location?.state?.action === "create") {
      entityCreate(location, setRecord);
      setShowCreateDialog(true);
    }

    if (location?.state?.action === "edit") {
      setShowCreateDialog(true);
    }
  }, []);

  useEffect(() => {
    loadPermissionRecords();
  }, [loadPermissionRecords]);

  useEffect(() => {
    loadPagePermissions();
  }, [selectedUser, loadPagePermissions]);

  useEffect(() => {
    const updatePaginatorPreference = async () => {
      if (!selectedUser) {
        return;
      }

      try {
        const response = await props.get();
        const currentCache = response?.results;

        if (!currentCache) {
          return;
        }

        const updatedCache = _.cloneDeep(currentCache);

        const profiles = Array.isArray(
          updatedCache.profiles,
        )
          ? updatedCache.profiles
          : [];

        const profileIndex = profiles.findIndex(
          (profile) =>
            String(profile.profileId) ===
            String(selectedUser),
        );

        if (profileIndex === -1) {
          return;
        }

        _.set(
          updatedCache.profiles[profileIndex],
          "preferences.settings.permissionServices.paginatorRecordsNo",
          paginatorRecordsNo,
        );

        await props.set(updatedCache);
      } catch (error) {
        console.error(
          "Failed to save paginator preference:",
          error,
        );
      }
    };

    updatePaginatorPreference();
  }, [paginatorRecordsNo, selectedUser]);

  const onClickSaveFilteredfields = (selectedFields) => {
    console.log(
      "Permission service filter fields:",
      selectedFields,
    );
  };

  const onClickSaveHiddenfields = (selectedFields) => {
    console.log(
      "Permission service hidden fields:",
      selectedFields,
    );
  };

  const onEditRow = (rowData) => {
    if (!permissions.edit) {
      props.alert({
        title: "Permission Denied",
        type: "error",
        message:
          "You do not have permission to edit permission sets.",
      });

      return;
    }

    setSelectedEntityId(rowData?._id);
    setShowEditDialog(true);
  };

  const onCreateResult = (createdResult) => {
    const createdRecords = Array.isArray(createdResult)
      ? createdResult
      : createdResult
        ? [createdResult]
        : [];

    if (createdRecords.length > 0) {
      setData((currentData) => [
        ...currentData,
        ...createdRecords,
      ]);
    }

    /*
     * Refetch to populate role, position and profile names.
     */
    setRefresh((current) => !current);
    loadPagePermissions();
  };

  const onFakerCreateResults = (createdResult) => {
    const createdRecords = Array.isArray(createdResult)
      ? createdResult
      : createdResult
        ? [createdResult]
        : [];

    setSelectedEntityId(null);

    setData((currentData) => [
      ...currentData,
      ...createdRecords,
    ]);

    setRefresh((current) => !current);
  };

  const onSeederResults = (createdResult) => {
    const createdRecords = Array.isArray(createdResult)
      ? createdResult
      : createdResult
        ? [createdResult]
        : [];

    setSelectedEntityId(null);

    setData((currentData) => [
      ...currentData,
      ...createdRecords,
    ]);

    setRefresh((current) => !current);
  };

  const onEditResult = (updatedRecord) => {
    if (!updatedRecord?._id) {
      setRefresh((current) => !current);
      return;
    }

    setData((currentData) =>
      currentData.map((record) =>
        String(record._id) ===
        String(updatedRecord._id)
          ? {
              ...record,
              ...updatedRecord,
            }
          : record,
      ),
    );

    setRefresh((current) => !current);
    loadPagePermissions();
  };

  const onRowDelete = (recordId) => {
    if (!permissions.deleteOne) {
      props.alert({
        title: "Permission Denied",
        type: "error",
        message:
          "You do not have permission to delete this permission record.",
      });

      return;
    }

    setSelectedEntityId(recordId);
    setShowAreYouSureDialog(true);
  };

  const deleteRow = async () => {
    if (!selectedEntityId) {
      return;
    }

    try {
      await client
        .service("permissionServices")
        .remove(selectedEntityId);

      setData((currentData) =>
        currentData.filter(
          (record) =>
            String(record._id) !==
            String(selectedEntityId),
        ),
      );

      setSelectedEntityId(null);
      setShowAreYouSureDialog(false);

      await loadPagePermissions();

      props.alert({
        title: "Permission Record Deleted",
        type: "success",
        message:
          "The permission record was deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Failed to delete permission record:",
        error,
      );

      props.alert({
        title: "Permission Sets",
        type: "error",
        message:
          error.message ||
          "Failed to delete permission record.",
      });
    }
  };

  const deleteAll = async () => {
    if (
      process.env.REACT_APP_ENV !== "development"
    ) {
      props.alert({
        title: "Delete Disabled",
        type: "error",
        message:
          "Deleting all permission records is disabled outside the development environment.",
      });

      return;
    }

    if (!permissions.deleteBulk) {
      props.alert({
        title: "Permission Denied",
        type: "error",
        message:
          "You do not have Delete Bulk permission.",
      });

      return;
    }

    const recordIds = data
      .map((record) => record?._id)
      .filter(Boolean);

    if (recordIds.length === 0) {
      setShowDeleteAllDialog(false);
      return;
    }

    setDeleteAllLoading(true);

    try {
      /*
       * This performs a real bulk remove and therefore checks
       * deleteBulk in the backend.
       */
      await client
        .service("permissionServices")
        .remove(null, {
          query: {
            _id: {
              $in: recordIds,
            },
          },
        });

      setData([]);
      setInitialData([]);
      setSelectedDelete(recordIds);
      setShowDeleteAllDialog(false);

      await loadPagePermissions();

      props.alert({
        title: "Permission Records Deleted",
        type: "success",
        message: `${recordIds.length} permission record(s) were deleted successfully.`,
      });
    } catch (error) {
      console.error(
        "Failed to delete all permission records:",
        error,
      );

      props.alert({
        title: "Permission Sets",
        type: "error",
        message:
          error.message ||
          "Failed to delete permission records.",
      });
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const onRowClick = ({ data: rowData }) => {
    if (!permissions.readOne) {
      props.alert({
        title: "Permission Denied",
        type: "error",
        message:
          "You do not have permission to read this permission record.",
      });

      return;
    }

    navigate(
      `/cbAdmin/permissionServices/${rowData._id}`,
    );
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      );

      props.alert({
        title: "Copied",
        type: "success",
        message: "Page link copied to clipboard.",
      });
    } catch (error) {
      console.error(
        "Failed to copy page link:",
        error,
      );

      props.alert({
        title: "Copy Failed",
        type: "error",
        message: "Failed to copy the page link.",
      });
    }
  };

  const menuItems = useMemo(
    () =>
      [
        {
          label: "Copy Link",
          icon: "pi pi-copy",
          command: copyPageLink,
        },

        permissions.import
          ? {
              label: "Import",
              icon: "pi pi-upload",
              command: () =>
                setShowUpload(true),
            }
          : null,

        permissions.export
          ? {
              label: "Export",
              icon: "pi pi-download",
              command: () => {
                if (data.length === 0) {
                  props.alert({
                    title: "Export",
                    type: "warn",
                    message:
                      "There is no data to export.",
                  });

                  return;
                }

                setTriggerDownload(true);
              },
            }
          : null,

        {
          label: "Help",
          icon: "pi pi-question-circle",
          command: () =>
            setHelpSidebarVisible(true),
        },

        {
          separator: true,
        },

        process.env.REACT_APP_ENV ===
          "development" &&
        (permissions.insertBulk ||
          permissions.deleteBulk)
          ? {
              label: "Testing",
              icon: "pi pi-check-circle",
              items: [
                permissions.insertBulk
                  ? {
                      label: "Faker",
                      icon: "pi pi-bullseye",
                      command: () =>
                        setShowFakerDialog(true),
                    }
                  : null,

                permissions.deleteBulk
                  ? {
                      label: `Drop ${data.length}`,
                      icon: "pi pi-trash",
                      command: () =>
                        setShowDeleteAllDialog(
                          true,
                        ),
                    }
                  : null,
              ].filter(Boolean),
            }
          : null,

        permissions.seeder
          ? {
              label: "Data Seeder",
              icon: "pi pi-database",
              command: () =>
                setShowSeederDialog(true),
            }
          : null,
      ].filter(Boolean),
    [permissions, data],
  );

  const onMenuSort = (sortOption) => {
    let sortedData;

    switch (sortOption) {
      case "nameAsc":
        sortedData = _.orderBy(
          data,
          ["name"],
          ["asc"],
        );
        break;

      case "nameDesc":
        sortedData = _.orderBy(
          data,
          ["name"],
          ["desc"],
        );
        break;

      case "serviceAsc":
        sortedData = _.orderBy(
          data,
          ["service"],
          ["asc"],
        );
        break;

      case "serviceDesc":
        sortedData = _.orderBy(
          data,
          ["service"],
          ["desc"],
        );
        break;

      case "createdAtAsc":
        sortedData = _.orderBy(
          data,
          ["createdAt"],
          ["asc"],
        );
        break;

      case "createdAtDesc":
        sortedData = _.orderBy(
          data,
          ["createdAt"],
          ["desc"],
        );
        break;

      default:
        sortedData = _.cloneDeep(initialData);
        break;
    }

    setData(sortedData);
  };

  const filterMenuItems = [
    {
      label: "Filter",
      icon: "pi pi-filter",
      command: () => setShowFilter(true),
    },
    {
      label: "Clear",
      icon: "pi pi-filter-slash",
      command: () => setSelectedFilterFields([]),
    },
    {
      label: "Hide Columns",
      icon: "pi pi-eye-slash",
      command: () => setShowColumns(true),
    },
  ];

  const sortMenuItems = [
    {
      label: "Sort By",
      disabled: true,
    },
    {
      separator: true,
    },
    {
      label: "Name Ascending",
      command: () => onMenuSort("nameAsc"),
    },
    {
      label: "Name Descending",
      command: () => onMenuSort("nameDesc"),
    },
    {
      label: "Service Ascending",
      command: () => onMenuSort("serviceAsc"),
    },
    {
      label: "Service Descending",
      command: () => onMenuSort("serviceDesc"),
    },
    {
      label: "Created At Ascending",
      command: () =>
        onMenuSort("createdAtAsc"),
    },
    {
      label: "Created At Descending",
      command: () =>
        onMenuSort("createdAtDesc"),
    },
    {
      separator: true,
    },
    {
      label: "Reset",
      icon: "pi pi-refresh",
      command: () => onMenuSort("reset"),
    },
  ];

  const selectedEditEntity = useMemo(
    () =>
      data.find(
        (record) =>
          String(record._id) ===
          String(selectedEntityId),
      ),
    [data, selectedEntityId],
  );

  return (
    <div className="mt-5">
      <div className="grid">
        <div className="col-6 flex align-items-center justify-content-start">
          <h4 className="mb-0 ml-2">
            <span>
              <small>Users &amp; Access</small>
              {" / "}
            </span>

            <strong>Permission Sets</strong>
          </h4>

          {permissions.readAll ? (
            <SplitButton
              model={menuItems}
              dropdownIcon="pi pi-ellipsis-h"
              buttonClassName="hidden"
              menuButtonClassName="ml-1 p-button-text"
            />
          ) : null}
        </div>

        <div className="col-6 flex justify-content-end align-items-center">
          <SplitButton
            model={filterMenuItems}
            dropdownIcon={
              <img
                src={FilterIcon}
                alt="Filter"
                style={{
                  marginRight: "4px",
                  width: "1em",
                  height: "1em",
                }}
              />
            }
            buttonClassName="hidden"
            menuButtonClassName="ml-1 p-button-text"
          />

          <SplitButton
            model={sortMenuItems}
            dropdownIcon={
              <img
                src={SortIcon}
                alt="Sort"
                style={{
                  marginRight: "4px",
                  width: "1em",
                  height: "1em",
                }}
              />
            }
            buttonClassName="hidden"
            menuButtonClassName="ml-1 p-button-text"
            menuStyle={{
              width: "220px",
            }}
          />

          {permissions.insert ? (
            <Button
              label="Add"
              style={{
                height: "30px",
                marginRight: "10px",
              }}
              rounded
              loading={loading}
              icon="pi pi-plus"
              onClick={() =>
                setShowCreateDialog(true)
              }
              role="permissionServices-add-button"
            />
          ) : null}
        </div>
      </div>

      <div className="grid align-items-center">
        <div
          className="col-12"
          role="permissionServices-datatable"
        >
          <PermissionServicesDatatable
            items={data}
            fields={fields}
            onRowDelete={onRowDelete}
            onEditRow={onEditRow}
            onRowClick={onRowClick}
            searchDialog={searchDialog}
            setSearchDialog={setSearchDialog}
            showUpload={showUpload}
            setShowUpload={setShowUpload}
            showFilter={showFilter}
            setShowFilter={setShowFilter}
            showColumns={showColumns}
            setShowColumns={setShowColumns}
            onClickSaveFilteredfields={
              onClickSaveFilteredfields
            }
            selectedFilterFields={
              selectedFilterFields
            }
            setSelectedFilterFields={
              setSelectedFilterFields
            }
            selectedHideFields={
              selectedHideFields
            }
            setSelectedHideFields={
              setSelectedHideFields
            }
            onClickSaveHiddenfields={
              onClickSaveHiddenfields
            }
            loading={loading}
            user={props.user}
            selectedDelete={selectedDelete}
            setSelectedDelete={setSelectedDelete}
            selectedUser={selectedUser}
            setPaginatorRecordsNo={
              setPaginatorRecordsNo
            }
            paginatorRecordsNo={
              paginatorRecordsNo
            }
            filename={filename}
          />
        </div>
      </div>

      <DownloadCSV
        data={data}
        fileName={filename}
        triggerDownload={triggerDownload}
        setTriggerDownload={setTriggerDownload}
      />

      <AreYouSureDialog
        header="Delete Permission Record"
        body="Are you sure you want to delete this permission record?"
        show={showAreYouSureDialog}
        onHide={() => {
          setShowAreYouSureDialog(false);
          setSelectedEntityId(null);
        }}
        onYes={deleteRow}
      />

      <PermissionServicesEditDialogComponent
        entity={selectedEditEntity}
        show={showEditDialog}
        onHide={() => {
          setShowEditDialog(false);
          setSelectedEntityId(null);
        }}
        onEditResult={onEditResult}
      />

      <PermissionServicesCreateDialogComponent
        entity={newRecord}
        show={showCreateDialog}
        onHide={() => {
          setShowCreateDialog(false);
          setRecord({});
        }}
        onCreateResult={onCreateResult}
      />

      <PermissionServicesFakerDialogComponent
        show={showFakerDialog}
        onHide={() =>
          setShowFakerDialog(false)
        }
        onFakerCreateResults={
          onFakerCreateResults
        }
      />

      <PermissionServicesSeederDialogComponent
        show={showSeederDialog}
        onHide={() =>
          setShowSeederDialog(false)
        }
        onSeederResults={onSeederResults}
      />

      <AreYouSureDialog
        header={`Drop ${data.length} Permission Records`}
        body={`Are you sure you want to permanently delete ${data.length} permission records?`}
        show={showDeleteAllDialog}
        onHide={() =>
          setShowDeleteAllDialog(false)
        }
        onYes={deleteAll}
        loading={deleteAllLoading}
      />

      <HelpbarService
        isVisible={isHelpSidebarVisible}
        onToggle={() =>
          setHelpSidebarVisible(
            (current) => !current,
          )
        }
        serviceName="permissionServices"
      />
    </div>
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
  alert: (data) =>
    dispatch.toast.alert(data),

  getSchema: (serviceName) =>
    dispatch.db.getSchema(serviceName),

  hasServicePermission: (service) =>
    dispatch.perms.hasServicePermission(service),

  /*
   * These old functions remain available through the updated
   * perms model.
   */
  getPermissionServices: (service) =>
    dispatch.perms.getPermissionServices(service),

  getPermissionFields: (service) =>
    dispatch.perms.getPermissionFields(service),

  hasServiceFieldsPermission: (service) =>
    dispatch.perms.hasServiceFieldsPermission(
      service,
    ),

  show: () => dispatch.loading.show(),
  hide: () => dispatch.loading.hide(),

  get: () => dispatch.cache.get(),
  set: (data) => dispatch.cache.set(data),
});

export default connect(
  mapState,
  mapDispatch,
)(PermissionServicesPage);