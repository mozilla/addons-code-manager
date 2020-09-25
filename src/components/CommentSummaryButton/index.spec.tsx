import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Store } from 'redux';

import CommentSummary from '../CommentSummary';
import configureStore from '../../configureStore';
import { actions as popoverActions } from '../../reducers/popover';
import { createInternalComment } from '../../reducers/comments';
import {
  createFakeExternalComment,
  createStoreWithVersionComments,
  shallowUntilTarget,
  spyOn,
  simulatePopover,
} from '../../test-helpers';

import CommentSummaryButton, { CommentSummaryButtonBase, PublicProps } from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> & { store?: Store };

  const render = ({
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    return shallowUntilTarget(
      <CommentSummaryButton {...moreProps} />,
      CommentSummaryButtonBase,
      {
        shallowOptions: { context: { store } },
      },
    );
  };

  const renderCommentSummary = ({
    store = createStoreWithVersionComments(),
    ...props
  }: Partial<RenderParams> = {}) => {
    const root = render({ store, ...props });
    const { content, ...result } = simulatePopover(root);
    return { summary: content, ...result };
  };

  it('configures CommentSummary', () => {
    const comments = [
      createFakeExternalComment({ comment: 'first' }),
      createFakeExternalComment({ comment: 'second' }),
    ];
    const store = createStoreWithVersionComments({ comments });

    const { summary } = renderCommentSummary({ store });
    expect(summary.find(CommentSummary)).toHaveProp(
      'comments',
      comments.map((c) => createInternalComment(c)),
    );
  });

  it('lets you close the comment summary', () => {
    const store = createStoreWithVersionComments();
    const dispatchSpy = spyOn(store, 'dispatch');
    const { popover, summary } = renderCommentSummary({ store });

    summary.find(Button).simulate('click');

    expect(dispatchSpy).toHaveBeenCalledWith(
      popoverActions.hide(popover.prop('id')),
    );
  });

  it('renders an empty CommentSummary without comments', () => {
    const store = configureStore();

    const { summary } = renderCommentSummary({ store });
    expect(summary.find(CommentSummary)).toHaveProp('comments', []);
  });
});
