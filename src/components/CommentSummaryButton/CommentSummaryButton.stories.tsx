import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import { actions as popoverActions } from '../../reducers/popover';
import {
  createStoreWithVersionComments,
  createFakeExternalComment,
} from '../../test-helpers';
import {
  createOneLineComment,
  createVeryLongComments,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import CommentSummaryButton from '.';

const setUpStore = ({ comments = [createFakeExternalComment()] } = {}) => {
  const store = createStoreWithVersionComments({ comments });
  store.dispatch(popoverActions.show('COMMENTS_SUMMARY'));

  return store;
};

const render = ({ store = setUpStore() }: { store?: Store } = {}) => {
  return renderWithStoreAndRouter(
    <div>
      <CommentSummaryButton />
    </div>,
    { store },
  );
};

export default {
  title: 'Components/CommentSummaryButton',
  component: CommentSummaryButton,
} as Meta;

export const OneLineComment = () => {
  return render({ store: setUpStore({ comments: createOneLineComment() }) });
};

export const VeryLongComments = () => {
  return render({
    store: setUpStore({ comments: createVeryLongComments() }),
  });
};
