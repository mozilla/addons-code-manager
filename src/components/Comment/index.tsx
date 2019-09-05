import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Comment } from '../../reducers/comments';
import { gettext, sanitizeHTML, nl2br } from '../../utils';
import styles from './styles.module.scss';

type TextareaRef = React.RefObject<HTMLTextAreaElement> | undefined;

export type PublicProps = {
  comment: Comment | null;
  createTextareaRef?: () => TextareaRef;
  readOnly: boolean;
};

export class CommentBase extends React.Component<PublicProps> {
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

  renderComment() {
    const comment = this.props.comment as Comment;

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
          dangerouslySetInnerHTML={sanitizeHTML(nl2br(comment.content), ['br'])}
        />
      </div>
    );
  }

  renderForm() {
    const { comment } = this.props;
    const value = (comment && comment.content) || undefined;

    return (
      <Form className={styles.form}>
        <Textarea
          inputRef={this.textareaRef}
          className={styles.textarea}
          minRows={3}
          value={value}
        />
        <Button type="submit">{gettext('Save')}</Button>
      </Form>
    );
  }

  render() {
    const { comment, readOnly } = this.props;

    return (
      <div className={styles.container}>
        {comment && readOnly ? this.renderComment() : this.renderForm()}
      </div>
    );
  }
}

export default CommentBase;
