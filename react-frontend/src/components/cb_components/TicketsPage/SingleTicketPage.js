import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import client from "../../../services/restClient";
import ProjectLayout from "../../Layouts/ProjectLayout";

const SingleTicketPage = (props) => {
  const navigate = useNavigate();
  const { singleTicketId } = useParams();
  const [request, setRequest] = useState({});

  useEffect(() => {
    client
      .service("supportTickets")
      .get(singleTicketId)
      .then(setRequest)
      .catch((error) =>
        props.alert({
          title: "Support Ticket",
          type: "error",
          message: error.message || "Failed to load ticket",
        }),
      );
  
  }, [singleTicketId]);

  return (
    <ProjectLayout>
      <div className="col-12 flex flex-column align-items-center">
        <div className="col-10">
          <div className="flex align-items-center">
            <Button
              className="p-button-text"
              icon="pi pi-chevron-left"
              onClick={() => navigate(-1)}
            />
            <h3 className="m-0">Support Ticket</h3>
          </div>
          <div className="card">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label>Requester</label>
                <p>{request.requesterEmail}</p>
              </div>
              <div className="col-12 md:col-6">
                <label>Subject</label>
                <p>{request.subject || "No subject"}</p>
              </div>
              <div className="col-12 md:col-6">
                <label>Type</label>
                <p>
                  <Tag value={request.type || "L1"} />
                </p>
              </div>
              <div className="col-12 md:col-6">
                <label>Status</label>
                <p>
                  <Tag value={request.status} />
                </p>
              </div>
              <div className="col-12 md:col-6">
                <label>Priority</label>
                <p>
                  <Tag value={request.priority} />
                </p>
              </div>
              <div className="col-12">
                <label>Message</label>
                <p className="white-space-pre-wrap">{request.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),
});

export default connect(null, mapDispatch)(SingleTicketPage);
