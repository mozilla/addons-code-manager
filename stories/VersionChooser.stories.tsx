import * as React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import { VersionChooserWithoutRouter } from '../src/components/VersionChooser';
import { ExternalVersionsList, actions } from '../src/reducers/versions';
import { fakeVersionsListItem } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  addonId = 124,
  params = {},
  store = configureStore(),
} = {}) => {
  return renderWithStoreAndRouter(
    <VersionChooserWithoutRouter
      addonId={addonId}
      match={{
        params: {
          baseVersionId: '1',
          headVersionId: '1',
          lang: 'fr',
          ...params,
        },
      }}
    />,
    store,
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

storiesOf('VersionChooser', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'loading state',
          sectionFn: () => render(),
        },
        {
          title: 'with listed and unlisted versions',
          sectionFn: () => {
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
              store,
              params: {
                baseVersionId: String(versions[0].id),
                headVersionId: String(versions[2].id),
              },
            });
          },
        },
        {
          title: 'with some new versions disabled',
          sectionFn: () => {
            const addonId = 124;
            const versions = listedVersions;
            const store = configureStore();
            store.dispatch(actions.loadVersionsList({ addonId, versions }));

            return render({
              addonId,
              store,
              params: {
                baseVersionId: String(versions[1].id),
                headVersionId: String(versions[2].id),
              },
            });
          },
        },
      ],
    },
  ],
});
