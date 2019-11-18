import { shallow } from 'enzyme';
import * as React from 'react';
import { Button, Overlay, OverlayChildrenParams } from 'react-bootstrap';

import { createFakeRef } from '../../test-helpers';

import PopoverButton, { PublicProps, DefaultProps } from '.';

describe(__filename, () => {
  type RenderParams = { disableLifecycleMethods?: boolean } & Partial<
    PublicProps
  > &
    Partial<DefaultProps>;

  const render = ({
    disableLifecycleMethods = false,
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      content: 'example content',
      createRef: createFakeRef,
      onHide: jest.fn(),
      onOpen: jest.fn(),
      prompt: 'Open',
      showPopover: true,
      ...moreProps,
    };
    return shallow(<PopoverButton {...props} />, { disableLifecycleMethods });
  };

  const renderPopover = ({
    arrowProps = { ref: createFakeRef(), style: {} },
    placement = 'bottom',
    ref = createFakeRef(),
    style = { left: 100, top: 200 },
    ...renderProps
  }: Partial<OverlayChildrenParams> & RenderParams = {}) => {
    const root = render({ showPopover: true, ...renderProps });

    const overlay = root.find(Overlay);
    const renderChildren = overlay.renderProp('children');

    return renderChildren({ arrowProps, placement, ref, style });
  };

  it('configures an Overlay', () => {
    const showPopover = false;
    const root = render({ showPopover });

    expect(root.find(Overlay)).toHaveProp('show', showPopover);
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

  it('triggers the onHide callback', () => {
    const onHide = jest.fn();
    const root = render({ onHide });

    const overlay = root.find(Overlay);

    expect(overlay).toHaveProp('onHide');
    const onHideOverlay = overlay.prop('onHide');
    if (!onHideOverlay) {
      throw new Error('onHideOverlay was unexpectedly empty');
    }
    // Simulate how Overlay calls onHide().
    onHideOverlay();

    expect(onHide).toHaveBeenCalled();
  });

  it('triggers the onOpen callback', () => {
    const onOpen = jest.fn();
    const root = render({ onOpen });

    const button = root.find(Button);
    expect(button).toHaveLength(1);

    button.simulate('click');

    expect(onOpen).toHaveBeenCalled();
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
