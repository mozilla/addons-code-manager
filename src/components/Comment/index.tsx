import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { gettext, sanitizeHTML, nl2br } from '../../utils';
import styles from './styles.module.scss';

type Comment = {
  content: string;
};

export type PublicProps = {
  comment: Comment | null;
  readOnly: boolean;
};

export class CommentBase extends React.Component<PublicProps> {
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
    const value = comment ? comment.content : undefined;

    return (
      <Form className={styles.form}>
        <Textarea className={styles.textarea} minRows={3} value={value} />
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
