import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import PopoverButton, { PublicProps } from '../src/components/PopoverButton';
import { loremIpsum } from './utils';

const render = (moreProps: Partial<PublicProps> = {}) => {
  const props = {
    onOpen: () => {},
    onHide: () => {},
    content: <div className="PopoverButton-content">{loremIpsum}</div>,
    prompt: 'Open',
    showPopover: true,
    ...moreProps,
  };
  return <PopoverButton {...props} />;
};

storiesOf('PopoverButton', module).add('example', () => {
  return render();
});
