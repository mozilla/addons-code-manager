import * as React from 'react';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import { actions as popoverActions } from '../../reducers/popover';
import { ExternalVersionsList, actions } from '../../reducers/versions';
import { fakeVersionsListItem } from '../../test-helpers';
import { renderWithStoreAndRouter } from '../../storybook-utils';

import VersionChooser from '.';

const render = ({
  addonId = 124,
  baseVersionId = 1,
  headVersionId = 1,
  store = configureStore(),
} = {}) => {
  store.dispatch(actions.setCurrentBaseVersionId({ versionId: baseVersionId }));
  store.dispatch(actions.setCurrentVersionId({ versionId: headVersionId }));
  store.dispatch(popoverActions.show('COMPARE_VERSIONS'));

  return renderWithStoreAndRouter(<VersionChooser addonId={addonId} />, {
    store,
  });
};

const listedVersions: ExternalVersionsList = [
  {
    ...fakeVersionsListItem,
    id: 100,
    channel: 'listed',
    version: '1.0.0',
  },
  {
    ...fakeVersionsListItem,
    id: 110,
    channel: 'listed',
    version: '1.1.0',
  },
  {
    ...fakeVersionsListItem,
    id: 120,
    channel: 'listed',
    version: '1.2.0',
  },
];

export default {
  title: 'Components/VersionChooser',
  component: VersionChooser,
} as Meta;

export const LoadingState = () => render();

export const WithListedAndUnlistedVersions = () => {
  const addonId = 124;
  const versions: ExternalVersionsList = [
    ...listedVersions,
    {
      ...fakeVersionsListItem,
      id: 130,
      channel: 'unlisted',
      version: '1.3.0',
    },
  ];
  const store = configureStore();
  store.dispatch(actions.loadVersionsList({ addonId, versions }));

  return render({
    addonId,
    baseVersionId: versions[0].id,
    headVersionId: versions[2].id,
    store,
  });
};

export const WithSomeNewVersionsDisabled = () => {
  const addonId = 124;
  const versions = listedVersions;
  const store = configureStore();
  store.dispatch(actions.loadVersionsList({ addonId, versions }));

  return render({
    addonId,
    baseVersionId: versions[1].id,
    headVersionId: versions[2].id,
    store,
  });
};
