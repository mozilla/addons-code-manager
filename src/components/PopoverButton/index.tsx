import makeClassName from 'classnames';
import * as React from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import {
  PopoverIdType,
  actions as popoverActions,
  selectPopoverIsVisible,
} from '../../reducers/popover';
import { ConnectedReduxProps } from '../../configureStore';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type State = { canAccessRefs: boolean };

export type PublicProps = {
  content: AnyReactNode;
  id: PopoverIdType;
  popoverClassName?: string;
  prompt: AnyReactNode;
};

type PropsFromState = {
  show: boolean;
};

export type DefaultProps = {
  createRef: () => React.RefObject<HTMLDivElement>;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

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
    const { content, dispatch, id, popoverClassName, show } = this.props;
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
          dispatch(popoverActions.hide(id));
        }}
        placement="bottom"
        rootClose
        show={show}
        target={this.buttonRef.current}
      >
        {({ arrowProps, placement, ref, style }) => {
          return (
            <Popover
              arrowProps={arrowProps}
              className={makeClassName(styles.popover, popoverClassName)}
              id={`${id}-popover`}
              placement={placement}
              ref={ref}
              style={style}
            >
              {content}
            </Popover>
          );
        }}
      </Overlay>
    );
  }

  render() {
    const { dispatch, id, prompt } = this.props;

    return (
      <>
        <Button
          onClick={() => {
            dispatch(popoverActions.show(id));
          }}
          // This type has a conflicting definition. See:
          // https://github.com/react-bootstrap/react-bootstrap/issues/4706
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  return {
    show: selectPopoverIsVisible({
      id: ownProps.id,
      popover: state.popover,
    }),
  };
};

export default connect(mapStateToProps)(PopoverButtonBase);
