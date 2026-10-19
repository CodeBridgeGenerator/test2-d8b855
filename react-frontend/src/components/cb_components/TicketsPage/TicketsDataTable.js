import React, { useRef, useState } from "react";
import moment from "moment";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const TicketsDataTable = ({ items, loading, onRowClick, onEditRow }) => {
  const tableRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const header = (
    <div
      className="table-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h5 className="m-0"></h5>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Keyword Search"
          aria-label="Search support tickets"
        />
      </span>
    </div>
  );

  const statusTemplate = (row) => (
    <Tag
      value={row.status}
      severity={row.status === "open" ? "warning" : "info"}
    />
  );

  const priorityTemplate = (row) => <Tag value={row.priority} />;
  const typeTemplate = (row) => (
    <Tag
      value={row.type || "L1"}
      severity="secondary"
    />
  );
  const createdTemplate = (row) => moment(row.createdAt).fromNow();
  const editTemplate = (row) => (
    <Button
      icon="pi pi-pencil"
      className="p-button-rounded p-button-text p-button-warning"
      onClick={(event) => {
        event.stopPropagation();
        onEditRow(row);
      }}
      aria-label="Edit ticket"
    />
  );

  return (
    <DataTable
      ref={tableRef}
      value={items}
      loading={loading}
      onRowClick={onRowClick}
      rowHover
      stripedRows
      scrollable
      paginator
      rows={10}
      rowsPerPageOptions={[10, 50, 250]}
      rowClassName="cursor-pointer"
      size="small"
      globalFilter={globalFilter}
      globalFilterFields={[
        "requesterEmail",
        "subject",
        "message",
        "status",
        "priority",
      ]}
      header={header}
    >
      <Column field="type" header="Type" body={typeTemplate} />
      <Column field="requesterEmail" header="Requester" frozen />
      <Column field="subject" header="Subject" />
      <Column field="message" header="Message" />
      <Column field="status" header="Status" body={statusTemplate} />
      <Column
        field="priority"
        header="Priority"
        body={priorityTemplate}
      />
      <Column
        field="createdAt"
        header="Created"
        body={createdTemplate}
      />
      <Column header="Edit" body={editTemplate} />
    </DataTable>
  );
};

export default TicketsDataTable;
