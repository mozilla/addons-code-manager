import { Location } from 'history';
import * as React from 'react';
import { storiesOf } from '@storybook/react';

import SlowPageAlert, { PublicProps } from '../../src/components/SlowPageAlert';
import { createFakeLocation } from '../../src/test-helpers';

const render = (otherProps: Partial<PublicProps> = {}) => {
  const props = {
    getMessage: (allowSlowPages: boolean) =>
      'This file has been shortened for performance.',
    getLinkText: (allowSlowPages: boolean) => 'Show the original file.',
    location: createFakeLocation(),
    ...otherProps,
  };
  return <SlowPageAlert {...props} />;
};

storiesOf('SlowPageAlert', module).add('default', () => {
  return render();
});
