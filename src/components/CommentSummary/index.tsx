import * as React from 'react';

import { gettext } from '../../utils';
import { Comment, createCommentKey } from '../../reducers/comments';
import styles from './styles.module.scss';

export type PublicProps = { className?: string; comments: Comment[] };

const CommentSummary = ({ comments, className }: PublicProps) => {
  const overallComments = [];
  const fileComments = [];

  for (const comment of comments) {
    if (comment.filename) {
      fileComments.push(comment);
    } else {
      overallComments.push(comment);
    }
  }

  const lines: string[] = [];

  const addComment = (comment: Comment) => {
    lines.push(comment.content || '');
    lines.push('');
  };

  if (overallComments.length) {
    lines.push(gettext('Overall comment(s):'));
    lines.push('');

    for (const comment of overallComments) {
      addComment(comment);
    }
  }

  const groups: { [key: string]: Comment[] } = {};

  // Group comments by file / line so they appear under the same header.
  for (const comment of fileComments) {
    const key = createCommentKey({
      commentId: undefined,
      fileName: comment.filename,
      line: comment.lineno,
    });

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(comment);
  }

  for (const key of Object.keys(groups)) {
    let addedHeader = false;

    for (const comment of groups[key]) {
      if (!addedHeader) {
        lines.push(gettext('File:'));
        lines.push(
          `${comment.filename}${comment.lineno ? `#L${comment.lineno}` : ''}`,
        );
        lines.push('');
        addedHeader = true;
      }
      addComment(comment);
    }
  }

  const id = 'CommentSummary-textarea';

  return (
    <div className={className}>
      <label htmlFor={id} className={styles.label}>
        {gettext('Summary of all comments')}
      </label>
      <textarea
        // The texatarea is the focal point of opening a comment summary
        // so autofocus should be safe enough for a11y.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className={styles.summary}
        id={id}
        readOnly
        value={lines.join('\n')}
      />
    </div>
  );
};

export default CommentSummary;
