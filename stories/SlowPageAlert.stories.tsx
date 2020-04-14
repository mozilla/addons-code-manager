import * as React from 'react';
import { storiesOf } from '@storybook/react';

import SlowPageAlert, { PublicProps } from '../src/components/SlowPageAlert';
import { createFakeHistory, createFakeLocation } from '../src/test-helpers';

const render = (otherProps: Partial<PublicProps> = {}) => {
  const props = {
    history: createFakeHistory(),
    getMessage: () => 'This file has been shortened for performance.',
    getLinkText: () => 'Show the original file.',
    location: createFakeLocation(),
    ...otherProps,
  };
  return <SlowPageAlert {...props} />;
};

storiesOf('SlowPageAlert', module).add('default', () => {
  return render();
});
