import React from 'react';
import { storiesOf } from '@storybook/react';

import LoginButton from '../components/LoginButton';

storiesOf('LoginButton', module).add('not logged in', () => <LoginButton />);
