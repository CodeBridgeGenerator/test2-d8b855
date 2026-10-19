import React from "react";
import { render, screen } from "@testing-library/react";

import EnrollmentsCreateDialogComponent from "../EnrollmentsCreateDialogComponent";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../models";

test("renders enrollments create dialog", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <EnrollmentsCreateDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("enrollments-create-dialog-component")).toBeInTheDocument();
});
