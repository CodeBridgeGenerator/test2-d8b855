import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "../../common/InputTextarea";
import { getSchemaValidationErrorsStrings } from "../../../utils";
import client from "../../../services/restClient";

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const priorityOptions = [
  { label: "P1", value: "P1" },
  { label: "P2", value: "P2" },
  { label: "P3", value: "P3" },
  { label: "P4", value: "P4" },
];

const typeOptions = [
  { label: "L1", value: "L1" },
  { label: "L2", value: "L2" },
];

const TicketsEditDialogComponent = (props) => {
  const [entity, setEntity] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEntity(props.entity || {});
    setError("");
  }, [props.entity, props.show]);

  const setValue = (key, value) => {
    setEntity((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const onSave = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await client.service("supportTickets").patch(entity._id, {
        type: entity.type,
        status: entity.status,
        priority: entity.priority,
      });
      props.onHide();
      props.onEditResult(result);
      props.alert({
        type: "success",
        title: "Edit ticket",
        message: "Ticket updated successfully",
      });
    } catch (saveError) {
      setError(
        getSchemaValidationErrorsStrings(saveError) ||
          "Failed to update ticket",
      );
      props.alert({
        type: "error",
        title: "Edit ticket",
        message: "Failed to update ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFooter = () => (
    <div className="flex justify-content-end">
      <Button
        label="Save"
        className="p-button-text no-focus-effect"
        onClick={onSave}
        loading={loading}
        disabled={!entity?._id}
      />
      <Button
        label="Close"
        className="p-button-text no-focus-effect p-button-secondary"
        onClick={props.onHide}
        disabled={loading}
      />
    </div>
  );

  return (
    <Dialog
      header="Edit Support Ticket"
      visible={props.show}
      closable={false}
      onHide={props.onHide}
      modal
      style={{ width: "40vw" }}
      className="min-w-max zoomin animation-duration-400"
      footer={renderFooter()}
      resizable={false}
    >
      <div
        className="grid p-fluid overflow-y-auto"
        style={{ maxWidth: "55vw" }}
        role="tickets-edit-dialog-component"
      >
        {error && <small className="p-error col-12">{error}</small>}
        <div className="col-12 md:col-6 field">
          <label htmlFor="requesterEmail">Requester:</label>
          <InputText
            id="requesterEmail"
            value={entity.requesterEmail || ""}
            disabled
          />
        </div>
        <div className="col-12 md:col-6 field">
          <label htmlFor="subject">Subject:</label>
          <InputText id="subject" value={entity.subject || ""} disabled />
        </div>
        <div className="col-12 field">
          <label htmlFor="message">Message:</label>
          <InputTextarea
            id="message"
            value={entity.message || ""}
            rows={5}
            autoResize
            disabled
          />
        </div>
        <div className="col-12 md:col-6 field">
          <label htmlFor="type">Type:</label>
          <Dropdown
            id="type"
            value={entity.type}
            options={typeOptions}
            onChange={(event) => setValue("type", event.value)}
            placeholder="Select ticket type"
          />
        </div>
        <div className="col-12 md:col-6 field">
          <label htmlFor="status">Status:</label>
          <Dropdown
            id="status"
            value={entity.status}
            options={statusOptions}
            onChange={(event) => setValue("status", event.value)}
            placeholder="Select status"
          />
        </div>
        <div className="col-12 md:col-6 field">
          <label htmlFor="priority">Priority:</label>
          <Dropdown
            id="priority"
            value={entity.priority}
            options={priorityOptions}
            onChange={(event) => setValue("priority", event.value)}
            placeholder="Select priority"
          />
        </div>
      </div>
    </Dialog>
  );
};

const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),
});

export default connect(null, mapDispatch)(TicketsEditDialogComponent);
