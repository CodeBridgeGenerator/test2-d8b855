import React from 'react';
import { render, screen } from '@testing-library/react';

import DocumentationDetailsPage from '../DocumentationDetailsPage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders documentationDetails page', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <DocumentationDetailsPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('documentationDetails-datatable')).toBeInTheDocument();
    expect(screen.getByRole('documentationDetails-add-button')).toBeInTheDocument();
});
