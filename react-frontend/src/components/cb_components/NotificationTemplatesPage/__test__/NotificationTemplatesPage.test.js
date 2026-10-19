import React from 'react';
import { render, screen } from '@testing-library/react';

import NotificationTemplatesPage from '../NotificationTemplatesPage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders notificationTemplates page', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <NotificationTemplatesPage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('notificationTemplates-datatable')).toBeInTheDocument();
    expect(screen.getByRole('notificationTemplates-add-button')).toBeInTheDocument();
});
