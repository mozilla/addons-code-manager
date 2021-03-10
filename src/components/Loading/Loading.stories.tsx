import React from 'react';
import { Meta } from '@storybook/react';

import Loading from '.';

export default {
  title: 'Components/Loading',
  component: Loading,
} as Meta;

export const Default = () => <Loading message="Loading content..." />;
