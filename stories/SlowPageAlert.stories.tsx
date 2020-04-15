import * as React from 'react';
import { storiesOf } from '@storybook/react';

import SlowPageAlert, { PublicProps } from '../src/components/SlowPageAlert';
import { renderWithStoreAndRouter } from './utils';

const render = (otherProps: Partial<PublicProps> = {}) => {
  const props = {
    getMessage: () => 'This file has been shortened for performance.',
    getLinkText: () => 'Show the original file.',
    ...otherProps,
  };
  return renderWithStoreAndRouter(<SlowPageAlert {...props} />);
};

storiesOf('SlowPageAlert', module).add('default', () => {
  return render();
});
