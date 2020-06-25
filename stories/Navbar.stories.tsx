import React, { useEffect } from 'react';
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
  dispatchLoadVersionInfo,
  fakeUser,
  fakeVersionWithContent,
  fakeVersionAddon,
  nextUniqueId,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  afterMount,
  store = configureStore(),
  ...props
}: Partial<PublicProps> & { afterMount?: () => void; store?: Store } = {}) => {
  const Shell = () => {
    useEffect(() => {
      if (afterMount) {
        afterMount();
      }
    }, [afterMount]);

    return <Navbar {...props} />;
  };
  return renderWithStoreAndRouter(<Shell />, { store });
};

const dispatchBaseVersion = ({
  id = nextUniqueId(),
  store,
  versionString = '1.0',
}: {
  id?: number;
  store: Store;
  versionString?: string;
}) => {
  const baseVersion = { ...fakeVersionWithContent, id, version: versionString };
  dispatchLoadVersionInfo({ store, version: baseVersion });
  store.dispatch(
    versionsActions.setCurrentBaseVersionId({ versionId: baseVersion.id }),
  );
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
      ...fakeVersionWithContent,
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });
    return render({ store });
  })
  .add('with base version, current version', () => {
    const version = {
      ...fakeVersionWithContent,
      id: nextUniqueId(),
      version: '2.0',
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });
    dispatchBaseVersion({ store, versionString: '1.0' });

    return render({ store });
  })
  .add('with new base version loading', () => {
    const version = {
      ...fakeVersionWithContent,
      version: '2.0',
      addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
    };
    const store = createStoreWithVersion({ version, makeCurrent: true });
    dispatchBaseVersion({ store, versionString: '1.0' });

    return render({
      afterMount: () => {
        // Set a different base version ID to enter a loading state.
        store.dispatch(
          versionsActions.setCurrentBaseVersionId({
            versionId: nextUniqueId(),
          }),
        );
      },
      store,
    });
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
