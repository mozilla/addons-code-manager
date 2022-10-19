import React from 'react';
import { Meta } from '@storybook/react';

import Skeleton from '.';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
} as Meta;

export const InAParagraph = () => (
  <p>
    <Skeleton />
  </p>
);
