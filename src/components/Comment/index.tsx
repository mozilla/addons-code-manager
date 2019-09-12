import * as React from 'react';
import { connect } from 'react-redux';
import Textarea from 'react-textarea-autosize';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ConnectedReduxProps } from '../../configureStore';
import { ApplicationState } from '../../reducers';
import {
  Comment,
  createCommentKey,
  manageComment,
} from '../../reducers/comments';
import { gettext, sanitizeHTML, nl2br } from '../../utils';
import styles from './styles.module.scss';

type TextareaRef = React.RefObject<HTMLTextAreaElement> | undefined;

export type PublicProps = {
  addonId: number;
  commentId: number | null;
  fileName: string | null;
  line: number | null;
  readOnly: boolean;
  versionId: number;
};

export type DefaultProps = {
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

  onCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();

    this.setState({ commentText: event.target.value });
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
    const { commentId, initialComment } = this.props;
    if (!initialComment) {
      throw new Error(
        `initialComment for commentId=${commentId} cannot be empty when readOnly=true`,
      );
    }
    return (
      <div className={styles.comment}>
        <FontAwesomeIcon
          flip="horizontal"
          icon={['far', 'comment-alt']}
          pull="left"
          size="2x"
        />

        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={sanitizeHTML(nl2br(initialComment.content), [
            'br',
          ])}
        />
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
    const { readOnly } = this.props;
    return (
      <div className={styles.container}>
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
    initialComment = state.comments.byId[commentId];
    if (!initialComment) {
      throw new Error(`No comment was mapped for commentId=${commentId}`);
    }
  }

  const info =
    state.comments.byKey[createCommentKey({ fileName, line, versionId })];
  return {
    initialComment: initialComment || null,
    initialCommentText: info && info.pendingCommentText,
    savingComment: info ? info.savingComment : false,
  };
};

export default connect(mapStateToProps)(CommentBase);
