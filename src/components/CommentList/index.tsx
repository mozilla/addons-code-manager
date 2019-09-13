import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import {
  CommentKeyParams,
  CommentInfo,
  createCommentKey,
} from '../../reducers/comments';
import Comment from '../Comment';
import styles from './styles.module.scss';

export type PublicProps = CommentKeyParams & {
  addonId: number;
  children: (content: JSX.Element) => JSX.Element;
  className?: string;
};

type PropsFromState = {
  commentInfo: CommentInfo | undefined;
};

type Props = PublicProps & PropsFromState;

export class CommentListBase extends React.Component<Props> {
  render() {
    const {
      addonId,
      children,
      className,
      commentInfo,
      fileName,
      line,
      versionId,
    } = this.props;
    const comments = [];

    if (commentInfo) {
      const base = {
        addonId,
        className: styles.comment,
        fileName,
        line,
        versionId,
      };

      if (commentInfo.beginNewComment) {
        comments.push(
          <Comment
            {...base}
            commentId={null}
            key="comment-entry-form"
            readOnly={false}
          />,
        );
      }
      for (const id of commentInfo.commentIds) {
        comments.push(<Comment {...base} commentId={id} key={id} readOnly />);
      }
    }

    if (comments.length === 0) {
      return null;
    }

    return children(
      // This is wrapped in a div so that :first-child works consistently.
      <div className={className}>{comments}</div>,
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  { versionId, fileName, line }: PublicProps,
): PropsFromState => {
  const key = createCommentKey({ versionId, fileName, line });
  return {
    commentInfo: state.comments.byKey[key],
  };
};

export default connect(mapStateToProps)(CommentListBase);
