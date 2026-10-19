import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import client from "../../../services/restClient";
import TicketsDataTable from "./TicketsDataTable";
import TicketsEditDialogComponent from "./TicketsEditDialogComponent";

const TicketsPage = (props) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadTickets = () => {
    setLoading(true);
    return client
      .service("supportTickets")
      .find({ query: { $limit: 10000, $sort: { createdAt: -1 } } })
      .then((response) => {
        const rows = Array.isArray(response)
          ? response
          : response?.data || [];
        setItems(rows);
      })
      .catch((error) =>
        props.alert({
          title: "Support Tickets",
          type: "error",
          message: error.message || "Failed to load support tickets",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();

  }, []);

  const onEditResult = (updatedTicket) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item._id === updatedTicket._id ? { ...item, ...updatedTicket } : item,
      ),
    );
  };

  return (
    <div className="mt-5">
      {!props.hideHeader && (
        <div className="grid">
          <div className="col-12">
            <div className="flex justify-content-between align-items-center mx-2">
              <h4 className="mb-0">
                <small>Admin / </small>
                <strong>Support Tickets</strong>
              </h4>
            </div>
          </div>
        </div>
      )}
      <div className="grid align-items-center">
        <div className="col-12" role="tickets-datatable">
          <TicketsDataTable
            items={items}
            loading={loading}
            onRowClick={({ data }) => navigate(`/supportTickets/${data._id}`)}
            onEditRow={(ticket) => {
              setSelectedTicket(ticket);
              setShowEditDialog(true);
            }}
          />
        </div>
      </div>
      <TicketsEditDialogComponent
        entity={selectedTicket}
        show={showEditDialog}
        onHide={() => setShowEditDialog(false)}
        onEditResult={onEditResult}
      />
    </div>
  );
};

const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),
});

export default connect(null, mapDispatch)(TicketsPage);
