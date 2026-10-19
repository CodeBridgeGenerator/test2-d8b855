import React from 'react';
import { render, screen } from '@testing-library/react';

import NotificationTemplatesCreateDialogComponent from '../NotificationTemplatesCreateDialogComponent';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders notificationTemplates create dialog', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <NotificationTemplatesCreateDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('notificationTemplates-create-dialog-component')).toBeInTheDocument();
});
