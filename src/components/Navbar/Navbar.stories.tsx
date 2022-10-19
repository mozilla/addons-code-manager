import React, { useEffect } from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import { actions as userActions } from '../../reducers/users';
import { actions as versionsActions } from '../../reducers/versions';
import {
  createFakeExternalComment,
  createStoreWithVersion,
  createStoreWithVersionComments,
  dispatchLoadVersionInfo,
  fakeUser,
  fakeVersionWithContent,
  fakeVersionAddon,
  nextUniqueId,
} from '../../test-helpers';
import { renderWithStoreAndRouter } from '../../storybook-utils';

import Navbar, { NavbarBase, PublicProps } from '.';

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

export default {
  title: 'Components/Navbar',
  component: NavbarBase,
} as Meta;

export const UserIsNotSignedIn = () => render();

export const UserIsSignedIn = () => {
  const store = configureStore();
  store.dispatch(userActions.loadCurrentUser({ user: fakeUser }));

  return render({ store });
};

export const WithCurrentVersion = () => {
  const version = {
    ...fakeVersionWithContent,
    addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
  };
  const store = createStoreWithVersion({ version, makeCurrent: true });

  return render({ store });
};

export const WithBaseVersionAndCurrentVersion = () => {
  const version = {
    ...fakeVersionWithContent,
    id: nextUniqueId(),
    version: '2.0',
    addon: { ...fakeVersionAddon, name: { 'en-US': 'uBlock Origin' } },
  };
  const store = createStoreWithVersion({ version, makeCurrent: true });
  dispatchBaseVersion({ store, versionString: '1.0' });

  return render({ store });
};

export const WithNewBaseVersionLoading = () => {
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
};

export const UserHasEnteredComments = () => {
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
};
