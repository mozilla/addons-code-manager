import * as React from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type State = { canAccessRefs: boolean };

export type PublicProps = {
  content: AnyReactNode;
  onHide: () => void;
  onOpen: () => void;
  prompt: AnyReactNode;
  showPopover: boolean;
};

export type DefaultProps = {
  createRef: () => React.RefObject<HTMLDivElement>;
};

type Props = PublicProps & DefaultProps;

export class PopoverButtonBase extends React.Component<Props, State> {
  private buttonRef = this.props.createRef();

  static defaultProps = {
    createRef: () => React.createRef<HTMLDivElement>(),
  };

  constructor(props: Props) {
    super(props);
    this.state = { canAccessRefs: false };
  }

  componentDidMount() {
    this.setState({ canAccessRefs: true });
  }

  renderOverlay() {
    const { onHide, content: popoverContent, showPopover } = this.props;
    const { canAccessRefs } = this.state;

    if (!canAccessRefs) {
      return null;
    }

    if (!this.buttonRef.current) {
      // This shouldn't be possible since canAccessRefs is set in
      // componentDidMount() when refs are guaranteed to exist.
      throw new Error('buttonRef.current was unexpectedly empty');
    }

    return (
      <Overlay
        onHide={() => {
          onHide();
        }}
        placement="bottom"
        rootClose
        show={showPopover}
        target={this.buttonRef.current}
      >
        {({ arrowProps, placement, ref, style }) => {
          return (
            <Popover
              arrowProps={arrowProps}
              className={styles.popover}
              id="PopoverButton-popover"
              placement={placement}
              ref={ref}
              style={style}
            >
              {popoverContent}
            </Popover>
          );
        }}
      </Overlay>
    );
  }

  render() {
    const { onOpen, prompt } = this.props;

    return (
      <>
        <Button
          onClick={() => {
            onOpen();
          }}
          // This type has a conflicting definition. See:
          // https://github.com/react-bootstrap/react-bootstrap/issues/4706
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          ref={this.buttonRef}
          size="sm"
          variant="primary"
        >
          {prompt}
        </Button>
        {this.renderOverlay()}
      </>
    );
  }
}

export default PopoverButtonBase;
