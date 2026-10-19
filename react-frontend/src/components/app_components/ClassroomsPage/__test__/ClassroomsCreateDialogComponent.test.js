import React from "react";
import { render, screen } from "@testing-library/react";

import ClassroomsCreateDialogComponent from "../ClassroomsCreateDialogComponent";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../models";

test("renders classrooms create dialog", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ClassroomsCreateDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("classrooms-create-dialog-component")).toBeInTheDocument();
});
