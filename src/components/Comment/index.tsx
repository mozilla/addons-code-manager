import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';
import Textarea from 'react-textarea-autosize';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ConnectedReduxProps } from '../../configureStore';
import { ApplicationState } from '../../reducers';
import {
  Comment,
  actions as commentsActions,
  deleteComment,
  manageComment,
  selectComment,
  selectCommentInfo,
} from '../../reducers/comments';
import { gettext, sanitizeHTML, nl2br } from '../../utils';
import styles from './styles.module.scss';

type TextareaRef = React.RefObject<HTMLTextAreaElement> | undefined;

export type PublicProps = {
  addonId: number;
  className?: string;
  commentId: number | null;
  fileName: string | null;
  line: number | null;
  readOnly: boolean;
  versionId: number;
};

export type DefaultProps = {
  _deleteComment: typeof deleteComment;
  _manageComment: typeof manageComment;
  createTextareaRef?: () => TextareaRef;
};

type PropsFromState = {
  initialComment: Comment | null;
  initialCommentText: string | null;
  savingComment: boolean;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

type State = { commentText: string | undefined };

export class CommentBase extends React.Component<Props, State> {
  static defaultProps = {
    _deleteComment: deleteComment,
    _manageComment: manageComment,
  };

  constructor(props: Props) {
    super(props);
    const { initialComment, initialCommentText } = props;

    let commentText = initialComment ? initialComment.content : undefined;
    if (!commentText) {
      commentText = initialCommentText || undefined;
    }
    this.state = { commentText };
  }

  private textareaRef: TextareaRef = this.props.createTextareaRef
    ? this.props.createTextareaRef()
    : React.createRef();

  keydownListener = (event: KeyboardEvent) => {
    // Stop keydown events from propagating to the <KeyboardShortcuts>
    // component.
    event.stopPropagation();
  };

  componentDidMount() {
    if (this.textareaRef && this.textareaRef.current) {
      this.textareaRef.current.focus();
      this.textareaRef.current.addEventListener(
        'keydown',
        this.keydownListener,
      );
    }
  }

  componentWillUnmount() {
    if (this.textareaRef && this.textareaRef.current) {
      this.textareaRef.current.removeEventListener(
        'keydown',
        this.keydownListener,
      );
    }
  }

  getInitialCommentOrThrow() {
    const { initialComment } = this.props;
    if (!initialComment) {
      throw new Error('Cannot get initialComment because it is empty');
    }
    return initialComment;
  }

  onCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();

    this.setState({ commentText: event.target.value });
  };

  onAbortDelete = () => {
    const { dispatch } = this.props;
    const initialComment = this.getInitialCommentOrThrow();
    dispatch(
      commentsActions.abortDeleteComment({ commentId: initialComment.id }),
    );
  };

  onConsiderDelete = () => {
    const { dispatch } = this.props;
    const initialComment = this.getInitialCommentOrThrow();
    dispatch(
      commentsActions.considerDeleteComment({ commentId: initialComment.id }),
    );
  };

  onDelete = () => {
    const { _deleteComment, addonId, dispatch, versionId } = this.props;
    const initialComment = this.getInitialCommentOrThrow();
    dispatch(
      _deleteComment({ addonId, commentId: initialComment.id, versionId }),
    );
  };

  onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const {
      _manageComment,
      addonId,
      dispatch,
      fileName,
      initialComment,
      line,
      versionId,
    } = this.props;
    event.preventDefault();

    dispatch(
      _manageComment({
        addonId,
        // TODO: support canned responses.
        // https://github.com/mozilla/addons-code-manager/issues/113
        cannedResponseId: undefined,
        comment: this.state.commentText,
        commentId: initialComment ? initialComment.id : undefined,
        fileName,
        line,
        versionId,
      }),
    );
  };

  renderComment() {
    const initialComment = this.getInitialCommentOrThrow();

    let showCancel = false;
    let deleteIsDisabled = false;
    let deletePrompt = gettext('Delete');
    let onDeleteClick = this.onConsiderDelete;

    if (initialComment.considerDelete) {
      deletePrompt = gettext('Confirm delete');
      onDeleteClick = this.onDelete;
      showCancel = true;
    } else if (initialComment.beginDelete) {
      deletePrompt = gettext('Deleting…');
      deleteIsDisabled = true;
    }

    return (
      <div className={styles.comment}>
        <div className={styles.commentBody}>
          <FontAwesomeIcon
            flip="horizontal"
            icon={['far', 'comment-alt']}
            pull="left"
            size="2x"
          />
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(
              nl2br(initialComment.content),
              ['br'],
            )}
          />
        </div>
        <div className={styles.commentControls}>
          <Button
            className={makeClassName(styles.controlButton, styles.deleteButton)}
            disabled={deleteIsDisabled}
            onClick={onDeleteClick}
            size="sm"
            type="button"
            variant="danger"
          >
            {deletePrompt}
          </Button>
          {showCancel && (
            <Button
              className={makeClassName(
                styles.controlButton,
                styles.cancelButton,
              )}
              onClick={this.onAbortDelete}
              size="sm"
              type="button"
              variant="light"
            >
              {gettext('Cancel')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  renderForm() {
    const { savingComment } = this.props;
    const { commentText } = this.state;

    return (
      <Form className={styles.form} onSubmit={this.onSubmit}>
        <Textarea
          disabled={savingComment}
          onChange={this.onCommentChange}
          inputRef={this.textareaRef}
          className={styles.textarea}
          minRows={3}
          value={commentText}
        />
        <Button disabled={savingComment} type="submit">
          {savingComment ? gettext('Saving…') : gettext('Save')}
        </Button>
      </Form>
    );
  }

  render() {
    const { className, readOnly } = this.props;
    return (
      <div className={makeClassName(styles.container, className)}>
        {readOnly ? this.renderComment() : this.renderForm()}
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  { commentId, fileName, line, versionId }: PublicProps,
): PropsFromState => {
  let initialComment;
  if (commentId) {
    initialComment = selectComment({ comments: state.comments, id: commentId });
    if (!initialComment) {
      throw new Error(`No comment was mapped for commentId=${commentId}`);
    }
  }

  const info = selectCommentInfo({
    comments: state.comments,
    fileName,
    line,
    versionId,
  });
  return {
    initialComment: initialComment || null,
    initialCommentText: info ? info.pendingCommentText : null,
    savingComment: info ? info.savingComment : false,
  };
};

export default connect(mapStateToProps)(CommentBase);
