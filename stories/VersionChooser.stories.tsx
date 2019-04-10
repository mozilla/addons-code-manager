import * as React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import { ConnectedVersionChooser } from '../src/components/VersionChooser';
import { actions } from '../src/reducers/versions';
import { fakeVersionsList } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  addonId = 124,
  params = {},
  store = configureStore(),
} = {}) => {
  return renderWithStoreAndRouter(
    <ConnectedVersionChooser addonId={addonId} match={{ params }} />,
    store,
  );
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

            return render({
              addonId,
              store,
              params: {
                baseVersionId: 1541786,
                headVersionId: 1541798,
              },
            });
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
