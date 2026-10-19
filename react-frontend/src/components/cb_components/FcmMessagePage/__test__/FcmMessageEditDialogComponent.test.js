import React from 'react';
import { render, screen } from '@testing-library/react';

import FcmMessageEditDialogComponent from '../FcmMessageEditDialogComponent';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders fcmMessage edit dialog', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <FcmMessageEditDialogComponent show={true} />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('fcmMessage-edit-dialog-component')).toBeInTheDocument();
});
