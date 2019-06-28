import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Navbar from '../src/components/Navbar';
import configureStore from '../src/configureStore';
import { actions as userActions } from '../src/reducers/users';
import { fakeUser } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

storiesOf('Navbar', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'user is not signed in',
          sectionFn: () => renderWithStoreAndRouter(<Navbar />),
        },
        {
          title: 'user is signed in',
          sectionFn: () => {
            const store = configureStore();
            store.dispatch(userActions.loadCurrentUser({ user: fakeUser }));

            return renderWithStoreAndRouter(<Navbar />, { store });
          },
        },
      ],
    },
  ],
});
