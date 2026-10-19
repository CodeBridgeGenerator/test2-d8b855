import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import _ from "lodash";

import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";

import client from "../../../services/restClient";
import entityCreate from "../../../utils/entity";
import DownloadCSV from "../../../utils/DownloadCSV";
import AreYouSureDialog from "../../common/AreYouSureDialog";

import DepartmentHOSDatatable from "./DepartmentHOSDataTable";
import DepartmentHOSEditDialogComponent from "./DepartmentHOSEditDialogComponent";
import DepartmentHOSCreateDialogComponent from "./DepartmentHOSCreateDialogComponent";
import DepartmentHOSFakerDialogComponent from "./DepartmentHOSFakerDialogComponent";
import DepartmentHOSSeederDialogComponent from "./DepartmentHOSSeederDialogComponent";

import HelpbarService from "../../../services/HelpbarService";

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

const sortByHeadName = (records = []) => {
  return [...records].sort((first, second) => {
    const firstName =
      first?.employees?.fullname || "";

    const secondName =
      second?.employees?.fullname || "";

    return firstName.localeCompare(
      secondName,
      undefined,
      {
        sensitivity: "base",
      },
    );
  });
};

const DepartmentHOSPage = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = useParams();

  const filename = "departmentHOS";

  const [data, setData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(false);

  const [
    showAreYouSureDialog,
    setShowAreYouSureDialog,
  ] = useState(false);

  const [showEditDialog, setShowEditDialog] =
    useState(false);

  const [showCreateDialog, setShowCreateDialog] =
    useState(false);

  const [newRecord, setRecord] = useState({});

  const [showFakerDialog, setShowFakerDialog] =
    useState(false);

  const [
    showDeleteAllDialog,
    setShowDeleteAllDialog,
  ] = useState(false);

  const [showSeederDialog, setShowSeederDialog] =
    useState(false);

  const [
    selectedEntityIndex,
    setSelectedEntityIndex,
  ] = useState(null);

  const [showUpload, setShowUpload] =
    useState(false);

  const [showFilter, setShowFilter] =
    useState(false);

  const [
    selectedFilterFields,
    setSelectedFilterFields,
  ] = useState([]);

  const [
    selectedHideFields,
    setSelectedHideFields,
  ] = useState([]);

  const [showColumns, setShowColumns] =
    useState(false);

  const [searchDialog, setSearchDialog] =
    useState(false);

  const [triggerDownload, setTriggerDownload] =
    useState(false);

  const [
    isHelpSidebarVisible,
    setHelpSidebarVisible,
  ] = useState(false);

  const [selectedDelete, setSelectedDelete] =
    useState([]);

  const [permissions, setPermissions] =
    useState({});

  const toggleHelpSidebar = () => {
    setHelpSidebarVisible(
      (previous) => !previous,
    );
  };

  /*
   * Schema and permissions.
   */
  useEffect(() => {
    const getSchema = async () => {
      try {
        const schema =
          await props.getSchema("departmentHOS");

        const schemaFields =
          schema?.data
            ?.map((field, index) =>
              index > 5 ? field.field : null,
            )
            .filter(Boolean) || [];

        setSelectedHideFields(schemaFields);
      } catch (error) {
        console.error(
          "Failed to get departmentHOS schema:",
          error,
        );
      }
    };

    getSchema();

    props
      .hasServicePermission(filename)
      .then(setPermissions);

    if (location?.state?.action === "create") {
      entityCreate(location, setRecord);
      setShowCreateDialog(true);
    } else if (
      location?.state?.action === "edit"
    ) {
      setShowCreateDialog(true);
    }
  }, []);

  /*
   * Fetch Department HOS records.
   *
   * departmentHOS -> departmentId
   * departmentId -> companyId
   * companyId -> company
   */
  useEffect(() => {
    const fetchSectionHeads = async () => {
      setLoading(true);
      props.show();

      try {
        const query = {
          $limit: 10000,

          $populate: [
            {
              path: "createdBy",
              service: "users",
              select: ["name"],
            },
            {
              path: "updatedBy",
              service: "users",
              select: ["name"],
            },
            {
              path: "departmentId",
              service: "departments",

              // companyId is necessary to obtain
              // the company related to Department.
              select: [
                "name",
                "companyId",
                "code",
              ],
            },
            {
              path: "employees",
              service: "employees",
              select: [
                "fullname",
                "empNo",
                "name",
              ],
            },
          ],
        };

        if (urlParams.singleDepartmentsId) {
          query.departmentId =
            urlParams.singleDepartmentsId;
        }

        if (urlParams.singleEmployeesId) {
          query.employees =
            urlParams.singleEmployeesId;
        }

        const response = await client
          .service("departmentHOS")
          .find({
            query,
          });

        let results =
          getResultData(response);

        /*
         * Find company IDs from populated
         * departments.
         */
        const companyIds = [
          ...new Set(
            results
              .map((record) =>
                getEntityId(
                  record?.departmentId
                    ?.companyId,
                ),
              )
              .filter(Boolean)
              .map(String),
          ),
        ];

        let companies = [];

        if (companyIds.length > 0) {
          const companyResponse =
            await client
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

          companies =
            getResultData(companyResponse);
        }

        /*
         * Company lookup.
         */
        const companyMap = {};

        companies.forEach((company) => {
          companyMap[String(company._id)] =
            company;
        });

        /*
         * Attach Company to every HOS record.
         *
         * This is frontend-only.
         * Nothing is stored in departmentHOS.
         */
        results = results.map((record) => {
          const companyId = getEntityId(
            record?.departmentId?.companyId,
          );

          return {
            ...record,

            Company: companyId
              ? companyMap[
                  String(companyId)
                ] || null
              : null,
          };
        });

        /*
         * Default alphabetical sorting
         * according to Section Head fullname.
         */
        results = sortByHeadName(results);

        setData(results);
        setInitialData(
          _.cloneDeep(results),
        );
      } catch (error) {
        console.error(
          "Failed to get Section Heads:",
          error,
        );

        props.alert({
          title: "Section Heads",
          type: "error",
          message:
            error.message ||
            "Failed get Section Heads",
        });
      } finally {
        setLoading(false);
        props.hide();
      }
    };

    fetchSectionHeads();
  }, [
    showFakerDialog,
    showDeleteAllDialog,
    showEditDialog,
    showCreateDialog,
    urlParams.singleDepartmentsId,
    urlParams.singleEmployeesId,
  ]);

  const onClickSaveFilteredfields = (
    selectedFields,
  ) => {
    console.log(selectedFields);
  };

  const onClickSaveHiddenfields = (
    selectedFields,
  ) => {
    console.log(selectedFields);
  };

  const onEditRow = (rowData) => {
    setSelectedEntityIndex(rowData._id);
    setShowEditDialog(true);
  };

  /*
   * Add newly created row and keep
   * alphabetical sorting.
   */
  const onCreateResult = (newEntity) => {
    setData((previous) =>
      sortByHeadName([
        ...previous,
        newEntity,
      ]),
    );
  };

  const onFakerCreateResults = (
    newEntities,
  ) => {
    setSelectedEntityIndex(null);

    setData((previous) =>
      sortByHeadName([
        ...previous,
        ...newEntities,
      ]),
    );
  };

  const onSeederResults = (
    newEntities,
  ) => {
    setSelectedEntityIndex(null);

    setData((previous) =>
      sortByHeadName([
        ...previous,
        ...newEntities,
      ]),
    );
  };

  /*
   * Replace edited row properly.
   */
  const onEditResult = (newEntity) => {
    setData((previous) => {
      const updated = previous.map(
        (record) =>
          String(record._id) ===
          String(selectedEntityIndex)
            ? newEntity
            : record,
      );

      return sortByHeadName(updated);
    });
  };

  const deleteRow = async () => {
    try {
      await client
        .service("departmentHOS")
        .remove(selectedEntityIndex);

      setData((previous) =>
        previous.filter(
          (record) =>
            String(record._id) !==
            String(selectedEntityIndex),
        ),
      );

      setSelectedEntityIndex(null);
      setShowAreYouSureDialog(false);
    } catch (error) {
      console.error({ error });

      props.alert({
        title: "Section Heads",
        type: "error",
        message:
          error.message ||
          "Failed delete record",
      });
    }
  };

  const onRowDelete = (id) => {
    setSelectedEntityIndex(id);
    setShowAreYouSureDialog(true);
  };

  const deleteAll = async () => {
    setLoading(true);
    props.show();

    const countDataItems =
      data?.length || 0;

    try {
      await Promise.all(
        data.map((record) =>
          client
            .service("departmentHOS")
            .remove(record._id),
        ),
      );

      setData([]);
      setInitialData([]);
      setShowDeleteAllDialog(false);

      props.alert({
        title: "Section Heads",
        type: "warn",
        message: `Successfully dropped ${countDataItems} records`,
      });
    } catch (error) {
      console.error(error);

      props.alert({
        title: "Section Heads",
        type: "error",
        message:
          error.message ||
          "Failed to delete all records",
      });
    } finally {
      setLoading(false);
      props.hide();
    }
  };

  const onRowClick = ({ data: rowData }) => {
    navigate(
      `/cbAdmin/departmentHOS/${rowData._id}`,
    );
  };

  const menuItems = [
    {
      label: "Export",
      icon: "pi pi-download",

      command: () => {
        if (data.length > 0) {
          setTriggerDownload(true);
        } else {
          props.alert({
            title: "Export",
            type: "warn",
            message:
              "No data to export",
          });
        }
      },
    },

    {
      label: "Help",
      icon: "pi pi-question-circle",
      command: toggleHelpSidebar,
    },
  ];

  return (
    <div className="mt-5">
      <div className="grid">
        <div className="col-6 flex align-items-center justify-content-start">
          <h4 className="mb-0 ml-2">
            <span>Office / </span>

            <strong>
              Section Heads
            </strong>
          </h4>

          <SplitButton
            model={menuItems}
            dropdownIcon="pi pi-ellipsis-h"
            buttonClassName="hidden"
            menuButtonClassName="ml-1 p-button-text"
          />
        </div>

        <div className="col-6 flex justify-content-end">
          <Button
            label="add"
            style={{
              height: "30px",
            }}
            rounded
            loading={loading}
            icon="pi pi-plus"
            onClick={() =>
              setShowCreateDialog(true)
            }
            role="departmentHOS-add-button"
          />
        </div>
      </div>

      <div className="grid align-items-center">
        <div
          className="col-12"
          role="departmentHOS-datatable"
        >
          <DepartmentHOSDatatable
            items={data}
            fields={fields}
            onRowDelete={onRowDelete}
            onEditRow={onEditRow}
            onRowClick={onRowClick}
            searchDialog={searchDialog}
            setSearchDialog={
              setSearchDialog
            }
            showUpload={showUpload}
            setShowUpload={setShowUpload}
            showFilter={showFilter}
            setShowFilter={setShowFilter}
            showColumns={showColumns}
            setShowColumns={
              setShowColumns
            }
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
            selectedDelete={
              selectedDelete
            }
            setSelectedDelete={
              setSelectedDelete
            }
            onCreateResult={
              onCreateResult
            }
            filename={filename}
            hasServiceFieldsPermission={
              props.hasServiceFieldsPermission
            }
            hasServicePermission={
              props.hasServicePermission
            }
          />
        </div>
      </div>

      <DownloadCSV
        data={data}
        fileName={filename}
        triggerDownload={
          triggerDownload
        }
      />

      <AreYouSureDialog
        header="Delete"
        body="Are you sure you want to delete this record?"
        show={showAreYouSureDialog}
        onHide={() =>
          setShowAreYouSureDialog(false)
        }
        onYes={deleteRow}
      />

      <DepartmentHOSEditDialogComponent
        entity={_.find(data, {
          _id: selectedEntityIndex,
        })}
        show={showEditDialog}
        onHide={() =>
          setShowEditDialog(false)
        }
        onEditResult={onEditResult}
      />

      <DepartmentHOSCreateDialogComponent
        entity={newRecord}
        onCreateResult={onCreateResult}
        show={showCreateDialog}
        onHide={() =>
          setShowCreateDialog(false)
        }
      />

      <DepartmentHOSFakerDialogComponent
        show={showFakerDialog}
        onHide={() =>
          setShowFakerDialog(false)
        }
        onFakerCreateResults={
          onFakerCreateResults
        }
      />

      <DepartmentHOSSeederDialogComponent
        show={showSeederDialog}
        onHide={() =>
          setShowSeederDialog(false)
        }
        onSeederResults={
          onSeederResults
        }
      />

      <AreYouSureDialog
        header={`Drop ${data?.length} records`}
        body={`Are you sure you want to drop ${data?.length} records?`}
        show={showDeleteAllDialog}
        onHide={() =>
          setShowDeleteAllDialog(false)
        }
        onYes={deleteAll}
        loading={loading}
      />

      <HelpbarService
        isVisible={
          isHelpSidebarVisible
        }
        onToggle={toggleHelpSidebar}

        // Fixed from departmentHOD
        serviceName="departmentHOS"
      />
    </div>
  );
};

const mapState = (state) => {
  const { user, isLoggedIn } =
    state.auth;

  return {
    user,
    isLoggedIn,
  };
};

const mapDispatch = (dispatch) => ({
  alert: (data) =>
    dispatch.toast.alert(data),

  getSchema: (serviceName) =>
    dispatch.db.getSchema(serviceName),

  hasServicePermission: (service) =>
    dispatch.perms.hasServicePermission(
      service,
    ),

  hasServiceFieldsPermission: (
    service,
  ) =>
    dispatch.perms.hasServiceFieldsPermission(
      service,
    ),

  show: () =>
    dispatch.loading.show(),

  hide: () =>
    dispatch.loading.hide(),
});

export default connect(
  mapState,
  mapDispatch,
)(DepartmentHOSPage);