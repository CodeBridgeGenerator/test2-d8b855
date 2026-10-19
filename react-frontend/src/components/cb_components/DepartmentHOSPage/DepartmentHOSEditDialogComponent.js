/* eslint-disable react/prop-types */

import React, {
  useEffect,
  useState,
} from "react";

import { connect } from "react-redux";
import { useParams } from "react-router-dom";

import client from "../../../services/restClient";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { CascadeSelect } from "primereact/cascadeselect";

const getResultData = (result) => {
  if (Array.isArray(result)) {
    return result;
  }

  return result?.data || [];
};

const getEntityId = (entity) => {
  if (!entity) return null;

  if (typeof entity === "object") {
    return entity._id || entity.id || null;
  }

  return entity;
};

const sortByName = (first, second) =>
  (first?.name || "").localeCompare(
    second?.name || "",
    undefined,
    {
      sensitivity: "base",
    },
  );

const DepartmentHOSEditDialogComponent = (
  props,
) => {
  const urlParams = useParams();

  const [_entity, set_entity] =
    useState({});

  const [error, setError] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [
    loadingCascade,
    setLoadingCascade,
  ] = useState(false);

  const [
    loadingEmployees,
    setLoadingEmployees,
  ] = useState(false);

  const [companyGroups, setCompanyGroups] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  /*
   * Exact section cannot be restored
   * from departmentHOS because sectionId
   * is not stored.
   */
  const [
    selectedSection,
    setSelectedSection,
  ] = useState(null);

  useEffect(() => {
    if (!props.show) return;

    const entity =
      props.entity || {};

    const departmentId =
      getEntityId(
        entity.departmentId,
      );

    const employeeId =
      getEntityId(
        entity.employees,
      );

    set_entity({
      ...entity,

      departmentId:
        departmentId
          ? {
              ...(typeof entity.departmentId ===
              "object"
                ? entity.departmentId
                : {}),

              _id:
                departmentId,
            }
          : null,

      employees:
        employeeId
          ? {
              ...(typeof entity.employees ===
              "object"
                ? entity.employees
                : {}),

              _id:
                employeeId,
            }
          : null,
    });

    setSelectedSection(null);
    setError({});
  }, [
    props.entity,
    props.show,
  ]);

useEffect(() => {
  const loadHierarchy = async () => {
    setLoadingCascade(true);

    try {
      /*
       * STEP 1:
       * Load departments.
       */
      const departmentQuery = {
        $limit: 10000,
        $sort: {
          name: 1,
        },
      };

      /*
       * Only apply this filter when the page
       * is opened for one particular department.
       */
      if (urlParams.singleDepartmentsId) {
        departmentQuery._id =
          urlParams.singleDepartmentsId;
      }

      const departmentResponse = await client
        .service("departments")
        .find({
          query: departmentQuery,
        });

      const departments =
        getResultData(departmentResponse) || [];

      /*
       * Department IDs are kept in a Set
       * for frontend filtering.
       */
      const departmentIdSet = new Set(
        departments
          .map((department) =>
            String(department._id),
          )
          .filter(Boolean),
      );

      /*
       * STEP 2:
       * Load all sections.
       *
       * IMPORTANT:
       * Do NOT use:
       *
       * departmentId: {
       *   $in: departmentIds
       * }
       *
       * because your current Feathers REST
       * query serialization converts the array
       * into an object and Mongoose cannot cast it.
       */
      const sectionResponse = await client
        .service("sections")
        .find({
          query: {
            $limit: 10000,
            $sort: {
              name: 1,
            },
          },
        });

      let sections =
        getResultData(sectionResponse) || [];

      /*
       * Filter sections on the frontend so
       * only sections belonging to the loaded
       * departments remain.
       */
      sections = sections.filter(
        (section) => {
          const sectionDepartmentId =
            getEntityId(
              section?.departmentId,
            );

          if (!sectionDepartmentId) {
            return false;
          }

          return departmentIdSet.has(
            String(
              sectionDepartmentId,
            ),
          );
        },
      );

      /*
       * STEP 3:
       * Load companies.
       *
       * Again, avoid $in for the same reason.
       */
      const companyResponse = await client
        .service("companies")
        .find({
          query: {
            $limit: 10000,
            $sort: {
              name: 1,
            },
          },
        });

      const allCompanies =
        getResultData(companyResponse) || [];

      /*
       * Find the company IDs actually referenced
       * by our departments.
       */
      const requiredCompanyIds = new Set(
        departments
          .map((department) =>
            getEntityId(
              department?.companyId,
            ),
          )
          .filter(Boolean)
          .map(String),
      );

      /*
       * Keep only the companies related to
       * these departments.
       */
      const companies =
        allCompanies.filter((company) =>
          requiredCompanyIds.has(
            String(company._id),
          ),
        );

      /*
       * STEP 4:
       * Create quick Company lookup.
       */
      const companyMap = {};

      companies.forEach((company) => {
        companyMap[String(company._id)] =
          company;
      });

      /*
       * STEP 5:
       * Group Sections by Department.
       */
      const sectionsByDepartment = {};

      sections.forEach((section) => {
        const sectionDepartmentId =
          getEntityId(
            section?.departmentId,
          );

        if (!sectionDepartmentId) {
          return;
        }

        const departmentKey = String(
          sectionDepartmentId,
        );

        if (
          !sectionsByDepartment[
            departmentKey
          ]
        ) {
          sectionsByDepartment[
            departmentKey
          ] = [];
        }

        sectionsByDepartment[
          departmentKey
        ].push({
          _id: section._id,
          value: section._id,
          name: section.name,
          code: section.code,
          departmentId:
            sectionDepartmentId,
        });
      });

      /*
       * STEP 6:
       * Build:
       *
       * Company
       *   -> Department
       *       -> Section
       */
      const groupsByCompany = {};

      departments.forEach(
        (department) => {
          const companyId =
            getEntityId(
              department?.companyId,
            );

          const company = companyId
            ? companyMap[
                String(companyId)
              ]
            : null;

          const companyKey = companyId
            ? String(companyId)
            : "no-company";

          const companyName =
            company?.name ||
            "No Company";

          /*
           * Create Company group if needed.
           */
          if (
            !groupsByCompany[
              companyKey
            ]
          ) {
            groupsByCompany[
              companyKey
            ] = {
              _id:
                companyId || null,

              name:
                companyName,

              companyId:
                companyId || null,

              departments: [],
            };
          }

          /*
           * Sections related to this
           * particular Department.
           */
          const departmentSections =
            sectionsByDepartment[
              String(
                department._id,
              )
            ] || [];

          /*
           * Add Department under Company.
           */
          groupsByCompany[
            companyKey
          ].departments.push({
            _id:
              department._id,

            value:
              department._id,

            name:
              department.name,

            companyId:
              companyId || null,

            companyName,

            sections:
              departmentSections
                .map((section) => ({
                  ...section,

                  departmentId:
                    department._id,

                  departmentName:
                    department.name,

                  companyId:
                    companyId || null,

                  companyName,
                }))
                .sort(sortByName),
          });
        },
      );

      /*
       * STEP 7:
       *
       * Sort:
       * Company A-Z
       * Department A-Z
       * Section A-Z
       */
      const groups = Object.values(
        groupsByCompany,
      )
        .map((company) => ({
          ...company,

          departments: [
            ...company.departments,
          ]
            .map((department) => ({
              ...department,

              sections: [
                ...(department.sections ||
                  []),
              ].sort(sortByName),
            }))
            .sort(sortByName),
        }))
        .sort(sortByName);

      console.log(
        "Company -> Department -> Section hierarchy:",
        groups,
      );

      setCompanyGroups(groups);
    } catch (error) {
      console.error(
        "Failed to load Company/Department/Section hierarchy:",
        error,
      );

      props.alert({
        title:
          "Company / Department / Section",
        type: "error",
        message:
          error.message ||
          "Failed to load Company, Department and Section hierarchy.",
      });
    } finally {
      setLoadingCascade(false);
    }
  };

  loadHierarchy();
}, [urlParams.singleDepartmentsId]);

  /*
   * Load Section Heads.
   */
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);

      try {
        const query = {
          $limit: 10000,

          $sort: {
            fullname: 1,
          },
        };

        if (
          urlParams.singleEmployeesId
        ) {
          query._id =
            urlParams.singleEmployeesId;
        }

        const response = await client
          .service("employees")
          .find({
            query,
          });

        const options =
          getResultData(response)
            .map((employee) => ({
              _id: employee._id,

              value:
                employee._id,

              name:
                employee.fullname
                  ? `${employee.empNo || ""} - ${employee.fullname}`
                  : employee.empNo ||
                    "Unnamed Employee",

              empNo:
                employee.empNo,

              fullName:
                employee.fullname ||
                "",
            }))
            .sort(
              (first, second) =>
                (
                  first.fullName ||
                  ""
                ).localeCompare(
                  second.fullName ||
                    "",
                  undefined,
                  {
                    sensitivity:
                      "base",
                  },
                ),
            );

        setEmployees(options);
      } catch (error) {
        console.error(
          "Failed get employees:",
          error,
        );

        props.alert({
          title: "Employees",
          type: "error",
          message:
            error.message ||
            "Failed get employees",
        });
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [
    urlParams.singleEmployeesId,
  ]);

  const setValByKey = (
    key,
    value,
  ) => {
    set_entity((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError((previous) => ({
      ...previous,
      [key]: undefined,
    }));
  };

  const validate = () => {
    const validationErrors = {};

    if (
      !_entity?.employees?._id
    ) {
      validationErrors.employees =
        "Section Head is required.";
    }

    /*
     * An existing record already has
     * departmentId, so selecting a new
     * Section is optional during Edit.
     */
    if (
      !_entity?.departmentId?._id
    ) {
      validationErrors.departmentId =
        "Department is required.";
    }

    setError(
      validationErrors,
    );

    return (
      Object.keys(
        validationErrors,
      ).length === 0
    );
  };

  const onSave = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const updateData = {
        departmentId:
          _entity.departmentId._id,

        employees:
          _entity.employees._id,

        updatedBy:
          props.user._id,
      };

      await client
        .service("departmentHOS")
        .patch(
          _entity._id,
          updateData,
        );

      const response = await client
        .service("departmentHOS")
        .find({
          query: {
            _id: _entity._id,

            $limit: 1,

            $populate: [
              {
                path:
                  "departmentId",

                service:
                  "departments",

                select: [
                  "name",
                  "companyId",
                ],
              },

              {
                path:
                  "employees",

                service:
                  "employees",

                select: [
                  "fullname",
                  "empNo",
                  "name",
                ],
              },
            ],
          },
        });

      const populated =
        getResultData(response)[0];

      /*
       * Determine Company.
       *
       * If a new Section was selected,
       * use that data directly.
       */
      let company = null;

      if (
        selectedSection?.companyId
      ) {
        company = {
          _id:
            selectedSection.companyId,

          name:
            selectedSection.companyName,
        };
      } else {
        /*
         * Otherwise retrieve Company
         * from populated Department.
         */
        const companyId =
          getEntityId(
            populated?.departmentId
              ?.companyId,
          );

        if (companyId) {
          const companyResponse =
            await client
              .service("companies")
              .find({
                query: {
                  _id:
                    companyId,
                  $limit: 1,
                },
              });

          const foundCompany =
            getResultData(
              companyResponse,
            )[0];

          if (foundCompany) {
            company =
              foundCompany;
          }
        }
      }

      const resultForTable = {
        ...populated,

        Company: company,

        /*
         * Frontend only.
         */
        ...(selectedSection
          ? {
              Section: {
                _id:
                  selectedSection._id,

                name:
                  selectedSection.name,
              },
            }
          : {}),
      };

      props.onEditResult(
        resultForTable,
      );

      props.onHide();

      props.alert({
        type: "success",
        title:
          "Section Head Updated",
        message:
          "Section Head updated successfully.",
      });
    } catch (error) {
      console.error(
        "Failed to update Section Head:",
        error,
      );

      setError({
        error:
          error.message ||
          "Failed to update Section Head.",
      });

      props.alert({
        type: "error",
        title:
          "Edit Section Head",
        message:
          error.message ||
          "Failed to update Section Head.",
      });
    } finally {
      setLoading(false);
    }
  };

  const employeeItemTemplate = (
    option,
  ) =>
    option?.name || "Unknown";

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

  return (
    <Dialog
      header="Edit Section Head"
      visible={props.show}
      closable={false}
      onHide={props.onHide}
      modal
      style={{
        width: "45vw",
      }}
      className="min-w-max scalein animation-ease-in-out animation-duration-1000"
      footer={renderFooter()}
      resizable={false}
    >
      <div
        className="grid p-fluid overflow-y-auto"
        style={{
          maxWidth: "60vw",
        }}
        role="departmentHOS-edit-dialog-component"
      >
        {/* Section Head */}
        <div className="col-12 md:col-6 field">
          <label htmlFor="employees">
            Section Head:
          </label>

          <Dropdown
            id="employees"
            value={
              _entity?.employees?._id
            }
            optionLabel="name"
            optionValue="value"
            options={employees}
            onChange={(event) =>
              setValByKey(
                "employees",
                {
                  _id:
                    event.value,
                },
              )
            }
            itemTemplate={
              employeeItemTemplate
            }
            valueTemplate={(
              option,
            ) =>
              option ? (
                employeeItemTemplate(
                  option,
                )
              ) : (
                <span>
                  Select a section head
                </span>
              )
            }
            placeholder="Select Section Head"
            filter
            filterBy="name"
            filterPlaceholder="Search by employee number or name..."
            emptyFilterMessage="No employees found"
            emptyMessage="No employees available"
            loading={
              loadingEmployees
            }
          />

          {error?.employees && (
            <small className="p-error">
              {error.employees}
            </small>
          )}
        </div>

        {/* Cascade */}
        <div className="col-12 md:col-6 field">
          <label htmlFor="section">
            Section:
          </label>

          <CascadeSelect
            id="section"
            value={
              selectedSection
            }
            options={
              companyGroups
            }
            optionLabel="name"
            optionGroupLabel="name"
            optionGroupChildren={[
              "departments",
              "sections",
            ]}
            onChange={(event) => {
              const section =
                event.value;

              setSelectedSection(
                section,
              );

              if (section) {
                /*
                 * Save only Department
                 * because backend does
                 * not contain sectionId.
                 */
                setValByKey(
                  "departmentId",
                  {
                    _id:
                      section.departmentId,

                    name:
                      section.departmentName,

                    companyId:
                      section.companyId,
                  },
                );
              }
            }}
            placeholder={
              loadingCascade
                ? "Loading..."
                : "Select Company, Department and Section"
            }
            disabled={
              loadingCascade
            }
            className="w-full"
            breakpoint="767px"
          />

          {/*
            Because sectionId isn't stored,
            show current backend Department
            separately when editing.
          */}
          {!selectedSection &&
            _entity?.departmentId
              ?.name && (
              <div className="mt-2">
                <small className="text-500 block">
                  Current Department:{" "}
                  {
                    _entity
                      .departmentId
                      .name
                  }
                </small>

                <small className="text-500 block">
                  Select a Section
                  above only if you
                  want to change the
                  Department.
                </small>
              </div>
            )}

          {selectedSection && (
            <div className="mt-2">
              <small className="text-500 block">
                Company:{" "}
                {
                  selectedSection.companyName
                }
              </small>

              <small className="text-500 block">
                Department:{" "}
                {
                  selectedSection.departmentName
                }
              </small>

              <small className="text-500 block">
                Section:{" "}
                {
                  selectedSection.name
                }
              </small>
            </div>
          )}

          {error?.departmentId && (
            <small className="p-error block">
              {
                error.departmentId
              }
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

  hasServicePermission: (
    service,
  ) =>
    dispatch.perms.hasServicePermission(
      service,
    ),

  hasServiceFieldsPermission: (
    service,
  ) =>
    dispatch.perms.hasServiceFieldsPermission(
      service,
    ),
});

export default connect(
  mapState,
  mapDispatch,
)(DepartmentHOSEditDialogComponent);