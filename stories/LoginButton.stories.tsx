import React from 'react';
import { storiesOf } from '@storybook/react';

import LoginButton from '../src/components/LoginButton';
import { renderWithStoreAndRouter } from './utils';

storiesOf('LoginButton', module).add('default', () =>
  renderWithStoreAndRouter(<LoginButton />),
);
