import React from 'react';
import { render, screen } from '@testing-library/react';

import FcmMessagePage from '../FcmMessagePage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import * as models from '../../../models';

test('renders fcmMessage page', async () => {
    const store = init({ models });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <FcmMessagePage />
            </MemoryRouter>
        </Provider>
    );
    expect(screen.getByRole('fcmMessage-datatable')).toBeInTheDocument();
    expect(screen.getByRole('fcmMessage-add-button')).toBeInTheDocument();
});
