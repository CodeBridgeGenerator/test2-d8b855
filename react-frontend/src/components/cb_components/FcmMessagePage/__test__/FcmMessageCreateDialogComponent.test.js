import React from 'react';
import { render, screen } from '@testing-library/react';

import FcmMessageCreateDialogComponent from '../FcmMessageCreateDialogComponent';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders fcmMessage create dialog', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <FcmMessageCreateDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('fcmMessage-create-dialog-component')).toBeInTheDocument();
});
