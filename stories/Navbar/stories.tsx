import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Navbar from '../../src/components/Navbar';
import configureStore from '../../src/configureStore';
import { actions as userActions } from '../../src/reducers/users';
import {
  createFakeExternalComment,
  createStoreWithVersion,
  createStoreWithVersionComments,
  fakeUser,
  fakeVersion,
  fakeVersionAddon,
} from '../../src/test-helpers';
import { renderWithStoreAndRouter } from '../utils';

const render = ({ store = configureStore(), ...props } = {}) => {
  return renderWithStoreAndRouter(<Navbar {...props} />, { store });
};

storiesOf('Navbar', module)
  .add('user is not signed in', () => render())
  .add('user is signed in', () => {
    const store = configureStore();
    store.dispatch(userActions.loadCurrentUser({ user: fakeUser }));

    return render({ store });
  })
  .add('with current version', () => {
    const version = {
      ...fakeVersion,
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });
    return render({ store });
  })
  .add('user has entered comments', () => {
    const store = createStoreWithVersionComments({
      comments: [
        createFakeExternalComment({
          filename: 'manifest.json',
          lineno: 23,
          comment: 'This permission does not seem to be used anywhere. Is it?',
        }),
        createFakeExternalComment({
          filename: 'background.js',
          lineno: 344,
          comment: 'This call to eval() is forbidden.',
        }),
      ],
    });
    return render({ store });
  });
