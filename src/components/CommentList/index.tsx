import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { CommentInfo, selectCommentInfo } from '../../reducers/comments';
import Comment from '../Comment';
import styles from './styles.module.scss';

export type ChildrenArgValue = JSX.Element;

export type PublicProps = {
  addonId: number;
  children: (content: ChildrenArgValue) => JSX.Element;
  className?: string;
  fileName: string | null;
  line: number | null;
  versionId: number;
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
  return {
    commentInfo: selectCommentInfo({
      comments: state.comments,
      versionId,
      fileName,
      line,
    }),
  };
};

export default connect(mapStateToProps)(CommentListBase);
