import React from 'react';
import { Meta } from '@storybook/react';

import Skeleton from '.';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
} as Meta;

export function InAParagraph() {
  return (
    <p>
      <Skeleton />
    </p>
  );
}
