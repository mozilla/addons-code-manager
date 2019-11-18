import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from 'react-bootstrap';
import { Store } from 'redux';

import CommentSummary from '../CommentSummary';
import PopoverButton from '../PopoverButton';
import configureStore from '../../configureStore';
import {
  actions as commentsActions,
  createInternalComment,
} from '../../reducers/comments';
import {
  createFakeExternalComment,
  createStoreWithVersionComments,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';

import CommentSummaryButton, {
  CommentSummaryButtonBase,
  DefaultProps,
  PublicProps,
} from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> &
    Partial<DefaultProps> & { store?: Store };

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
    const popover = root.find(PopoverButton);

    expect(popover).toHaveProp('content');
    const content = popover.prop('content');

    return shallow(<div>{content}</div>);
  };

  it('renders a button that opens an overlay', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const root = render({ store });

    const button = root.find(PopoverButton);
    expect(button).toHaveProp('onOpen');
    const onOpen = button.prop('onOpen');
    if (!onOpen) {
      throw new Error('onOpen was unexpectedly empty');
    }
    // Simulate how PopoverButton calls onOpen().
    onOpen();

    expect(dispatchSpy).toHaveBeenCalledWith(
      commentsActions.toggleSummaryOverlay(),
    );
  });

  it('dispatches an action when the overlay is hidden', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const root = render({ store });

    const popover = root.find(PopoverButton);

    expect(popover).toHaveProp('onHide');
    const onHide = popover.prop('onHide');
    if (!onHide) {
      throw new Error('onHide was unexpectedly empty');
    }
    // Simulate how PopoverButton calls onHide().
    onHide();

    expect(dispatchSpy).toHaveBeenCalledWith(
      commentsActions.hideSummaryOverlay(),
    );
  });

  it('renders a hidden overlay based on state', () => {
    const store = configureStore();
    store.dispatch(commentsActions.hideSummaryOverlay());
    const root = render({ store });

    const popover = root.find(PopoverButton);

    expect(popover).toHaveProp('showPopover', false);
  });

  it('renders a visible overlay based on state', () => {
    const store = configureStore();
    store.dispatch(commentsActions.showSummaryOverlay());
    const root = render({ store });

    const popover = root.find(PopoverButton);

    expect(popover).toHaveProp('showPopover', true);
  });

  it('configures CommentSummary', () => {
    const comments = [
      createFakeExternalComment({ comment: 'first' }),
      createFakeExternalComment({ comment: 'second' }),
    ];
    const store = createStoreWithVersionComments({ comments });

    const summary = renderCommentSummary({ store });
    expect(summary.find(CommentSummary)).toHaveProp(
      'comments',
      comments.map((c) => createInternalComment(c)),
    );
  });

  it('lets you close the comment summary', () => {
    const store = createStoreWithVersionComments();
    const dispatchSpy = spyOn(store, 'dispatch');
    const summary = renderCommentSummary({ store });

    summary.find(Button).simulate('click');

    expect(dispatchSpy).toHaveBeenCalledWith(
      commentsActions.hideSummaryOverlay(),
    );
  });

  it('renders an empty CommentSummary without comments', () => {
    const store = configureStore();

    const summary = renderCommentSummary({ store });
    expect(summary.find(CommentSummary)).toHaveProp('comments', []);
  });
});
