import * as React from 'react';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import Button from '../Button';
import { ConnectedReduxProps } from '../../configureStore';
import { actions as commentsActions } from '../../reducers/comments';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  className?: string;
  versionId: number;
  fileName: string | null;
  line: number | null;
};

type Props = PublicProps & ConnectedReduxProps;

export function AddCommentBase({
  className,
  dispatch,
  fileName,
  line,
  versionId,
}: Props) {
  return (
    <Button
      onClick={() => {
        dispatch(
          commentsActions.beginComment({
            versionId,
            commentId: undefined,
            fileName,
            line,
          }),
        );
      }}
      className={makeClassName(styles.button, className)}
      title={gettext('Add a comment')}
    />
  );
}

export default connect()(AddCommentBase);
