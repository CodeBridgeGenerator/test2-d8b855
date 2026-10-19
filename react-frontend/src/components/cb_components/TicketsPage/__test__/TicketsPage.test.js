import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";

import TicketsPage from "../TicketsPage";
import * as models from "../../../../models";

test("renders support tickets page", async () => {
  const store = init({ models });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByRole("tickets-datatable")).toBeInTheDocument();
  expect(screen.getByText("Support Tickets")).toBeInTheDocument();
});
