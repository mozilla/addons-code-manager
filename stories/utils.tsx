import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from '../src/configureStore';

type Options = {
  url?: string;
};

export const renderWithStoreAndRouter = (
  element: JSX.Element,
  store = configureStore(),
  options: Options = {},
) => {
  const initialEntries = options.url ? [options.url] : undefined;

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{element}</MemoryRouter>
    </Provider>
  );
};
