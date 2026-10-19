import React from "react";
import { render, screen } from "@testing-library/react";

import ClassroomsPage from "../ClassroomsPage";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../../models";

test("renders classrooms page", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ClassroomsPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("classrooms-datatable")).toBeInTheDocument();
    expect(screen.getByRole("classrooms-add-button")).toBeInTheDocument();
});
