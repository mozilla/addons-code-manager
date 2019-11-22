import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import Navbar, { PublicProps } from '../src/components/Navbar';
import configureStore from '../src/configureStore';
import { actions as userActions } from '../src/reducers/users';
import { actions as versionsActions } from '../src/reducers/versions';
import {
  createFakeExternalComment,
  createStoreWithVersion,
  createStoreWithVersionComments,
  fakeUser,
  fakeVersion,
  fakeVersionAddon,
  nextUniqueId,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  store = configureStore(),
  ...props
}: Partial<PublicProps> & { store?: Store } = {}) => {
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
  .add('with base version, current version', () => {
    const version = {
      ...fakeVersion,
      id: nextUniqueId(),
      version: '2.0',
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });

    const baseVersion = { ...fakeVersion, id: nextUniqueId(), version: '1.0' };
    store.dispatch(versionsActions.loadVersionInfo({ version: baseVersion }));
    store.dispatch(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersion.id }),
    );
    return render({ store });
  })
  .add('with new base version loading', () => {
    const version = {
      ...fakeVersion,
      version: '2.0',
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });
    return render({ store, _nextBaseVersionImprint: '1.0' });
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
