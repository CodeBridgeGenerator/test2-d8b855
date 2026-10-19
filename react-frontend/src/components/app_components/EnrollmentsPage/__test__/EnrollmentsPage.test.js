import React from "react";
import { render, screen } from "@testing-library/react";

import EnrollmentsPage from "../EnrollmentsPage";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../../models";

test("renders enrollments page", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <EnrollmentsPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("enrollments-datatable")).toBeInTheDocument();
    expect(screen.getByRole("enrollments-add-button")).toBeInTheDocument();
});
