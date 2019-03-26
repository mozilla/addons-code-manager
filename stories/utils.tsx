import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from '../src/configureStore';

export const renderWithStoreAndRouter = (
  element: JSX.Element,
  store = configureStore(),
) => {
  return (
    <Provider store={store}>
      <MemoryRouter>{element}</MemoryRouter>
    </Provider>
  );
};

let _uid = 0;

/*
 * Returns a unique UID for a linter message.
 *
 * This is only needed in story book where linter messages do not already
 * have unique UIDs.
 */
export const newLinterMessageUID = () => {
  _uid++;
  return `msg-${_uid}`;
};
