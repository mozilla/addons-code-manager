import * as React from 'react';
import { Meta } from '@storybook/react';

import { renderWithStoreAndRouter } from '../../storybook-utils';

import SlowPageAlert, { PublicProps } from '.';

const render = (otherProps: Partial<PublicProps> = {}) => {
  const props = {
    getMessage: () => 'This file has been shortened for performance.',
    getLinkText: () => 'Show the original file.',
    ...otherProps,
  };
  return renderWithStoreAndRouter(<SlowPageAlert {...props} />);
};

export default {
  title: 'Components/SlowPageAlert',
  component: SlowPageAlert,
} as Meta;

export const Default = () => render();
