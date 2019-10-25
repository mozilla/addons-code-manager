import * as React from 'react';
import { Placement, PopoverProps } from 'react-bootstrap';

// This overloads some types defined incorrectly in react-bootstrap.
// See https://github.com/react-bootstrap/react-bootstrap/issues/4717
declare module 'react-bootstrap' {
  export interface OverlayChildrenParams {
    arrowProps:
      | {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref: React.LegacyRef<any>;
          style: React.CSSProperties;
        }
      | undefined;
    placement: Placement;
    // This is needed to pass the function args from Overlay to Popover.
    // It's definitely not right but the Popover ref
    // is not defined correctly and we are *currently* only
    // using Overlay in combination with Popover.
    ref: PopoverProps['ref'];
    style: React.CSSProperties;
  }

  export interface OverlayProps {
    children: (params: OverlayChildrenParams) => React.ReactNode;
  }
}
