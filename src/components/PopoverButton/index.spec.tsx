import * as React from 'react';
import { Store } from 'redux';
import {
  Button,
  Overlay,
  OverlayChildrenParams,
  Popover,
} from 'react-bootstrap';

import { createFakeRef, shallowUntilTarget, spyOn } from '../../test-helpers';
import { actions as popoverActions } from '../../reducers/popover';
import configureStore from '../../configureStore';

import PopoverButton, { PopoverButtonBase, PublicProps, DefaultProps } from '.';

describe(__filename, () => {
  type RenderParams = {
    disableLifecycleMethods?: boolean;
    store?: Store;
  } & Partial<PublicProps> &
    Partial<DefaultProps>;

  const render = ({
    disableLifecycleMethods = false,
    id = 'COMMENTS_SUMMARY',
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      content: 'example content',
      createRef: createFakeRef,
      id,
      prompt: 'Open',
      ...moreProps,
    };
    return shallowUntilTarget(<PopoverButton {...props} />, PopoverButtonBase, {
      shallowOptions: { context: { store }, disableLifecycleMethods },
    });
  };

  const renderPopover = ({
    arrowProps = { ref: createFakeRef(), style: {} },
    id = 'COMMENTS_SUMMARY',
    placement = 'bottom',
    ref = createFakeRef(),
    store = configureStore(),
    style = { left: 100, top: 200 },
    ...renderProps
  }: Partial<OverlayChildrenParams> & RenderParams = {}) => {
    store.dispatch(popoverActions.show(id));
    const root = render({ store, ...renderProps });

    const overlay = root.find(Overlay);
    const renderChildren = overlay.renderProp('children');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: there is a type mismatch here, apparently.
    return renderChildren({ arrowProps, placement, ref, style });
  };

  it('renders an open overlay', () => {
    const id = 'COMMENTS_SUMMARY';
    const store = configureStore();
    store.dispatch(popoverActions.show(id));
    const root = render({ id, store });

    expect(root.find(Overlay)).toHaveProp('show', true);
  });

  it('renders a closed overlay', () => {
    const id = 'COMMENTS_SUMMARY';
    const store = configureStore();
    store.dispatch(popoverActions.hide(id));
    const root = render({ id, store });

    expect(root.find(Overlay)).toHaveProp('show', false);
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

  it('can add a class to Popover', () => {
    const popoverClassName = 'ExampleClass';
    const popover = renderPopover({ popoverClassName });

    expect(popover.find(Popover)).toHaveClassName(popoverClassName);
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

  it('will hide itself when the Overlay is hidden', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const id = 'COMMENTS_SUMMARY';
    const root = render({ id, store });

    const overlay = root.find(Overlay);

    expect(overlay).toHaveProp('onHide');
    const onHideOverlay = overlay.prop('onHide');
    if (!onHideOverlay) {
      throw new Error('onHideOverlay was unexpectedly empty');
    }
    // Simulate how Overlay calls onHide() internally. We don't use the event
    // but TypeScript wants it.
    onHideOverlay(new Event('some event'));

    expect(dispatchSpy).toHaveBeenCalledWith(popoverActions.hide(id));
  });

  it('opens the overlay on button click', () => {
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');
    const id = 'COMMENTS_SUMMARY';
    const root = render({ id, store });

    const button = root.find(Button);
    expect(button).toHaveLength(1);

    button.simulate('click');

    expect(dispatchSpy).toHaveBeenCalledWith(popoverActions.show(id));
  });

  it('renders popover content', () => {
    const exampleClassName = 'ExampleClass';
    const popover = renderPopover({
      content: <span className={exampleClassName} />,
    });

    expect(popover.find(`.${exampleClassName}`)).toHaveLength(1);
  });

  it('renders a prompt', () => {
    const prompt = 'Open Me';
    const root = render({ prompt });

    expect(root.find(Button).children()).toHaveText(prompt);
  });
});
