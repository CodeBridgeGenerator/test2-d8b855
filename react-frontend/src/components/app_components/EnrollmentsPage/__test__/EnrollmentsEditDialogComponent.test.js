import React from "react";
import { render, screen } from "@testing-library/react";

import EnrollmentsEditDialogComponent from "../EnrollmentsEditDialogComponent";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../models";

test("renders enrollments edit dialog", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <EnrollmentsEditDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("enrollments-edit-dialog-component")).toBeInTheDocument();
});
