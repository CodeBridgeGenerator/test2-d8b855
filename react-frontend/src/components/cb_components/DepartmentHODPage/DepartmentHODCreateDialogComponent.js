import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import client from "../../../services/restClient";
import _ from "lodash";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { CascadeSelect } from "primereact/cascadeselect";

import {
  findHODPosition,
  getEntityId,
  getResultData,
  updateEmployeePositionToHOD,
} from "./departmentHODSync";

const getSchemaValidationErrorsStrings = (errorObj) => {
  const errorMessages = {};

  if (errorObj?.errors) {
    Object.keys(errorObj.errors).forEach((key) => {
      const message = errorObj.errors[key]?.message;

      if (message) {
        errorMessages[key] = message;
      }
    });
  }

  if (Object.keys(errorMessages).length > 0) {
    return errorMessages;
  }

  if (errorObj?.message) {
    return {
      error: errorObj.message,
    };
  }

  return {
    error: "Failed to create Department HOD.",
  };
};

const sortByName = (a, b) =>
  (a?.name || "").localeCompare(b?.name || "", undefined, {
    sensitivity: "base",
  });

const findDepartmentOption = (groups, departmentId) => {
  if (!departmentId) return null;

  for (const group of groups) {
    const department = group.departments?.find(
      (item) => String(item._id) === String(departmentId),
    );

    if (department) {
      return department;
    }
  }

  return null;
};

const DepartmentHODCreateDialogComponent = (props) => {
  const [_entity, set_entity] = useState({});
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingHeads, setLoadingHeads] = useState(false);

  const urlParams = useParams();

  const [departmentGroups, setDepartmentGroups] = useState([]);
  const [Head, setHead] = useState([]);

  /*
   * Reset the form whenever the dialog opens.
   */
  useEffect(() => {
    if (!props.show) return;

    const entity = props.entity || {};

    const departmentId = getEntityId(entity?.Department);
    const headId = getEntityId(entity?.Head);

    set_entity({
      ...entity,
      ...(departmentId
        ? {
            Department: {
              _id: departmentId,
            },
          }
        : {}),
      ...(headId
        ? {
            Head: {
              _id: headId,
            },
          }
        : {}),
    });

    setError({});
  }, [props.show, props.entity]);

  /*
   * Load departments and group them by company.
   *
   * Structure:
   *
   * [
   *   {
   *      name: "Company A",
   *      companyId: "...",
   *      departments: [
   *          { name: "Accounts", _id: "..." },
   *          { name: "Finance", _id: "..." }
   *      ]
   *   }
   * ]
   */
  useEffect(() => {
    const loadDepartmentsByCompany = async () => {
      setLoadingDepartments(true);

      try {
        const departmentQuery = {
          $limit: 10000,
          $sort: {
            name: 1,
          },
        };

        if (urlParams.singleDepartmentsId) {
          departmentQuery._id = urlParams.singleDepartmentsId;
        }

        const departmentResponse = await client
          .service("departments")
          .find({
            query: departmentQuery,
          });

        const departments = getResultData(departmentResponse) || [];

        /*
         * Get all unique company IDs referenced by departments.
         */
        const companyIds = [
          ...new Set(
            departments
              .map((department) =>
                getEntityId(department?.companyId),
              )
              .filter(Boolean)
              .map(String),
          ),
        ];

        let companies = [];

        if (companyIds.length > 0) {
          const companyResponse = await client
            .service("companies")
            .find({
              query: {
                _id: {
                  $in: companyIds,
                },
                $limit: 10000,
                $sort: {
                  name: 1,
                },
              },
            });

          companies = getResultData(companyResponse) || [];
        }

        /*
         * Company lookup:
         *
         * {
         *    companyId: company
         * }
         */
        const companyMap = {};

        companies.forEach((company) => {
          companyMap[String(company._id)] = company;
        });

        /*
         * Group departments by company.
         */
        const groupedCompanies = {};

        departments.forEach((department) => {
          const companyId = getEntityId(
            department?.companyId,
          );

          const company = companyId
            ? companyMap[String(companyId)]
            : null;

          const companyKey = companyId
            ? String(companyId)
            : "no-company";

          const companyName =
            company?.name || "No Company";

          if (!groupedCompanies[companyKey]) {
            groupedCompanies[companyKey] = {
              name: companyName,
              companyId: companyId || null,
              departments: [],
            };
          }

          groupedCompanies[companyKey].departments.push({
            _id: department._id,
            value: department._id,
            name: department.name,
            companyId: companyId || null,
            companyName,
          });
        });

        /*
         * Sort departments within each company,
         * then sort companies alphabetically.
         */
        const groups = Object.values(groupedCompanies)
          .map((group) => ({
            ...group,
            departments: [...group.departments].sort(
              sortByName,
            ),
          }))
          .sort(sortByName);

        setDepartmentGroups(groups);
      } catch (fetchError) {
        console.error(
          "Failed to get departments and companies:",
          fetchError,
        );

        props.alert({
          title: "Departments",
          type: "error",
          message:
            fetchError.message ||
            "Failed to get departments.",
        });
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartmentsByCompany();
  }, [urlParams.singleDepartmentsId]);

  /*
   * Load employees.
   *
   * Sort according to employee fullname rather than empNo.
   */
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingHeads(true);

      try {
        const employeeQuery = {
          $limit: 10000,
          $sort: {
            fullname: 1,
          },
        };

        if (urlParams.singleEmployeesId) {
          employeeQuery._id =
            urlParams.singleEmployeesId;
        }

        const response = await client
          .service("employees")
          .find({
            query: employeeQuery,
          });

        const sortedEmployees = getResultData(response)
          .map((employee) => ({
            name: employee.fullname
              ? `${employee.empNo || ""} - ${employee.fullname}`
              : employee.empNo || "Unnamed Employee",

            value: employee._id,
            _id: employee._id,
            empNo: employee.empNo,
            fullName: employee.fullname,
          }))
          .sort((a, b) =>
            (a.fullName || "").localeCompare(
              b.fullName || "",
              undefined,
              {
                sensitivity: "base",
              },
            ),
          );

        setHead(sortedEmployees);
      } catch (fetchError) {
        console.error(
          "Failed to get employees:",
          fetchError,
        );

        props.alert({
          title: "Employees",
          type: "error",
          message:
            fetchError.message ||
            "Failed to get employees.",
        });
      } finally {
        setLoadingHeads(false);
      }
    };

    loadEmployees();
  }, [urlParams.singleEmployeesId]);

  const validate = () => {
    const validationErrors = {};

    if (!_entity?.Department?._id) {
      validationErrors.Department =
        "Department is required.";
    }

    if (!_entity?.Head?._id) {
      validationErrors.Head =
        "Department Head is required.";
    }

    setError(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const departmentId = _entity.Department._id;
    const employeeId = _entity.Head._id;

    setLoading(true);

    let createdDepartmentHOD = null;

    try {
      /*
       * Check whether this department already
       * has an HOD.
       */
      const existingResponse = await client
        .service("departmentHOD")
        .find({
          query: {
            Department: departmentId,
            $limit: 1,

            $populate: [
              {
                path: "Head",
                service: "employees",
                select: [
                  "empNo",
                  "name",
                  "fullname",
                ],
              },
            ],
          },
        });

      const existingDepartmentHOD =
        getResultData(existingResponse)[0];

      if (existingDepartmentHOD) {
        const existingHead =
          existingDepartmentHOD.Head;

        const existingHeadName =
          existingHead?.fullname ||
          existingHead?.name ||
          "another employee";

        const existingHeadNumber =
          existingHead?.empNo;

        props.alert({
          type: "warn",
          title: "Department Already Has an HOD",

          message: existingHeadNumber
            ? `This department already has an HOD: ${existingHeadNumber} - ${existingHeadName}.`
            : `This department already has an HOD: ${existingHeadName}.`,
        });

        return;
      }

      /*
       * Find HOD position.
       */
      const hodPosition = await findHODPosition(client);

      if (!hodPosition?._id) {
        setError({
          position:
            'A position named "HOD" could not be found in the Positions service.',
        });

        props.alert({
          type: "error",
          title: "HOD Position Not Found",
          message:
            'Please create a position named "HOD" before assigning a department head.',
        });

        return;
      }

      const departmentHODData = {
        Department: departmentId,
        Head: employeeId,
        createdBy: props.user._id,
        updatedBy: props.user._id,
      };

      /*
       * Create Department HOD.
       */
      createdDepartmentHOD = await client
        .service("departmentHOD")
        .create(departmentHODData);

      try {
        /*
         * Update employee position to HOD.
         */
        await updateEmployeePositionToHOD({
          client,
          employeeId,
          hodPositionId: hodPosition._id,
          userId: props.user._id,
        });
      } catch (employeeUpdateError) {
        /*
         * Rollback Department HOD if
         * employee update fails.
         */
        try {
          await client
            .service("departmentHOD")
            .remove(createdDepartmentHOD._id);
        } catch (rollbackError) {
          console.error(
            "Failed to roll back Department HOD:",
            rollbackError,
          );
        }

        throw new Error(
          employeeUpdateError.message ||
            "The employee position could not be updated to HOD.",
        );
      }

      /*
       * Get populated record.
       */
      const eagerResult = await client
        .service("departmentHOD")
        .find({
          query: {
            _id: createdDepartmentHOD._id,
            $limit: 1,

            $populate: [
              {
                path: "Department",
                service: "departments",
                select: ["name", "companyId"],
              },
              {
                path: "Head",
                service: "employees",
                select: [
                  "fullname",
                  "name",
                  "empNo",
                  "position",
                ],
              },
            ],
          },
        });

      const populatedRecord =
        getResultData(eagerResult)[0] ||
        createdDepartmentHOD;

      /*
       * Add Company to returned table record so
       * the table can immediately display it.
       */
      const selectedDepartment =
        findDepartmentOption(
          departmentGroups,
          departmentId,
        );

      const resultForTable = {
        ...populatedRecord,

        Company: selectedDepartment?.companyId
          ? {
              _id: selectedDepartment.companyId,
              name: selectedDepartment.companyName,
            }
          : null,
      };

      props.onCreateResult(resultForTable);

      props.onHide();

      props.alert({
        type: "success",
        title: "Department HOD Created",
        message:
          "Department HOD created successfully and the employee position was changed to HOD.",
      });
    } catch (saveError) {
      console.error(
        "Failed to create Department HOD:",
        saveError,
      );

      const duplicateDepartment =
        saveError?.code === 11000 ||
        saveError?.message
          ?.toLowerCase()
          .includes("duplicate key");

      if (duplicateDepartment) {
        setError({
          Department:
            "This department already has an HOD record.",
        });

        props.alert({
          type: "warn",
          title: "Department Already Has an HOD",
          message:
            "Only one HOD can be assigned to each department.",
        });
      } else {
        setError(
          getSchemaValidationErrorsStrings(saveError),
        );

        props.alert({
          type: "error",
          title: "Create Department HOD",
          message:
            saveError.message ||
            "Failed to create Department HOD.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFooter = () => (
    <div className="flex justify-content-end">
      <Button
        label="save"
        className="p-button-text no-focus-effect"
        onClick={onSave}
        loading={loading}
        disabled={loading}
      />

      <Button
        label="close"
        className="p-button-text no-focus-effect p-button-secondary"
        onClick={props.onHide}
        disabled={loading}
      />
    </div>
  );

  const setValByKey = (key, value) => {
    set_entity((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError((previous) => ({
      ...previous,
      [key]: undefined,
    }));
  };

  const headItemTemplate = (option) => {
    if (!option) return null;

    return option.name || "Unknown";
  };

  const HeadOptions = Head.map((item) => ({
    ...item,
  }));

  /*
   * CascadeSelect needs the actual selected
   * department object from the options collection.
   */
  const selectedDepartment =
    findDepartmentOption(
      departmentGroups,
      getEntityId(_entity?.Department),
    );

  return (
    <Dialog
      header="Assign Department Heads"
      visible={props.show}
      closable={false}
      onHide={props.onHide}
      modal
      style={{ width: "45vw" }}
      className="min-w-max scalein animation-ease-in-out animation-duration-1000"
      footer={renderFooter()}
      resizable={false}
    >
      <div
        className="grid p-fluid overflow-y-auto"
        style={{
          maxWidth: "60vw",
        }}
        role="departmentHOD-create-dialog-component"
      >
        {/* Head */}
        <div className="col-12 md:col-6 field">
          <label htmlFor="Head">
            Head:
          </label>

          <Dropdown
            id="Head"
            value={_entity?.Head?._id}
            optionLabel="name"
            optionValue="value"
            options={HeadOptions}
            onChange={(event) =>
              setValByKey("Head", {
                _id: event.value,
              })
            }
            itemTemplate={headItemTemplate}
            valueTemplate={(option) =>
              option ? (
                headItemTemplate(option)
              ) : (
                <span>
                  Select a department head
                </span>
              )
            }
            placeholder="Select Department Head"
            filter
            filterBy="name"
            filterPlaceholder="Search by employee number or name..."
            emptyFilterMessage="No employees found"
            emptyMessage="No employees available"
            loading={loadingHeads}
          />

          {error?.Head && (
            <small className="p-error">
              {error.Head}
            </small>
          )}
        </div>

        {/* Department */}
        <div className="col-12 md:col-6 field">
          <label htmlFor="Department">
            Department:
          </label>

          <CascadeSelect
            id="Department"
            value={selectedDepartment}
            options={departmentGroups}
            optionLabel="name"
            optionGroupLabel="name"
            optionGroupChildren={["departments"]}
            onChange={(event) => {
              const department = event.value;

              setValByKey(
                "Department",
                department
                  ? {
                      _id: department._id,
                      name: department.name,
                      companyId:
                        department.companyId,
                    }
                  : null,
              );
            }}
            placeholder={
              loadingDepartments
                ? "Loading departments..."
                : "Select Department"
            }
            disabled={loadingDepartments}
            className="w-full"
            breakpoint="767px"
          />

          {error?.Department && (
            <small className="p-error block">
              {error.Department}
            </small>
          )}
        </div>

        {error?.error && (
          <div className="col-12">
            <small className="p-error">
              {error.error}
            </small>
          </div>
        )}
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
)(DepartmentHODCreateDialogComponent);