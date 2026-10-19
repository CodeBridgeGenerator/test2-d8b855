import React from "react";
import { render, screen } from "@testing-library/react";

import CoursesPage from "../CoursesPage";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { init } from "@rematch/core";
import { Provider } from "react-redux";
import * as models from "../../../../models";

test("renders courses page", async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <CoursesPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole("courses-datatable")).toBeInTheDocument();
    expect(screen.getByRole("courses-add-button")).toBeInTheDocument();
});
