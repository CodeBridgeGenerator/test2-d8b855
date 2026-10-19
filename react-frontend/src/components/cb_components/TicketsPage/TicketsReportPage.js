import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { SplitButton } from "primereact/splitbutton";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import * as XLSX from "xlsx";
import client from "../../../services/restClient";

const STATUS_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#64748b"];
const TYPE_COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16"];
const PRIORITY_COLORS = ["#94a3b8", "#3b82f6", "#f97316", "#ef4444"];

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const labelize = (value) =>
  String(value || "Unspecified")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const countBy = (rows, field) =>
  rows.reduce((result, row) => {
    const key = row[field] || "unspecified";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

const downloadBlob = (content, type, filename) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const TicketsReportPage = ({ alert, hideHeader = false }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const range = useMemo(
    () => ({
      from: startOfMonth(selectedMonth),
      to: endOfMonth(selectedMonth),
    }),
    [selectedMonth],
  );

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await client.service("supportTickets").find({
        query: {
          createdAt: {
            $gte: range.from.toISOString(),
            $lte: range.to.toISOString(),
          },
          $sort: { createdAt: -1 },
          $limit: 10000,
        },
      });
      setTickets(response.data || response || []);
    } catch (error) {
      alert({
        title: "Support Tickets Report",
        type: "error",
        message: error.message || "Failed to generate ticket report",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [range.from.getTime(), range.to.getTime()]);

  // This service query is already restricted to the selected report month.
  // Keep a clearly named collection for the report table and its exports.
  const reportTickets = tickets;

  const summary = useMemo(() => {
    const resolved = tickets.filter((ticket) =>
      ["resolved", "closed"].includes(ticket.status),
    );
    const resolutionHours = resolved
      .filter((ticket) => ticket.resolvedAt && ticket.createdAt)
      .map(
        (ticket) =>
          (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000,
      )
      .filter((hours) => hours >= 0);

    return {
      total: tickets.length,
      open: tickets.filter((ticket) =>
        ["open", "in_progress"].includes(ticket.status),
      ).length,
      resolved: resolved.length,
      urgent: tickets.filter((ticket) => ticket.priority === "P1").length,
      resolutionRate: tickets.length
        ? Math.round((resolved.length / tickets.length) * 100)
        : 0,
      averageResolution: resolutionHours.length
        ? (
            resolutionHours.reduce((sum, hours) => sum + hours, 0) /
            resolutionHours.length
          ).toFixed(1)
        : "-",
    };
  }, [tickets]);

  const chartFor = (field, colors) => {
    const values = countBy(tickets, field);
    return {
      labels: Object.keys(values).map(labelize),
      datasets: [{ data: Object.values(values), backgroundColor: colors }],
    };
  };

  const dailyChart = useMemo(() => {
    const days = range.to.getDate();
    const counts = Array.from({ length: days }, () => 0);
    tickets.forEach((ticket) => {
      counts[new Date(ticket.createdAt).getDate() - 1] += 1;
    });
    return {
      labels: counts.map((_, index) => String(index + 1)),
      datasets: [
        {
          label: "Support tickets created",
          data: counts,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [tickets, range.to]);

  const exportRows = () =>
    reportTickets.map((ticket) => ({
      ID: ticket._id,
      Type: labelize(ticket.type),
      Name: labelize(ticket.name),
      Requester: ticket.requesterName || "",
      "Requester Email": ticket.requesterEmail || "",
      Recipients: (ticket.recipients || []).join(", "),
      Subject: ticket.subject || "",
      Message: ticket.message || "",
      Status: labelize(ticket.status),
      Priority: labelize(ticket.priority),
      Created: ticket.createdAt
        ? new Date(ticket.createdAt).toLocaleString()
        : "",
      Resolved: ticket.resolvedAt
        ? new Date(ticket.resolvedAt).toLocaleString()
        : "",
    }));

  const reportName = `support-tickets-report-${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  const monthLabel = selectedMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const rows = exportRows();
    const summaryRows = [
      {
        Metric: "Month",
        Value: monthLabel,
      },
      { Metric: "Total support tickets", Value: summary.total },
      { Metric: "Open / in progress", Value: summary.open },
      { Metric: "Resolved / closed", Value: summary.resolved },
      { Metric: "P1 support tickets", Value: summary.urgent },
      { Metric: "Resolution rate", Value: `${summary.resolutionRate}%` },
      { Metric: "Average resolution hours", Value: summary.averageResolution },
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      "Summary",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Tickets",
    );
    XLSX.writeFile(workbook, `${reportName}.xlsx`);
  };

  const exportCsv = () => {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportRows()));
    downloadBlob(csv, "text/csv;charset=utf-8", `${reportName}.csv`);
  };

  const exportJson = () => {
    downloadBlob(
      JSON.stringify(
        { month: selectedMonth.toISOString(), summary, tickets: exportRows() },
        null,
        2,
      ),
      "application/json",
      `${reportName}.json`,
    );
  };

  const reportMenuItems = [
    {
      label: "Export Excel",
      icon: "pi pi-file-excel",
      command: exportExcel,
      disabled: !reportTickets.length,
    },
    {
      label: "Export CSV",
      icon: "pi pi-download",
      command: exportCsv,
      disabled: !reportTickets.length,
    },
    {
      label: "Export JSON",
      icon: "pi pi-code",
      command: exportJson,
      disabled: !reportTickets.length,
    },
    {
      label: "Print / PDF",
      icon: "pi pi-print",
      command: () => window.print(),
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  const statusTemplate = (ticket) => (
    <Tag
      value={labelize(ticket.status)}
      severity={
        ticket.status === "open"
          ? "warning"
          : ticket.status === "resolved"
            ? "success"
            : "info"
      }
    />
  );

  const priorityTemplate = (ticket) => (
    <Tag
      value={labelize(ticket.priority)}
      severity={
        ticket.priority === "P1"
          ? "danger"
          : ticket.priority === "P2"
            ? "warning"
            : "info"
      }
    />
  );

  const statCards = [
    {
      label: "Total support tickets",
      value: summary.total,
      icon: "pi-ticket",
      color: "text-blue-500",
    },
    {
      label: "Open / active",
      value: summary.open,
      icon: "pi-inbox",
      color: "text-orange-500",
    },
    {
      label: "Resolved / closed",
      value: summary.resolved,
      icon: "pi-check-circle",
      color: "text-green-500",
    },
    {
      label: "P1 support tickets",
      value: summary.urgent,
      icon: "pi-exclamation-triangle",
      color: "text-red-500",
    },
    {
      label: "Resolution rate",
      value: `${summary.resolutionRate}%`,
      icon: "pi-chart-line",
      color: "text-purple-500",
    },
    {
      label: "Avg. resolution",
      value:
        summary.averageResolution === "-"
          ? "-"
          : `${summary.averageResolution}h`,
      icon: "pi-clock",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="surface-ground min-h-screen p-4 ticket-report-page">
      <style>{`
        .ticket-print-only { display: none; }

        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          .ticket-print-area, .ticket-print-area * { visibility: visible !important; }
          .ticket-print-area {
            position: absolute;
            inset: 0;
            width: 100%;
            padding: 0;
            background: #fff;
            color: #000;
          }
          .no-print, .ticket-screen-table { display: none !important; }
          .ticket-print-only { display: block !important; }
          .ticket-print-area .p-card {
            box-shadow: none !important;
            border: 1px solid #ddd;
          }
          .ticket-print-area .p-card-content { padding: 0.75rem; }
          .ticket-print-area canvas { max-height: 220px !important; }
          .ticket-print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .ticket-print-table th, .ticket-print-table td {
            border: 1px solid #bbb;
            padding: 5px;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }
          .ticket-print-table th { background: #eee !important; }
          .ticket-print-section { break-before: page; }
          .ticket-chart-card { break-inside: avoid; }
        }
      `}</style>
      {!hideHeader && <h2 className="mb-4">Support Tickets Report</h2>}

      <Card className="mb-4 shadow-1 ticket-dashboard-section">
        <div className="flex flex-wrap align-items-end gap-3">
          <div>
            <label className="block font-semibold mb-2" htmlFor="reportMonth">
              Report month
            </label>
            <Calendar
              inputId="reportMonth"
              value={selectedMonth}
              onChange={(event) => event.value && setSelectedMonth(event.value)}
              view="month"
              dateFormat="MM yy"
              maxDate={new Date()}
              showIcon
            />
          </div>
          <div className="text-600 pb-2">
            {range.from.toLocaleDateString()} - {range.to.toLocaleDateString()}
          </div>
        </div>
      </Card>

      <div className="ticket-print-area">
        <div className="ticket-print-only mb-3">
          <h1 className="mb-1">Support Tickets Report</h1>
          <div>
            {monthLabel} ({range.from.toLocaleDateString()} -{" "}
            {range.to.toLocaleDateString()})
          </div>
          <small>Generated {new Date().toLocaleString()}</small>
        </div>

        <div className="ticket-dashboard-section">
          <div className="grid">
            {statCards.map((stat) => (
              <div className="col-12 sm:col-6 lg:col" key={stat.label}>
                <Card className="h-full shadow-1">
                  <div className="flex justify-content-between align-items-center">
                    <div>
                      <div className="text-600 mb-2">{stat.label}</div>
                      <div className="text-3xl font-bold">{stat.value}</div>
                    </div>
                    <i className={`pi ${stat.icon} ${stat.color} text-3xl`} />
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="grid mt-1">
            <div className="col-12 lg:col-6">
              <Card
                title="Daily ticket volume"
                className="h-full shadow-1 ticket-chart-card"
              >
                <div style={{ height: 300 }}>
                  <Chart type="line" data={dailyChart} options={chartOptions} />
                </div>
              </Card>
            </div>
            <div className="col-12 lg:col-6">
              <Card
                title="Support tickets by type"
                className="h-full shadow-1 ticket-chart-card"
              >
                <div style={{ height: 300 }}>
                  <Chart
                    type="doughnut"
                    data={chartFor("type", TYPE_COLORS)}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </div>
            <div className="col-12 lg:col-6">
              <Card
                title="Support tickets by status"
                className="h-full shadow-1 ticket-chart-card"
              >
                <div style={{ height: 300 }}>
                  <Chart
                    type="bar"
                    data={chartFor("status", STATUS_COLORS)}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </div>
            <div className="col-12 lg:col-6">
              <Card
                title="Support tickets by priority"
                className="h-full shadow-1 ticket-chart-card"
              >
                <div style={{ height: 300 }}>
                  <Chart
                    type="pie"
                    data={chartFor("priority", PRIORITY_COLORS)}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <Card
          title={
            <div className="flex align-items-center">
              <span>Support Tickets</span>
              <SplitButton
                model={reportMenuItems}
                dropdownIcon="pi pi-ellipsis-h"
                buttonClassName="hidden"
                menuButtonClassName="ml-1 p-button-text"
                aria-label="Support tickets table options"
              />
            </div>
          }
          className="mt-3 shadow-1 ticket-screen-table"
        >
          <div className="flex justify-content-end mb-3 no-print">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search report"
              />
            </span>
          </div>
          <DataTable
            value={reportTickets}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
            stripedRows
            rowHover
            globalFilter={globalFilter}
            globalFilterFields={[
              "type",
              "name",
              "requesterName",
              "requesterEmail",
              "subject",
              "message",
              "status",
              "priority",
            ]}
            emptyMessage="No support tickets were created in this month."
          >
            <Column
              field="name"
              header="Name"
              body={(row) => labelize(row.name)}
              sortable
            />
            <Column
              field="type"
              header="Type"
              body={(row) => labelize(row.type)}
              sortable
            />
            <Column field="requesterName" header="Requester Name" sortable />
            <Column field="requesterEmail" header="Requester Email" sortable />
            <Column field="subject" header="Subject" sortable />
            <Column field="message" header="Message" />
            <Column
              field="status"
              header="Status"
              body={statusTemplate}
              sortable
            />
            <Column
              field="priority"
              header="Priority"
              body={priorityTemplate}
              sortable
            />
            <Column
              field="createdAt"
              header="Created"
              body={(row) => new Date(row.createdAt).toLocaleString()}
              sortable
            />
            <Column
              field="resolvedAt"
              header="Resolved"
              body={(row) =>
                row.resolvedAt ? new Date(row.resolvedAt).toLocaleString() : "-"
              }
              sortable
            />
          </DataTable>
        </Card>

        <section className="ticket-print-only ticket-print-section">
          <h2>Support Ticket Details</h2>
          <table className="ticket-print-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Requester</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {reportTickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td>{labelize(ticket.type)}</td>
                  <td>{labelize(ticket.name)}</td>
                  <td>
                    {ticket.requesterName || ticket.requesterEmail || "-"}
                  </td>
                  <td>{ticket.subject || "-"}</td>
                  <td>{labelize(ticket.status)}</td>
                  <td>{labelize(ticket.priority)}</td>
                  <td>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {ticket.resolvedAt
                      ? new Date(ticket.resolvedAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {!reportTickets.length && (
                <tr>
                  <td colSpan="8">
                    No support tickets were created in this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),
});

export default connect(null, mapDispatch)(TicketsReportPage);
