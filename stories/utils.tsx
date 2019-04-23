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

export const rootAttributeParams = ({ fullscreenByDefault = false } = {}) => {
  type Attribute = {
    name: string;
    value: string | null;
  };

  const fullscreen: Attribute = { name: 'Fullscreen', value: 'fullscreen' };
  const normal: Attribute = { name: 'Normal', value: null };

  let defaultState = { ...normal, name: 'Normal (Default)' };

  if (fullscreenByDefault) {
    // The storybook-addon-root-attribute module requires unique
    // defaultState values for some odd reason.
    defaultState = { ...fullscreen, name: 'Fullscreen (Default)' };
  }

  return {
    rootAttribute: {
      root: 'body',
      attribute: 'class',
      defaultState,
      states: [fullscreen, normal],
    },
  };
};
