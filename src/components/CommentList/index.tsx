import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  CommentInfo,
  fetchAndLoadComments,
  selectCommentInfo,
  selectVersionHasComments,
} from '../../reducers/comments';
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

export type DefaultProps = {
  _fetchAndLoadComments: typeof fetchAndLoadComments;
};

type PropsFromState = {
  commentInfo: CommentInfo | undefined;
  versionHasComments: boolean | undefined;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class CommentListBase extends React.Component<Props> {
  static defaultProps = {
    _fetchAndLoadComments: fetchAndLoadComments,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const {
      _fetchAndLoadComments,
      addonId,
      dispatch,
      versionHasComments,
      versionId,
    } = this.props;

    if (versionHasComments === undefined) {
      dispatch(_fetchAndLoadComments({ addonId, versionId }));
    }
  }

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
    versionHasComments: selectVersionHasComments({
      comments: state.comments,
      versionId,
    }),
  };
};

export default connect(mapStateToProps)(CommentListBase);
