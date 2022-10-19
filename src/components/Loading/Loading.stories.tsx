import React from 'react';
import { Meta } from '@storybook/react';

import Loading from '.';

export default {
  title: 'Components/Loading',
  component: Loading,
} as Meta;

export function Default() {
  return <Loading message="Loading content..." />;
}
