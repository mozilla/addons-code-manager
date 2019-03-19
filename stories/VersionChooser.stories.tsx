import * as React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import VersionChooser from '../src/components/VersionChooser';
import { actions } from '../src/reducers/versions';
import { fakeVersionsList } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({ addonId = 124, store = configureStore() } = {}) => {
  return renderWithStoreAndRouter(<VersionChooser addonId={addonId} />, store);
};

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

            return render({ addonId, store });
          },
        },
        {
          title: 'loading state',
          sectionFn: () => render(),
        },
      ],
    },
  ],
});
