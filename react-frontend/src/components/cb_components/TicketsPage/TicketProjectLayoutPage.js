import React, { useState } from "react";
import { connect } from "react-redux";
import { Button } from "primereact/button";
import { useLocation } from "react-router-dom";
import ProjectLayout from "../../Layouts/ProjectLayout";
import TicketsPage from "./TicketsPage";
import TicketsReportPage from "./TicketsReportPage";

const TicketProjectLayoutPage = () => {
  const location = useLocation();
  const [showReport, setShowReport] = useState(
    location.pathname.endsWith("/report"),
  );

  return (
    <ProjectLayout>
      <div className="p-2 md:p-4">
        <div className="mb-2 flex justify-content-between align-items-center">
          <span className="text-900 font-medium text-3xl">
            {showReport ? "Support Tickets Report" : "Support Tickets"}
          </span>
          <Button
            icon={showReport ? "pi pi-angle-up" : "pi pi-angle-down"}
            className="p-button-text p-button-plain"
            onClick={() => setShowReport((current) => !current)}
            aria-label={
              showReport
                ? "Show support tickets"
                : "Show support tickets report"
            }
            tooltip={showReport ? "Show support tickets" : "Show report"}
          />
        </div>

        {showReport ? (
          <TicketsReportPage hideHeader />
        ) : (
          <TicketsPage hideHeader />
        )}
      </div>
    </ProjectLayout>
  );
};

export default connect()(TicketProjectLayoutPage);
