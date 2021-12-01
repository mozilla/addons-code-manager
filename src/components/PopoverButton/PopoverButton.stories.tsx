import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import { actions as popoverActions } from '../../reducers/popover';
import { loremIpsum, renderWithStoreAndRouter } from '../../storybook-utils';
import configureStore from '../../configureStore';

import PopoverButton, { PublicProps, PopoverButtonBase } from '.';

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

export default {
  title: 'Components/PopoverButton',
  component: PopoverButtonBase,
} as Meta;

export const Default = () => render();
