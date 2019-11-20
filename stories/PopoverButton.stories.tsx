import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import { actions as popoverActions } from '../src/reducers/popover';
import PopoverButton, { PublicProps } from '../src/components/PopoverButton';
import { loremIpsum, renderWithStoreAndRouter } from './utils';
import configureStore from '../src/configureStore';

const render = ({
  id = 'COMMENTS_SUMMARY',
  store = configureStore(),
  ...moreProps
}: { store?: Store } & Partial<PublicProps> = {}) => {
  store.dispatch(popoverActions.show(id));
  const props = {
    content: <div className="PopoverButton-content">{loremIpsum}</div>,
    id,
    prompt: 'Open',
    ...moreProps,
  };
  return renderWithStoreAndRouter(<PopoverButton {...props} />, { store });
};

storiesOf('PopoverButton', module).add('example', () => {
  return render();
});
