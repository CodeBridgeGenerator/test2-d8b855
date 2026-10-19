import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import _ from "lodash";

import client from "../../../services/restClient";
import { getSchemaValidationErrorsStrings } from "../../../utils";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

const FALLBACK_SERVICES = [
  "audits",
  "authentication",
  "branches",
  "cache/clear/all",
  "cache/clear/group",
  "cache/clear/single",
  "cache/flashdb",
  "chatai",
  "contacts",
  "comments",
  "companies",
  "companyAddresses",
  "companyPhones",
  "config",
  "departments",
  "documentStorages",
  "dynaFields",
  "dynaLoader",
  "errorLogs",
  "errorsWH",
  "inbox",
  "jobQues",
  "locationMaster",
  "loginHistories",
  "mailQues",
  "mails",
  "mailWH",
  "notifications",
  "permissionFields",
  "permissionServices",
  "positions",
  "profiles",
  "prompts",
  "roles",
  "sections",
  "steps",
  "superior",
  "templates",
  "uploader",
  "userAddresses",
  "userChangePassword",
  "userGuide",
  "userInvites",
  "userPhones",
  "users",
];

const CRUD_PERMISSION_FIELDS = [
  "readOne",
  "readAll",
  "insert",
  "insertBulk",
  "edit",
  "editBulk",
  "deleteOne",
  "deleteBulk",
];

const ADMIN_PERMISSION_FIELDS = ["import", "export", "seeder"];

const ALL_PERMISSION_FIELDS = [
  ...CRUD_PERMISSION_FIELDS,
  ...ADMIN_PERMISSION_FIELDS,
];

const PERMISSION_GROUPS = [
  {
    title: "Read Permissions",
    permissions: [
      {
        field: "readOne",
        label: "Read One",
        description: "Get and view one record",
      },
      {
        field: "readAll",
        label: "Read All",
        description: "Find and list multiple records",
      },
    ],
  },
  {
    title: "Insert Permissions",
    permissions: [
      {
        field: "insert",
        label: "Insert",
        description: "Create one record",
      },
      {
        field: "insertBulk",
        label: "Insert Bulk",
        description: "Create multiple records",
      },
    ],
  },
  {
    title: "Edit Permissions",
    permissions: [
      {
        field: "edit",
        label: "Edit",
        description: "Update or patch one record",
      },
      {
        field: "editBulk",
        label: "Edit Bulk",
        description: "Update or patch multiple records",
      },
    ],
  },
  {
    title: "Delete Permissions",
    permissions: [
      {
        field: "deleteOne",
        label: "Delete One",
        description: "Remove one record",
      },
      {
        field: "deleteBulk",
        label: "Delete Bulk",
        description: "Remove multiple records",
      },
    ],
  },
  {
    title: "Administrative Permissions",
    permissions: [
      {
        field: "import",
        label: "Import",
        description: "Import service records",
      },
      {
        field: "export",
        label: "Export",
        description: "Export service records",
      },
      {
        field: "seeder",
        label: "Seeder",
        description: "Run data seeders",
      },
    ],
  },
];

const getResponseData = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const getReferenceId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value._id || value.id || null;
  }

  return value;
};

const getBooleanValue = (entity, newField, oldField) => {
  if (typeof entity?.[newField] === "boolean") {
    return entity[newField];
  }

  return Boolean(entity?.[oldField]);
};

const normalizeEntity = (entity) => {
  if (!entity) {
    return {
      serviceMode: "include",
      excludedServices: [],
    };
  }

  const serviceMode =
    entity.serviceMode ||
    (entity.service === "*" ? "exclude" : "include");

  return {
    ...entity,

    name: entity.name || "Default Permission Set",
    description: entity.description || "",

    serviceMode,
    service:
      serviceMode === "exclude"
        ? "*"
        : entity.service || "",

    excludedServices: Array.isArray(entity.excludedServices)
      ? entity.excludedServices
      : [],

    profile: getReferenceId(entity.profile),
    roleId: getReferenceId(entity.roleId),
    positionId: getReferenceId(entity.positionId),
    userId: getReferenceId(entity.userId),

    readOne: getBooleanValue(entity, "readOne", "read"),
    readAll: getBooleanValue(entity, "readAll", "read"),

    insert: getBooleanValue(entity, "insert", "create"),
    insertBulk: getBooleanValue(entity, "insertBulk", "create"),

    edit: getBooleanValue(entity, "edit", "update"),
    editBulk: getBooleanValue(entity, "editBulk", "update"),

    deleteOne: getBooleanValue(entity, "deleteOne", "delete"),
    deleteBulk: getBooleanValue(entity, "deleteBulk", "delete"),

    import: Boolean(entity.import),
    export: Boolean(entity.export),
    seeder: Boolean(entity.seeder),
  };
};

const PermissionServicesEditDialogComponent = (props) => {
  const urlParams = useParams();

  const [entity, setEntity] = useState({
    serviceMode: "include",
    excludedServices: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);

  const [serviceOptions, setServiceOptions] = useState(
    FALLBACK_SERVICES.map((service) => ({
      label: service,
      value: service,
    })),
  );

  const [selectedOption, setSelectedOption] = useState("roleId");

  const serviceModeOptions = [
    {
      label: "Include selected service",
      value: "include",
    },
    {
      label: "All services except selected",
      value: "exclude",
    },
  ];

  const selectAllChecked = useMemo(
    () =>
      ALL_PERMISSION_FIELDS.every(
        (field) => entity?.[field] === true,
      ),
    [entity],
  );

  const crudAllChecked = useMemo(
    () =>
      CRUD_PERMISSION_FIELDS.every(
        (field) => entity?.[field] === true,
      ),
    [entity],
  );

  const adminAllChecked = useMemo(
    () =>
      ADMIN_PERMISSION_FIELDS.every(
        (field) => entity?.[field] === true,
      ),
    [entity],
  );

  useEffect(() => {
    if (!props.show || !props.entity) {
      return;
    }

    const normalizedEntity = normalizeEntity(props.entity);

    setEntity(normalizedEntity);
    setErrors({});

    if (normalizedEntity.profile) {
      setSelectedOption("profile");
    } else if (normalizedEntity.positionId) {
      setSelectedOption("positionId");
    } else {
      setSelectedOption("roleId");
    }
  }, [props.entity, props.show]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const apiUrl =
          process.env.REACT_APP_SERVER_URL + "/listServices";

        const response = await axios.get(apiUrl);
        const services = response?.data?.data;

        if (!Array.isArray(services)) {
          return;
        }

        const normalizedServices = services
          .map((service) => {
            if (typeof service === "string") {
              return {
                label: service,
                value: service,
              };
            }

            const value =
              service?.value ||
              service?.path ||
              service?.name;

            if (!value) {
              return null;
            }

            return {
              label:
                service?.label ||
                service?.name ||
                service?.path ||
                value,
              value,
            };
          })
          .filter(Boolean)
          .sort((first, second) =>
            first.label.localeCompare(second.label),
          );

        if (normalizedServices.length > 0) {
          setServiceOptions(normalizedServices);
        }
      } catch (error) {
        console.warn(
          "Unable to load services from /listServices. Using fallback services.",
          error?.message || error,
        );
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      setOptionsLoading(true);

      const createQuery = (specificId) => {
        const query = {
          $limit: 10000,
          $sort: {
            name: 1,
          },
        };

        if (specificId) {
          query._id = specificId;
        }

        return {
          query,
        };
      };

      try {
        const [
          profileResponse,
          roleResponse,
          positionResponse,
        ] = await Promise.all([
          client
            .service("profiles")
            .find(
              createQuery(urlParams.singleProfilesId),
            ),

          client
            .service("roles")
            .find(createQuery(urlParams.singleRolesId)),

          client
            .service("positions")
            .find(
              createQuery(urlParams.singlePositionsId),
            ),
        ]);

        setProfiles(
          getResponseData(profileResponse).map((item) => ({
            name: item.name,
            value: item._id,
          })),
        );

        setRoles(
          getResponseData(roleResponse).map((item) => ({
            name: item.name,
            value: item._id,
          })),
        );

        setPositions(
          getResponseData(positionResponse).map((item) => ({
            name: item.name,
            value: item._id,
          })),
        );
      } catch (error) {
        console.error(
          "Failed to load permission target options:",
          error,
        );

        props.alert({
          title: "Permission Sets",
          type: "error",
          message:
            error.message ||
            "Failed to load roles, positions and profiles.",
        });
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, [
    urlParams.singleProfilesId,
    urlParams.singleRolesId,
    urlParams.singlePositionsId,
  ]);

  const setValue = (key, value) => {
    setEntity((currentEntity) => ({
      ...currentEntity,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
      general: undefined,
    }));
  };

  const handleServiceModeChange = (serviceMode) => {
    setEntity((currentEntity) => ({
      ...currentEntity,
      serviceMode,

      service:
        serviceMode === "exclude"
          ? "*"
          : currentEntity.service === "*"
            ? ""
            : currentEntity.service,

      excludedServices:
        serviceMode === "exclude"
          ? currentEntity.excludedServices || []
          : [],
    }));

    setErrors({});
  };

  const handleTargetTypeChange = (targetType) => {
    setSelectedOption(targetType);

    setEntity((currentEntity) => ({
      ...currentEntity,

      roleId:
        targetType === "roleId"
          ? currentEntity.roleId
          : null,

      positionId:
        targetType === "positionId"
          ? currentEntity.positionId
          : null,

      profile:
        targetType === "profile"
          ? currentEntity.profile
          : null,

      /*
       * The new priority is profile -> position -> role.
       * Clear old user-specific assignment when editing.
       */
      userId: null,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      selection: undefined,
    }));
  };

  const setPermissionGroup = (fields, checked) => {
    setEntity((currentEntity) => {
      const updatedEntity = {
        ...currentEntity,
      };

      fields.forEach((field) => {
        updatedEntity[field] = checked;
      });

      return updatedEntity;
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      general: undefined,
    }));
  };

  const validate = () => {
    const validationErrors = {};

    if (!entity?.name?.trim()) {
      validationErrors.name =
        "Permission set name is required.";
    }

    if (
      entity.serviceMode !== "exclude" &&
      !entity?.service
    ) {
      validationErrors.service =
        "Please select a service.";
    }

    if (
      selectedOption === "roleId" &&
      !entity?.roleId
    ) {
      validationErrors.selection =
        "Please select a role.";
    }

    if (
      selectedOption === "positionId" &&
      !entity?.positionId
    ) {
      validationErrors.selection =
        "Please select a position.";
    }

    if (
      selectedOption === "profile" &&
      !entity?.profile
    ) {
      validationErrors.selection =
        "Please select a profile.";
    }

    setErrors(validationErrors);

    return _.isEmpty(validationErrors);
  };

  const buildUpdateData = () => {
    const readOne = Boolean(entity.readOne);
    const readAll = Boolean(entity.readAll);

    const insert = Boolean(entity.insert);
    const insertBulk = Boolean(entity.insertBulk);

    const edit = Boolean(entity.edit);
    const editBulk = Boolean(entity.editBulk);

    const deleteOne = Boolean(entity.deleteOne);
    const deleteBulk = Boolean(entity.deleteBulk);

    const isExcludeMode =
      entity.serviceMode === "exclude";

    return {
      name: entity.name.trim(),

      description: entity.description?.trim() || "",

      serviceMode: isExcludeMode
        ? "exclude"
        : "include",

      service: isExcludeMode
        ? "*"
        : entity.service,

      excludedServices: isExcludeMode
        ? entity.excludedServices || []
        : [],

      /*
       * New permissions
       */
      readOne,
      readAll,

      insert,
      insertBulk,

      edit,
      editBulk,

      deleteOne,
      deleteBulk,

      import: Boolean(entity.import),
      export: Boolean(entity.export),
      seeder: Boolean(entity.seeder),

      /*
       * Old fields retained and synchronized.
       *
       * Existing pages using:
       * create/read/update/delete
       * will continue working.
       */
      create: insert,
      read: readAll,
      update: edit,
      delete: deleteOne,

      /*
       * Only one assignment level is saved per record.
       */
      roleId:
        selectedOption === "roleId"
          ? entity.roleId
          : null,

      positionId:
        selectedOption === "positionId"
          ? entity.positionId
          : null,

      profile:
        selectedOption === "profile"
          ? entity.profile
          : null,

      userId: null,

      updatedBy: props.user?._id,
    };
  };

  const fetchUpdatedRecord = async (recordId) => {
    const response = await client
      .service("permissionServices")
      .find({
        query: {
          $limit: 1,
          _id: recordId,
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
        },
      });

    return getResponseData(response)[0];
  };

  const onSave = async () => {
    if (!validate()) {
      return;
    }

    if (!entity?._id) {
      props.alert({
        type: "error",
        title: "Edit Permission Set",
        message: "Permission record ID was not found.",
      });

      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const updateData = buildUpdateData();

      const patchedRecord = await client
        .service("permissionServices")
        .patch(entity._id, updateData);

      let updatedRecord;

      try {
        updatedRecord = await fetchUpdatedRecord(entity._id);
      } catch (fetchError) {
        console.warn(
          "Permission was updated, but the populated record could not be reloaded.",
          fetchError,
        );

        updatedRecord = {
          ...entity,
          ...patchedRecord,
          ...updateData,
        };
      }

      props.onEditResult?.(
        updatedRecord || patchedRecord,
      );

      props.alert({
        type: "success",
        title: "Permission Set Updated",
        message:
          "The permission set was updated successfully.",
      });

      onHideDialog();
    } catch (error) {
      console.error(
        "Failed to update permission set:",
        error,
      );

      const validationMessage =
        getSchemaValidationErrorsStrings(error);

      const message =
        validationMessage ||
        error?.message ||
        "Failed to update the permission set.";

      setErrors({
        general: message,
      });

      props.alert({
        type: "error",
        title: "Edit Permission Set",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const onHideDialog = () => {
    if (loading) {
      return;
    }

    setEntity({
      serviceMode: "include",
      excludedServices: [],
    });

    setErrors({});
    setSelectedOption("roleId");

    props.onHide();
  };

  const renderTargetDropdown = () => {
    if (selectedOption === "profile") {
      return (
        <Dropdown
          id="profile"
          value={entity.profile || null}
          optionLabel="name"
          optionValue="value"
          options={profiles}
          onChange={(event) =>
            setValue("profile", event.value)
          }
          placeholder="Select Profile"
          filter
          showClear
          loading={optionsLoading}
          className="w-full mt-2"
        />
      );
    }

    if (selectedOption === "positionId") {
      return (
        <Dropdown
          id="positionId"
          value={entity.positionId || null}
          optionLabel="name"
          optionValue="value"
          options={positions}
          onChange={(event) =>
            setValue("positionId", event.value)
          }
          placeholder="Select Position"
          filter
          showClear
          loading={optionsLoading}
          className="w-full mt-2"
        />
      );
    }

    return (
      <Dropdown
        id="roleId"
        value={entity.roleId || null}
        optionLabel="name"
        optionValue="value"
        options={roles}
        onChange={(event) =>
          setValue("roleId", event.value)
        }
        placeholder="Select Role"
        filter
        showClear
        loading={optionsLoading}
        className="w-full mt-2"
      />
    );
  };

  const renderFooter = () => (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Close"
        className="p-button-text p-button-secondary"
        onClick={onHideDialog}
        disabled={loading}
      />

      <Button
        label="Save Permission Set"
        icon="pi pi-check"
        onClick={onSave}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header="Edit Permission Set"
      visible={props.show}
      closable={!loading}
      onHide={onHideDialog}
      modal
      style={{
        width: "65vw",
        maxWidth: "980px",
      }}
      breakpoints={{
        "1100px": "80vw",
        "768px": "95vw",
      }}
      footer={renderFooter()}
      resizable={false}
    >
      <div
        className="grid p-fluid overflow-y-auto"
        style={{
          maxHeight: "72vh",
        }}
        role="permissionServices-edit-dialog-component"
      >
        <div className="col-12 md:col-6 field">
          <label htmlFor="permissionSetName">
            Permission Set Name
            <span className="p-error"> *</span>
          </label>

          <InputText
            id="permissionSetName"
            value={entity.name || ""}
            onChange={(event) =>
              setValue("name", event.target.value)
            }
            placeholder="Example: Sales Manager Access"
            className="w-full mt-2"
          />

          {errors.name ? (
            <small className="p-error block mt-1">
              {errors.name}
            </small>
          ) : null}
        </div>

        <div className="col-12 md:col-6 field">
          <label htmlFor="serviceMode">
            Service Selection Mode
          </label>

          <Dropdown
            id="serviceMode"
            value={entity.serviceMode || "include"}
            options={serviceModeOptions}
            onChange={(event) =>
              handleServiceModeChange(event.value)
            }
            className="w-full mt-2"
          />
        </div>

        <div className="col-12 field">
          <label htmlFor="description">
            Description
          </label>

          <InputTextarea
            id="description"
            value={entity.description || ""}
            onChange={(event) =>
              setValue(
                "description",
                event.target.value,
              )
            }
            rows={2}
            autoResize
            placeholder="Optional description for this permission set"
            className="w-full mt-2"
          />
        </div>

        {entity.serviceMode === "exclude" ? (
          <div className="col-12 field">
            <label htmlFor="excludedServices">
              Services to Exclude
            </label>

            <MultiSelect
              id="excludedServices"
              value={entity.excludedServices || []}
              options={serviceOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(event) =>
                setValue(
                  "excludedServices",
                  event.value,
                )
              }
              placeholder="Select services to exclude"
              display="chip"
              filter
              showClear
              className="w-full mt-2"
            />

            <small className="text-500 block mt-1">
              This permission set applies to all services
              except the services selected above. Leave it
              empty to apply to every service.
            </small>
          </div>
        ) : (
          <div className="col-12 field">
            <label htmlFor="service">
              Service
              <span className="p-error"> *</span>
            </label>

            <Dropdown
              id="service"
              value={
                entity.service === "*"
                  ? null
                  : entity.service
              }
              options={serviceOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(event) =>
                setValue("service", event.value)
              }
              placeholder="Select Service"
              filter
              showClear
              className="w-full mt-2"
            />

            {errors.service ? (
              <small className="p-error block mt-1">
                {errors.service}
              </small>
            ) : null}
          </div>
        )}

        <div className="col-12 field">
          <label>
            Assign Permission Set To
            <span className="p-error"> *</span>
          </label>

          <div className="flex flex-wrap align-items-center gap-4 mt-3">
            <div className="flex align-items-center">
              <input
                type="radio"
                id="permissionRole"
                name="permissionTarget"
                value="roleId"
                checked={selectedOption === "roleId"}
                onChange={() =>
                  handleTargetTypeChange("roleId")
                }
              />

              <label
                htmlFor="permissionRole"
                className="ml-2 cursor-pointer"
              >
                Role
              </label>
            </div>

            <div className="flex align-items-center">
              <input
                type="radio"
                id="permissionPosition"
                name="permissionTarget"
                value="positionId"
                checked={
                  selectedOption === "positionId"
                }
                onChange={() =>
                  handleTargetTypeChange("positionId")
                }
              />

              <label
                htmlFor="permissionPosition"
                className="ml-2 cursor-pointer"
              >
                Position
              </label>
            </div>

            <div className="flex align-items-center">
              <input
                type="radio"
                id="permissionProfile"
                name="permissionTarget"
                value="profile"
                checked={selectedOption === "profile"}
                onChange={() =>
                  handleTargetTypeChange("profile")
                }
              />

              <label
                htmlFor="permissionProfile"
                className="ml-2 cursor-pointer"
              >
                Profile
              </label>
            </div>
          </div>

          {renderTargetDropdown()}

          {errors.selection ? (
            <small className="p-error block mt-1">
              {errors.selection}
            </small>
          ) : null}

          <small className="text-500 block mt-2">
            Permission priority is Profile, then Position,
            then Role.
          </small>
        </div>

        <div className="col-12">
          <div
            className="flex flex-wrap gap-5 p-3 border-1 border-200 border-round"
            style={{
              backgroundColor: "#fafafa",
            }}
          >
            <div className="flex align-items-center">
              <Checkbox
                inputId="selectAllPermissions"
                checked={selectAllChecked}
                onChange={(event) =>
                  setPermissionGroup(
                    ALL_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="selectAllPermissions"
                className="ml-2 font-semibold cursor-pointer"
              >
                Select All
              </label>
            </div>

            <div className="flex align-items-center">
              <Checkbox
                inputId="selectCrudPermissions"
                checked={crudAllChecked}
                onChange={(event) =>
                  setPermissionGroup(
                    CRUD_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="selectCrudPermissions"
                className="ml-2 cursor-pointer"
              >
                CRUD Permissions
              </label>
            </div>

            <div className="flex align-items-center">
              <Checkbox
                inputId="selectAdminPermissions"
                checked={adminAllChecked}
                onChange={(event) =>
                  setPermissionGroup(
                    ADMIN_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="selectAdminPermissions"
                className="ml-2 cursor-pointer"
              >
                Administrative Permissions
              </label>
            </div>
          </div>
        </div>

        {PERMISSION_GROUPS.map((group) => (
          <div
            className="col-12 md:col-6"
            key={group.title}
          >
            <div className="border-1 border-200 border-round p-3 h-full">
              <div className="font-semibold text-lg mb-3">
                {group.title}
              </div>

              {group.permissions.map((permission) => (
                <div
                  className="flex align-items-start mb-3"
                  key={permission.field}
                >
                  <Checkbox
                    inputId={permission.field}
                    checked={Boolean(
                      entity?.[permission.field],
                    )}
                    onChange={(event) =>
                      setValue(
                        permission.field,
                        event.checked,
                      )
                    }
                  />

                  <label
                    htmlFor={permission.field}
                    className="ml-2 cursor-pointer"
                  >
                    <div className="font-medium">
                      {permission.label}
                    </div>

                    <small className="text-500">
                      {permission.description}
                    </small>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {errors.general ? (
          <div className="col-12">
            <div
              className="p-3 border-round"
              style={{
                color: "#b42318",
                backgroundColor: "#fef3f2",
                border: "1px solid #fecdca",
              }}
            >
              {errors.general}
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
};

const mapState = (state) => {
  const { user } = state.auth;

  return {
    user,
  };
};

const mapDispatch = (dispatch) => ({
  alert: (data) =>
    dispatch.toast.alert(data),

  hasServicePermission: (service) =>
    dispatch.perms.hasServicePermission(service),

  hasServiceFieldsPermission: (service) =>
    dispatch.perms.hasServiceFieldsPermission(
      service,
    ),
});

export default connect(
  mapState,
  mapDispatch,
)(PermissionServicesEditDialogComponent);