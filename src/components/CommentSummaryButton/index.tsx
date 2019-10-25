import * as React from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext } from '../../utils';
import { ApplicationState } from '../../reducers';
import {
  Comment,
  actions as commentsActions,
  selectVersionComments,
} from '../../reducers/comments';
import { selectCurrentVersionInfo } from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import CommentSummary from '../CommentSummary';
import styles from './styles.module.scss';

type State = { canAccessRefs: boolean };

export type PublicProps = {};

export type DefaultProps = {
  createRef: () => React.RefObject<HTMLDivElement>;
};

type PropsFromState = {
  comments: Comment[] | undefined;
  showOverlay: boolean;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class CommentSummaryButtonBase extends React.Component<Props, State> {
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

  renderCommentSummary() {
    const { comments, dispatch } = this.props;

    return (
      <>
        <CommentSummary comments={comments || []} />
        <div className={styles.summaryControls}>
          <Button
            onClick={() => {
              dispatch(commentsActions.hideSummaryOverlay());
            }}
            size="sm"
            variant="primary"
          >
            {gettext('Close')}
          </Button>
        </div>
      </>
    );
  }

  renderOverlay() {
    const { dispatch, showOverlay } = this.props;
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
          dispatch(commentsActions.hideSummaryOverlay());
        }}
        placement="bottom"
        rootClose
        show={showOverlay}
        target={this.buttonRef.current}
      >
        {({ arrowProps, placement, ref, style }) => {
          return (
            <Popover
              arrowProps={arrowProps}
              className={styles.popover}
              id="finish-review-popover"
              placement={placement}
              ref={ref}
              style={style}
            >
              <Popover.Title as="h3">{gettext('Comments')}</Popover.Title>
              <Popover.Content>{this.renderCommentSummary()}</Popover.Content>
            </Popover>
          );
        }}
      </Overlay>
    );
  }

  render() {
    const { dispatch } = this.props;

    return (
      <>
        <Button
          onClick={() => {
            // TODO: rename this to toggleSummaryOverlay()
            // https://github.com/mozilla/addons-code-manager/issues/1166
            dispatch(commentsActions.toggleSummaryOverlay());
          }}
          // This type has a conflicting definition. See:
          // https://github.com/react-bootstrap/react-bootstrap/issues/4706
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          ref={this.buttonRef}
          size="sm"
          variant="primary"
        >
          {gettext('Comment Summary')}
        </Button>
        {this.renderOverlay()}
      </>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  const currentVersion = selectCurrentVersionInfo(state.versions);
  return {
    comments: currentVersion
      ? selectVersionComments({
          comments: state.comments,
          versionId: currentVersion.id,
        })
      : undefined,
    showOverlay: state.comments.showSummaryOverlay,
  };
};

export default connect(mapStateToProps)(CommentSummaryButtonBase);
