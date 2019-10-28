import * as React from 'react';
import {
  Button,
  Overlay,
  OverlayChildrenParams,
  Popover,
} from 'react-bootstrap';
import { Store } from 'redux';

import CommentSummary from '../CommentSummary';
import configureStore from '../../configureStore';
import {
  actions as commentsActions,
  createInternalComment,
} from '../../reducers/comments';
import {
  createFakeExternalComment,
  createFakeRef,
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
    Partial<DefaultProps> & {
      disableLifecycleMethods?: boolean;
      store?: Store;
    };

  const render = ({
    createRef = createFakeRef,
    disableLifecycleMethods = false,
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    const props = { createRef, ...moreProps };
    return shallowUntilTarget(
      <CommentSummaryButton {...props} />,
      CommentSummaryButtonBase,
      {
        shallowOptions: { context: { store }, disableLifecycleMethods },
      },
    );
  };

  const renderPopover = ({
    arrowProps = { ref: createFakeRef(), style: {} },
    placement = 'bottom',
    ref = createFakeRef(),
    style = { left: 100, top: 200 },
    ...renderProps
  }: Partial<OverlayChildrenParams> & Partial<RenderParams> = {}) => {
    const root = render(renderProps);

    const overlay = root.find(Overlay);
    const renderChildren = overlay.renderProp('children');

    return renderChildren({ arrowProps, placement, ref, style });
  };

  const renderCommentSummary = ({
    store = createStoreWithVersionComments(),
    ...props
  }: Partial<RenderParams> = {}) => {
    const popover = renderPopover({ store, ...props });

    const content = popover.find(Popover.Content);
    expect(content).toHaveLength(1);

    return content;
  };

  it('renders a button that opens an overlay', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const root = render({ store });

    const button = root.find(Button);
    expect(button).toHaveLength(1);

    button.simulate('click');

    expect(dispatchSpy).toHaveBeenCalledWith(
      commentsActions.toggleSummaryOverlay(),
    );
  });

  it('waits for mount before rendering an overlay', () => {
    const root = render({ disableLifecycleMethods: true });

    expect(root.find(Overlay)).toHaveLength(0);
  });

  it('renders an overlay on mount', () => {
    const fakeRef = createFakeRef();
    const root = render({ createRef: () => fakeRef });

    const overlay = root.find(Overlay);
    expect(overlay).toHaveLength(1);
    expect(overlay).toHaveProp('target', fakeRef.current);
  });

  it('requires a button ref to render an overlay', () => {
    expect(() =>
      render({
        // Create a ref with `current` set to null.
        createRef: () => React.createRef(),
      }),
    ).toThrow(/unexpectedly empty/);
  });

  it('dispatches an action when the overlay is hidden', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const root = render({ store });

    const overlay = root.find(Overlay);

    expect(overlay).toHaveProp('onHide');
    const onHide = overlay.prop('onHide');
    if (!onHide) {
      throw new Error('onHide was unexpectedly empty');
    }
    // Simulate how Overlay calls onHide().
    onHide();

    expect(dispatchSpy).toHaveBeenCalledWith(
      commentsActions.hideSummaryOverlay(),
    );
  });

  it('renders a hidden overlay based on state', () => {
    const store = configureStore();
    store.dispatch(commentsActions.hideSummaryOverlay());
    const root = render({ store });

    const overlay = root.find(Overlay);

    expect(overlay).toHaveProp('show', false);
  });

  it('renders a visible overlay based on state', () => {
    const store = configureStore();
    store.dispatch(commentsActions.showSummaryOverlay());
    const root = render({ store });

    const overlay = root.find(Overlay);

    expect(overlay).toHaveProp('show', true);
  });

  it('configures a Popover', () => {
    const arrowProps = { ref: createFakeRef(), style: {} };
    const placement = 'bottom';
    const style = { left: 100, top: 200 };

    const popover = renderPopover({ arrowProps, placement, style });

    // Make sure the props from the Overlay children function are passed
    // to Popover.
    expect(popover).toHaveProp({ arrowProps, placement, style });
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
