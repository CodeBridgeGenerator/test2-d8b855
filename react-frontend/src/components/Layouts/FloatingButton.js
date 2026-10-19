import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import "./FloatingButton.css";
import CustomerSupportIcon from "../../../src/assets/icons/Support.svg";
import client from "../../services/restClient";
import { connect } from "react-redux";

const ticketTypeOptions = [
  { label: "L1", value: "L1" },
  { label: "L2", value: "L2" },
];

const priorityOptions = [
  { label: "P1", value: "P1" },
  { label: "P2", value: "P2" },
  { label: "P3", value: "P3" },
  { label: "P4", value: "P4" },
];

function FloatingButton(props) {
  const [visible, setVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("L1");
  const [priority, setPriority] = useState("P3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSupportClick = () => {
    setVisible(true);
  };

  const handleSubmit = async () => {
    if (!message) {
      setError("Message is required.");
      return;
    }

    setLoading(true);
    setError("");

    const ticketSubject = subject
      ? `${subject} - ${props.user.email}`
      : `Support ticket (${type}/${priority}) - ${props.user.email}`;

    const ticket = {
      type,
      priority,
      name: `${type}_request`,
      requesterEmail: props.user.email,
      requesterName: props.user.name,
      recipients: ["support@cloudbasha.com"],
      subject,
      message,
    };

    try {
      const request = await client.service("supportTickets").create(ticket);
      const content = [
        `Support ticket from ${props.user.name || "User"} (${props.user.email})`,
        `Type: ${type}`,
        `Priority: ${priority}`,
        `Ticket ID: ${request?._id || "N/A"}`,
        "",
        message,
      ].join("\n");

      await client.service("mailQues").create({
        name: `${type}_request`,
        type,
        priority,
        from: props.user.email,
        recipients: ["support@cloudbasha.com"],
        status: true,
        subject: ticketSubject,
        content,
        data: {
          ticketId: request?._id,
          requesterName: props.user.name,
          requesterEmail: props.user.email,
          ticketType: type,
          priority,
          subject,
          message,
        },
      });
      setSubject("");
      setMessage("");
      setType("L1");
      setPriority("P3");
      setVisible(false);
    } catch (err) {
      setError("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="flex align-items-center justify-content-between">
      <span className="font-bold">New Message</span>
      <Button
        icon="pi pi-times"
        className="p-button-text p-button-plain p-button-sm"
        onClick={() => {
          setVisible(false);
          setMessage("");
          setSubject("");
          setType("L1");
          setPriority("P3");
          setError("");
        }}
        tooltip="Close"
        tooltipOptions={{ position: "bottom" }}
      />
    </div>
  );

  const renderFooter = () => (
    <div className="flex align-items-center" style={{ padding: "0.5rem" }}>
      <Button
        label="Send"
        icon="pi pi-send"
        onClick={handleSubmit}
        className="mr-2"
        disabled={loading}
      />
      <span className="flex-grow-1"></span>
      <Button
        type="button"
        icon="pi pi-trash"
        className="p-button-text p-button-plain p-button-danger"
        tooltip="Discard draft"
        tooltipOptions={{ position: "top" }}
        onClick={() => {
          setSubject("");
          setMessage("");
          setType("L1");
          setPriority("P3");
          setVisible(false);
        }}
      />
    </div>
  );

  if (!visible) {
    return (
      <Button
        className="custom-red-button"
        aria-label="Contact Support"
        onClick={handleSupportClick}
      >
        <img
          src={CustomerSupportIcon}
          alt="Customer Support"
          className="custom-support-icon"
        />
      </Button>
    );
  }

  return (
    <Dialog
      header={renderHeader()}
      visible={visible}
      className="custom-compose-dialog"
      style={{ width: "50vw" }}
      footer={renderFooter()}
      onHide={() => setVisible(false)}
      closable={false}
    >
      <div className="p-fluid">
        {error && <Message severity="error" text={error} className="mb-3" />}
        <div className="p-field">
          <Dropdown
            id="ticketType"
            value={type}
            options={ticketTypeOptions}
            onChange={(event) => setType(event.value)}
            placeholder="Select ticket type"
            aria-label="Ticket type"
          />
        </div>
        <div className="p-field">
          <Dropdown
            id="ticketPriority"
            value={priority}
            options={priorityOptions}
            onChange={(event) => setPriority(event.value)}
            placeholder="Select priority"
            aria-label="Ticket priority"
          />
        </div>
        <div className="p-field">
          <InputText
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        <div className="p-field">
          <InputTextarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            placeholder="Compose email"
            style={{ width: "100%", height: "100%" }}
            required
            autoResize
          />
        </div>
      </div>
    </Dialog>
  );
}

const mapState = (state) => {
  const { isLoggedIn, user } = state.auth;
  return { isLoggedIn, user };
};

export default connect(mapState)(FloatingButton);
