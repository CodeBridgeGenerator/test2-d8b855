import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { connect } from "react-redux";
import client from "../../../services/restClient";
import _ from "lodash";
import axios from "axios";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";

const STANDARD_PERMISSION_FIELDS = [
  "readOne",
  "readAll",
  "insert",
  "insertBulk",
  "edit",
  "editBulk",
  "deleteOne",
  "deleteBulk",
];

const ADMIN_PERMISSION_FIELDS = [
  "import",
  "export",
  "seeder",
];

const ALL_PERMISSION_FIELDS = [
  ...STANDARD_PERMISSION_FIELDS,
  ...ADMIN_PERMISSION_FIELDS,
];

const PERMISSION_GROUPS = [
  {
    title: "Read",
    items: [
      {
        field: "readOne",
        label: "Read One",
        description: "Get one record",
      },
      {
        field: "readAll",
        label: "Read All",
        description: "Find/list records",
      },
    ],
  },
  {
    title: "Insert",
    items: [
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
    title: "Edit",
    items: [
      {
        field: "edit",
        label: "Edit",
        description: "Update one record",
      },
      {
        field: "editBulk",
        label: "Edit Bulk",
        description: "Update multiple records",
      },
    ],
  },
  {
    title: "Delete",
    items: [
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
    title: "Administration",
    items: [
      {
        field: "import",
        label: "Import",
      },
      {
        field: "export",
        label: "Export",
      },
      {
        field: "seeder",
        label: "Seeder",
      },
    ],
  },
];

const PermissionServicesCreateDialogComponent = (
  props,
) => {
  const [entity, setEntity] = useState({
    serviceMode: "include",
  });

  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [serviceOptions, setServiceOptions] =
    useState([]);

  const [selectedOption, setSelectedOption] =
    useState("roleId");

  const modeOptions = [
    {
      label: "Include selected services",
      value: "include",
    },
    {
      label: "All services except selected",
      value: "exclude",
    },
  ];

  const standardAll = useMemo(
    () =>
      STANDARD_PERMISSION_FIELDS.every(
        (field) => entity[field] === true,
      ),
    [entity],
  );

  const adminAll = useMemo(
    () =>
      ADMIN_PERMISSION_FIELDS.every(
        (field) => entity[field] === true,
      ),
    [entity],
  );

  const selectAll = useMemo(
    () =>
      ALL_PERMISSION_FIELDS.every(
        (field) => entity[field] === true,
      ),
    [entity],
  );

  const setValue = (key, value) => {
    setEntity((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError({});
  };

  const setPermissionGroup = (
    fields,
    checked,
  ) => {
    setEntity((previous) => {
      const updated = {
        ...previous,
      };

      fields.forEach((field) => {
        updated[field] = checked;
      });

      return updated;
    });
  };

  const resetDialog = () => {
    setEntity({
      serviceMode: "include",
    });

    setError({});
    setLoading(false);
    setSelectedOption("roleId");
  };

  const onHideDialog = () => {
    resetDialog();
    props.onHide();
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const apiUrl =
          process.env.REACT_APP_SERVER_URL +
          "/listServices";

        const response = await axios.get(apiUrl);

        const services =
          response.data?.data || [];

        const normalizedServices = services
          .map((service) => {
            if (typeof service === "string") {
              return {
                label: service,
                value: service,
              };
            }

            const value =
              service.value ||
              service.path ||
              service.name;

            if (!value) return null;

            return {
              label:
                service.label ||
                service.name ||
                value,
              value,
            };
          })
          .filter(Boolean)
          .sort((first, second) =>
            first.label.localeCompare(
              second.label,
            ),
          );

        setServiceOptions(
          normalizedServices,
        );
      } catch (err) {
        console.error(
          "Error fetching services:",
          err,
        );

        props.alert({
          title: "Services",
          type: "error",
          message:
            err.message ||
            "Failed to get services",
        });
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const query = {
      query: {
        $limit: 10000,
        $sort: {
          name: 1,
        },
      },
    };

    Promise.all([
      client.service("profiles").find(query),
      client.service("roles").find(query),
      client.service("positions").find(query),
    ])
      .then(
        ([
          profileResponse,
          roleResponse,
          positionResponse,
        ]) => {
          setProfiles(
            (profileResponse.data || []).map(
              (item) => ({
                name: item.name,
                value: item._id,
              }),
            ),
          );

          setRoles(
            (roleResponse.data || []).map(
              (item) => ({
                name: item.name,
                value: item._id,
              }),
            ),
          );

          setPositions(
            (positionResponse.data || []).map(
              (item) => ({
                name: item.name,
                value: item._id,
              }),
            ),
          );
        },
      )
      .catch((err) => {
        props.alert({
          title: "Permission Sets",
          type: "error",
          message:
            err.message ||
            "Failed to load role, position or profile options",
        });
      });
  }, []);

  const getTargetIds = () => {
    switch (selectedOption) {
      case "roleId":
        return entity.roleIds || [];

      case "positionId":
        return entity.positionIds || [];

      case "profile":
        return entity.profileIds || [];

      default:
        return [];
    }
  };

  const validate = () => {
    const errors = {};
    const mode =
      entity.serviceMode || "include";
    const services = entity.services || [];
    const targetIds = getTargetIds();

    if (!entity.name?.trim()) {
      errors.name =
        "Permission set name is required.";
    }

    if (
      mode === "include" &&
      services.length === 0
    ) {
      errors.services =
        "Select at least one service.";
    }

    if (targetIds.length === 0) {
      errors.selection =
        "Select at least one role, position or profile.";
    }

    setError(errors);

    return _.isEmpty(errors);
  };

  const buildPermissionValues = () => ({
    readOne: Boolean(entity.readOne),
    readAll: Boolean(entity.readAll),

    insert: Boolean(entity.insert),
    insertBulk: Boolean(
      entity.insertBulk,
    ),

    edit: Boolean(entity.edit),
    editBulk: Boolean(entity.editBulk),

    deleteOne: Boolean(
      entity.deleteOne,
    ),

    deleteBulk: Boolean(
      entity.deleteBulk,
    ),

    import: Boolean(entity.import),
    export: Boolean(entity.export),
    seeder: Boolean(entity.seeder),

    /*
     * Old fields retained for pages that have not yet been updated.
     */
    create: Boolean(entity.insert),
    read: Boolean(entity.readAll),
    update: Boolean(entity.edit),
    delete: Boolean(entity.deleteOne),
  });

  const onSave = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const mode =
        entity.serviceMode || "include";

      const selectedServices =
        entity.services || [];

      const targetIds = getTargetIds();

      const targetField =
        selectedOption;

      const serviceConfigurations =
        mode === "exclude"
          ? [
              {
                service: "*",
                excludedServices:
                  selectedServices,
              },
            ]
          : selectedServices.map(
              (service) => ({
                service,
                excludedServices: [],
              }),
            );

      const permissionValues =
        buildPermissionValues();

      const recordsToCreate = [];

      targetIds.forEach((targetId) => {
        serviceConfigurations.forEach(
          (serviceConfiguration) => {
            recordsToCreate.push({
              name: entity.name.trim(),

              description:
                entity.description?.trim() ||
                "",

              serviceMode: mode,

              service:
                serviceConfiguration.service,

              excludedServices:
                serviceConfiguration.excludedServices,

              [targetField]: targetId,

              ...permissionValues,

              createdBy: props.user._id,
              updatedBy: props.user._id,
            });
          },
        );
      });

      const result = await client
        .service("permissionServices")
        .create(recordsToCreate);

      props.onCreateResult?.(result);

      props.alert({
        type: "success",
        title: "Permission Set Created",
        message: `${recordsToCreate.length} permission record(s) created successfully.`,
      });

      onHideDialog();
    } catch (saveError) {
      console.error(
        "Error creating permission set:",
        saveError,
      );

      setError({
        general:
          saveError.message ||
          "Failed to create permission set.",
      });

      props.alert({
        type: "error",
        title: "Create Failed",
        message:
          saveError.message ||
          "Failed to create permission set.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTargetSelector = () => {
    if (selectedOption === "profile") {
      return (
        <MultiSelect
          value={entity.profileIds || []}
          options={profiles}
          onChange={(event) =>
            setValue(
              "profileIds",
              event.value,
            )
          }
          optionLabel="name"
          optionValue="value"
          placeholder="Select Profiles"
          display="chip"
          filter
          className="w-full"
        />
      );
    }

    if (selectedOption === "positionId") {
      return (
        <MultiSelect
          value={
            entity.positionIds || []
          }
          options={positions}
          onChange={(event) =>
            setValue(
              "positionIds",
              event.value,
            )
          }
          optionLabel="name"
          optionValue="value"
          placeholder="Select Positions"
          display="chip"
          filter
          className="w-full"
        />
      );
    }

    return (
      <MultiSelect
        value={entity.roleIds || []}
        options={roles}
        onChange={(event) =>
          setValue("roleIds", event.value)
        }
        optionLabel="name"
        optionValue="value"
        placeholder="Select Roles"
        display="chip"
        filter
        className="w-full"
      />
    );
  };

  const renderFooter = (
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
      header="Create Permission Set"
      visible={props.show}
      closable={!loading}
      onHide={onHideDialog}
      modal
      style={{
        width: "62vw",
        maxWidth: "950px",
      }}
      breakpoints={{
        "960px": "85vw",
        "640px": "95vw",
      }}
      footer={renderFooter}
      resizable={false}
    >
      <div
        className="grid p-fluid"
        role="permissionServices-create-dialog-component"
      >
        <div className="col-12 md:col-6 field">
          <label htmlFor="permissionName">
            Permission Set Name
            <span className="p-error">
              {" "}
              *
            </span>
          </label>

          <InputText
            id="permissionName"
            value={entity.name || ""}
            onChange={(event) =>
              setValue(
                "name",
                event.target.value,
              )
            }
            placeholder="Example: Sales Manager Access"
            className="mt-2"
          />

          {error.name && (
            <small className="p-error">
              {error.name}
            </small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label htmlFor="serviceMode">
            Service Selection
          </label>

          <Dropdown
            id="serviceMode"
            value={
              entity.serviceMode ||
              "include"
            }
            options={modeOptions}
            onChange={(event) =>
              setValue(
                "serviceMode",
                event.value,
              )
            }
            className="mt-2"
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
            placeholder="Optional description"
            className="mt-2"
          />
        </div>

        <div className="col-12 field">
          <label htmlFor="services">
            {entity.serviceMode ===
            "exclude"
              ? "Services to Exclude"
              : "Services to Include"}
          </label>

          <MultiSelect
            id="services"
            value={entity.services || []}
            options={serviceOptions}
            onChange={(event) =>
              setValue(
                "services",
                event.value,
              )
            }
            optionLabel="label"
            optionValue="value"
            filter
            showClear
            display="chip"
            placeholder={
              entity.serviceMode ===
              "exclude"
                ? "Leave empty to include all services"
                : "Select services"
            }
            className="w-full mt-2"
          />

          {entity.serviceMode ===
            "exclude" && (
            <small className="text-500">
              This set will apply to every
              service except the selected
              services.
            </small>
          )}

          {error.services && (
            <small className="p-error block">
              {error.services}
            </small>
          )}
        </div>

        <div className="col-12 field">
          <label>Assign To</label>

          <div className="flex flex-wrap gap-4 mt-2 mb-3">
            <div className="flex align-items-center">
              <input
                type="radio"
                id="roleId"
                name="selectionOption"
                value="roleId"
                checked={
                  selectedOption === "roleId"
                }
                onChange={(event) =>
                  setSelectedOption(
                    event.target.value,
                  )
                }
              />

              <label
                htmlFor="roleId"
                className="ml-2"
              >
                Roles
              </label>
            </div>

            <div className="flex align-items-center">
              <input
                type="radio"
                id="positionId"
                name="selectionOption"
                value="positionId"
                checked={
                  selectedOption ===
                  "positionId"
                }
                onChange={(event) =>
                  setSelectedOption(
                    event.target.value,
                  )
                }
              />

              <label
                htmlFor="positionId"
                className="ml-2"
              >
                Positions
              </label>
            </div>

            <div className="flex align-items-center">
              <input
                type="radio"
                id="profile"
                name="selectionOption"
                value="profile"
                checked={
                  selectedOption ===
                  "profile"
                }
                onChange={(event) =>
                  setSelectedOption(
                    event.target.value,
                  )
                }
              />

              <label
                htmlFor="profile"
                className="ml-2"
              >
                Profiles
              </label>
            </div>
          </div>

          {renderTargetSelector()}

          {error.selection && (
            <small className="p-error">
              {error.selection}
            </small>
          )}
        </div>

        <div className="col-12">
          <div
            className="flex flex-wrap gap-5 p-3 border-1 border-200 border-round"
            style={{
              background: "#fafafa",
            }}
          >
            <div className="flex align-items-center">
              <Checkbox
                inputId="selectAll"
                checked={selectAll}
                onChange={(event) =>
                  setPermissionGroup(
                    ALL_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="selectAll"
                className="ml-2 font-semibold"
              >
                Select All
              </label>
            </div>

            <div className="flex align-items-center">
              <Checkbox
                inputId="standardAll"
                checked={standardAll}
                onChange={(event) =>
                  setPermissionGroup(
                    STANDARD_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="standardAll"
                className="ml-2"
              >
                CRUD Permissions
              </label>
            </div>

            <div className="flex align-items-center">
              <Checkbox
                inputId="adminAll"
                checked={adminAll}
                onChange={(event) =>
                  setPermissionGroup(
                    ADMIN_PERMISSION_FIELDS,
                    event.checked,
                  )
                }
              />

              <label
                htmlFor="adminAll"
                className="ml-2"
              >
                Administrative Permissions
              </label>
            </div>
          </div>
        </div>

        {PERMISSION_GROUPS.map(
          (group) => (
            <div
              className="col-12 md:col-6"
              key={group.title}
            >
              <div className="border-1 border-200 border-round p-3 h-full">
                <div className="font-semibold text-lg mb-3">
                  {group.title}
                </div>

                {group.items.map(
                  (permission) => (
                    <div
                      key={permission.field}
                      className="flex align-items-start mb-3"
                    >
                      <Checkbox
                        inputId={
                          permission.field
                        }
                        checked={Boolean(
                          entity[
                            permission.field
                          ],
                        )}
                        onChange={(event) =>
                          setValue(
                            permission.field,
                            event.checked,
                          )
                        }
                      />

                      <label
                        htmlFor={
                          permission.field
                        }
                        className="ml-2 cursor-pointer"
                      >
                        <div className="font-medium">
                          {
                            permission.label
                          }
                        </div>

                        {permission.description && (
                          <small className="text-500">
                            {
                              permission.description
                            }
                          </small>
                        )}
                      </label>
                    </div>
                  ),
                )}
              </div>
            </div>
          ),
        )}

        {error.general && (
          <div className="col-12">
            <small className="p-error">
              {error.general}
            </small>
          </div>
        )}
      </div>
    </Dialog>
  );
};

const mapState = (state) => ({
  user: state.auth.user,
});

const mapDispatch = (dispatch) => ({
  alert: (data) =>
    dispatch.toast.alert(data),
});

export default connect(
  mapState,
  mapDispatch,
)(
  PermissionServicesCreateDialogComponent,
);