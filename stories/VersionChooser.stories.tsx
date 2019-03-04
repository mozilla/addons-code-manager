import * as React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import VersionChooser from '../src/components/VersionChooser';
import { actions } from '../src/reducers/versions';
import { fakeVersionsList } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

storiesOf('VersionChooser', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'with lists of versions loaded',
          sectionFn: () => {
            const addonId = 124;

            const store = configureStore();
            store.dispatch(
              actions.loadVersionsList({ addonId, versions: fakeVersionsList }),
            );

            return renderWithStoreAndRouter(
              <VersionChooser addonId={addonId} />,
              store,
            );
          },
        },
        {
          title: 'loading state',
          sectionFn: () => {
            const addonId = 124;
            const store = configureStore();

            return renderWithStoreAndRouter(
              <VersionChooser addonId={addonId} />,
              store,
            );
          },
        },
      ],
    },
  ],
});
