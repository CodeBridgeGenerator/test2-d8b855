import React from "react";
import { render, screen } from "@testing-library/react";

import ClassroomsEditDialogComponent from "../ClassroomsEditDialogComponent";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../models";

test("renders classrooms edit dialog", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ClassroomsEditDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("classrooms-edit-dialog-component")).toBeInTheDocument();
});
