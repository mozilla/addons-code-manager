import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import { actions as commentsActions } from '../src/reducers/comments';
import CommentSummaryButton from '../src/components/CommentSummaryButton';
import {
  createStoreWithVersionComments,
  createFakeExternalComment,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';
import {
  createOneLineComment,
  createVeryLongComments,
} from './CommentSummary.stories';

const setUpStore = ({ comments = [createFakeExternalComment()] } = {}) => {
  const store = createStoreWithVersionComments({ comments });
  store.dispatch(commentsActions.showSummaryOverlay());

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

storiesOf('CommentSummaryButton', module)
  .add('one line comment', () => {
    return render({ store: setUpStore({ comments: createOneLineComment() }) });
  })
  .add('very long comments', () => {
    return render({
      store: setUpStore({ comments: createVeryLongComments() }),
    });
  });
