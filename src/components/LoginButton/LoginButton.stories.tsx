import React from 'react';
import { Meta } from '@storybook/react';

import { renderWithStoreAndRouter } from '../../storybook-utils';

import LoginButton, { LoginButtonBase } from '.';

export default {
  title: 'Components/LoginButton',
  component: LoginButtonBase,
} as Meta;

export const Default = () => renderWithStoreAndRouter(<LoginButton />);
