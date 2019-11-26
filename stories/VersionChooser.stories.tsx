import * as React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import { actions as popoverActions } from '../src/reducers/popover';
import { VersionChooserWithoutRouter } from '../src/components/VersionChooser';
import { ExternalVersionsList, actions } from '../src/reducers/versions';
import { fakeVersionsListItem } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  addonId = 124,
  baseVersionId = 1,
  headVersionId = 1,
  store = configureStore(),
} = {}) => {
  store.dispatch(actions.setCurrentBaseVersionId({ versionId: baseVersionId }));
  store.dispatch(actions.setCurrentVersionId({ versionId: headVersionId }));
  store.dispatch(popoverActions.show('COMPARE_VERSIONS'));
  return renderWithStoreAndRouter(
    <VersionChooserWithoutRouter
      addonId={addonId}
      match={{
        isExact: true,
        path: 'some-path',
        url: 'some-url',
        params: { lang: 'fr' },
      }}
    />,
    { store },
  );
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

storiesOf('VersionChooser', module)
  .add('loading state', () => {
    return render();
  })
  .add('with listed and unlisted versions', () => {
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
  })
  .add('with some new versions disabled', () => {
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
  });
