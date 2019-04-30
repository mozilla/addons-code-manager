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

/*
 * Returns storybook parameters to configure the storybook-addon-root-attribute add-on
 *
 * The only reason we're using this add-on is to toggle the class
 * of the body element. We're currently not using it to toggle between
 * different states.
 */
export const rootAttributeParams = ({ fullscreen = false } = {}) => {
  type Attribute = {
    name: string;
    value: string | null;
  };

  let defaultState: Attribute = {
    name: 'Body is not set to fullscreen',
    value: null,
  };

  if (fullscreen) {
    defaultState = { name: 'Body is set to fullscreen', value: 'fullscreen' };
  }

  return {
    rootAttribute: {
      root: 'body',
      attribute: 'class',
      defaultState,
      states: [],
    },
  };
};

export const loremIpsum = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`;

export const generateParagraphs = (
  count: number,
  { text = loremIpsum } = {},
) => {
  return (
    new Array(count)
      .fill(text)
      // eslint-disable-next-line react/no-array-index-key
      .map((p, i) => <p key={i}>{p}</p>)
  );
};
