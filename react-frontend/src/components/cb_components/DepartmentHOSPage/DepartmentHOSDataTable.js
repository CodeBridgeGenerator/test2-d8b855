import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import { Button } from "primereact/button";
import { useParams } from "react-router-dom";

import UploadService from "../../../services/UploadService";

import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";

import InboxCreateDialogComponent from "../../cb_components/InboxPage/InboxCreateDialogComponent";

import InviteIcon from "../../../assets/media/Invite.png";
import ExportIcon from "../../../assets/media/Export & Share.png";
import CopyIcon from "../../../assets/media/Clipboard.png";
import DuplicateIcon from "../../../assets/media/Duplicate.png";
import DeleteIcon from "../../../assets/media/Trash.png";

import { Checkbox } from "primereact/checkbox";
import { Skeleton } from "primereact/skeleton";

const DepartmentHOSDataTable = ({
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

  filename,

  hasServiceFieldsPermission,
  hasServicePermission,
}) => {
  const dt = useRef(null);
  const urlParams = useParams();

  const [globalFilter, setGlobalFilter] =
    useState("");

  const [selectedItems, setSelectedItems] =
    useState([]);

  const [showDialog, setShowDialog] =
    useState(false);

  const [permissions, setPermissions] =
    useState({});

  const [
    fieldPermissions,
    setFieldPermissions,
  ] = useState({});

  const [
    isLoadingPermissions,
    setIsLoadingPermissions,
  ] = useState(true);

  const fetchServicePermissions =
    async () => {
      setIsLoadingPermissions(true);

      try {
        const servicePermissions =
          await hasServicePermission(
            filename,
          );

        const fieldPermissionResult =
          await hasServiceFieldsPermission(
            filename,
          );

        setPermissions(
          servicePermissions || {},
        );

        setFieldPermissions(
          fieldPermissionResult || {},
        );
      } catch (error) {
        console.error(
          "Failed to get permissions:",
          error,
        );

        setPermissions({});
        setFieldPermissions({});
      } finally {
        setIsLoadingPermissions(false);
      }
    };

  useEffect(() => {
    fetchServicePermissions();
  }, []);

  /*
   * Column templates.
   */
  const employeeTemplate = (
    rowData,
  ) => (
    <span>
      {rowData?.employees?.fullname ||
        "-"}
    </span>
  );

  const companyTemplate = (
    rowData,
  ) => (
    <span>
      {rowData?.Company?.name || "-"}
    </span>
  );

  const departmentTemplate = (
    rowData,
  ) => (
    <span>
      {rowData?.departmentId?.name ||
        "-"}
    </span>
  );

  const editTemplate = (
    rowData,
    { rowIndex },
  ) => (
    <Button
      onClick={(event) => {
        /*
         * Prevent table row click when
         * Edit button is clicked.
         */
        event.stopPropagation();

        onEditRow(
          rowData,
          rowIndex,
        );
      }}
      icon={`pi ${
        rowData.isEdit
          ? "pi-check"
          : "pi-pencil"
      }`}
      className={`p-button-rounded p-button-text ${
        rowData.isEdit
          ? "p-button-success"
          : "p-button-warning"
      }`}
    />
  );

  const checkboxTemplate = (
    rowData,
  ) => (
    <Checkbox
      checked={selectedItems.some(
        (item) =>
          String(item._id) ===
          String(rowData._id),
      )}
      onChange={(event) => {
        let updated = [
          ...selectedItems,
        ];

        if (event.checked) {
          if (
            !updated.some(
              (item) =>
                String(item._id) ===
                String(rowData._id),
            )
          ) {
            updated.push(rowData);
          }
        } else {
          updated = updated.filter(
            (item) =>
              String(item._id) !==
              String(rowData._id),
          );
        }

        setSelectedItems(updated);
      }}
      onClick={(event) =>
        event.stopPropagation()
      }
    />
  );

  const deselectAllRows = () => {
    setSelectedItems([]);
  };

  const handleMessage = () => {
    setShowDialog(true);
  };

  const handleHideDialog = () => {
    setShowDialog(false);
  };

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
    </DataTable>
  );

  /*
   * Search box shown above the table.
   */
  const tableHeader = (
    <div
      className="flex justify-content-between align-items-center"
      style={{
        width: "100%",
      }}
    >
      <div />

      <span className="p-input-icon-left">
        <i className="pi pi-search" />

        <InputText
          value={globalFilter}
          onChange={(event) =>
            setGlobalFilter(
              event.target.value,
            )
          }
          placeholder="Search section head, company or department..."
          style={{
            width: "350px",
          }}
        />
      </span>
    </div>
  );

  return (
    <>
      {isLoadingPermissions ? (
        renderSkeleton()
      ) : permissions.read ? (
        <>
          <DataTable
            value={items || []}
            ref={dt}
            header={tableHeader}
            removableSort
            onRowClick={onRowClick}
            scrollable
            rowHover
            stripedRows
            paginator
            rows={10}
            rowsPerPageOptions={[
              10,
              50,
              250,
              500,
            ]}
            size="small"
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            rowClassName="cursor-pointer"
            alwaysShowPaginator={
              !urlParams.singleUsersId
            }
            selection={selectedItems}
            onSelectionChange={(
              event,
            ) =>
              setSelectedItems(
                event.value,
              )
            }

            /*
             * Search Head, Company,
             * Department.
             */
            globalFilter={
              globalFilter
            }
            globalFilterFields={[
              "employees.fullname",
              "employees.empNo",
              "Company.name",
              "departmentId.name",
            ]}

            /*
             * Default sort:
             * Section Head A-Z.
             */
            sortField="employees.fullname"
            sortOrder={1}
          >
            <Column
              selectionMode="multiple"
              headerStyle={{
                width: "3rem",
              }}
              body={checkboxTemplate}
            />

            {/* Section Head */}
            <Column
              field="employees.fullname"
              header="Section Head"
              body={employeeTemplate}
              filter={selectedFilterFields.includes(
                "employees",
              )}
              hidden={selectedHideFields?.includes(
                "employees",
              )}
              style={{
                minWidth: "12rem",
              }}
              sortable
            />

            {/* Company */}
            <Column
              field="Company.name"
              header="Company"
              body={companyTemplate}
              style={{
                minWidth: "12rem",
              }}
              sortable
            />

            {/* Department */}
            <Column
              field="departmentId.name"
              header="Department"
              body={departmentTemplate}
              filter={selectedFilterFields.includes(
                "departmentId",
              )}
              hidden={selectedHideFields?.includes(
                "departmentId",
              )}
              style={{
                minWidth: "12rem",
              }}
              sortable
            />

            <Column
              header="Edit"
              body={editTemplate}
              style={{
                width: "6rem",
              }}
            />
          </DataTable>

          {selectedItems.length > 0 && (
            <div
              className="card center"
              style={{
                width: "51rem",
                margin:
                  "20px auto 0",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "10px",
                fontSize: "14px",
                fontFamily:
                  "Arial, sans-serif",
                color: "#2A4454",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border:
                    "1px solid #2A4454",
                  padding: "5px",
                  borderRadius: "5px",
                }}
              >
                {selectedItems.length}{" "}
                selected

                <span
                  className="pi pi-times"
                  style={{
                    cursor: "pointer",
                    marginLeft: "10px",
                    color: "#2A4454",
                  }}
                  onClick={
                    deselectAllRows
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Button
                  label="Copy"
                  icon={
                    <img
                      src={CopyIcon}
                      alt=""
                      style={{
                        marginRight:
                          "4px",
                        width: "1em",
                        height: "1em",
                      }}
                    />
                  }
                  className="p-button-rounded p-button-text"
                  style={{
                    backgroundColor:
                      "white",
                    color: "#2A4454",
                    marginRight:
                      "8px",
                  }}
                />

                <Button
                  label="Duplicate"
                  icon={
                    <img
                      src={
                        DuplicateIcon
                      }
                      alt=""
                      style={{
                        marginRight:
                          "4px",
                        width: "1em",
                        height: "1em",
                      }}
                    />
                  }
                  className="p-button-rounded p-button-text"
                  style={{
                    backgroundColor:
                      "white",
                    color: "#2A4454",
                    marginRight:
                      "8px",
                  }}
                />

                <Button
                  label="Export"
                  icon={
                    <img
                      src={ExportIcon}
                      alt=""
                      style={{
                        marginRight:
                          "4px",
                        width: "1em",
                        height: "1em",
                      }}
                    />
                  }
                  className="p-button-rounded p-button-text"
                  style={{
                    backgroundColor:
                      "white",
                    color: "#2A4454",
                    marginRight:
                      "8px",
                  }}
                />

                <Button
                  label="Message"
                  icon={
                    <img
                      src={InviteIcon}
                      alt=""
                      style={{
                        marginRight:
                          "4px",
                        width: "1em",
                        height: "1em",
                      }}
                    />
                  }
                  onClick={handleMessage}
                  className="p-button-rounded p-button-text"
                  style={{
                    backgroundColor:
                      "white",
                    color: "#2A4454",
                    marginRight:
                      "8px",
                  }}
                />

                <InboxCreateDialogComponent
                  show={showDialog}
                  onHide={
                    handleHideDialog
                  }
                  serviceInbox="departmentHOS"
                  onCreateResult={
                    onCreateResult
                  }
                  selectedItemsId={
                    selectedItems
                  }
                />

                <Button
                  label="Delete"
                  disabled
                  icon={
                    <img
                      src={DeleteIcon}
                      alt=""
                      style={{
                        marginRight:
                          "4px",
                        width: "1em",
                        height: "1em",
                      }}
                    />
                  }
                  className="p-button-rounded p-button-text"
                  style={{
                    backgroundColor:
                      "white",
                    color: "#2A4454",
                  }}
                />
              </div>
            </div>
          )}

          <Dialog
            header="Upload DepartmentHOS Data"
            visible={showUpload}
            onHide={() =>
              setShowUpload(false)
            }
          >
            <UploadService
              user={user}
              serviceName="departmentHOS"
              onUploadComplete={() =>
                setShowUpload(false)
              }
            />
          </Dialog>

          <Dialog
            header="Search DepartmentHOS"
            visible={searchDialog}
            onHide={() =>
              setSearchDialog(false)
            }
          >
            Search
          </Dialog>

          <Dialog
            header="Filter Section Heads"
            visible={showFilter}
            onHide={() =>
              setShowFilter(false)
            }
          >
            <div className="card flex justify-content-center">
              <MultiSelect
                value={
                  selectedFilterFields
                }
                onChange={(event) =>
                  setSelectedFilterFields(
                    event.value,
                  )
                }
                options={fields}
                optionLabel="name"
                optionValue="value"
                filter
                placeholder="Select Fields"
                maxSelectedLabels={6}
                className="w-full md:w-20rem"
              />
            </div>

            <Button
              text
              label="save as pref"
              onClick={() => {
                onClickSaveFilteredfields(
                  selectedFilterFields,
                );

                setShowFilter(false);
              }}
            />
          </Dialog>

          <Dialog
            header="Hide Columns"
            visible={showColumns}
            onHide={() =>
              setShowColumns(false)
            }
          >
            <div className="card flex justify-content-center">
              <MultiSelect
                value={
                  selectedHideFields
                }
                onChange={(event) =>
                  setSelectedHideFields(
                    event.value,
                  )
                }
                options={fields}
                optionLabel="name"
                optionValue="value"
                filter
                placeholder="Select Fields"
                maxSelectedLabels={6}
                className="w-full md:w-20rem"
              />
            </div>

            <Button
              text
              label="save as pref"
              onClick={() => {
                onClickSaveHiddenfields(
                  selectedHideFields,
                );

                setShowColumns(false);
              }}
            />
          </Dialog>
        </>
      ) : (
        <div>
          You do not have permission
          to view this data.
        </div>
      )}
    </>
  );
};

export default DepartmentHOSDataTable;