import * as React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from '../src/configureStore';

export const renderWithStoreAndRouter = (
  element: JSX.Element,
  store = configureStore(),
) => {
  return (
    <Provider store={store}>
      <Router>{element}</Router>
    </Provider>
  );
};
