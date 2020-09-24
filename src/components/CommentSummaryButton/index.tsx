import * as React from 'react';
import { Button, Popover } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext } from '../../utils';
import { ApplicationState } from '../../reducers';
import { Comment, selectVersionComments } from '../../reducers/comments';
import { actions as popoverActions } from '../../reducers/popover';
import { selectCurrentVersionInfo } from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import CommentSummary from '../CommentSummary';
import PopoverButton from '../PopoverButton';
import styles from './styles.module.scss';

export type PublicProps = Record<string, unknown>;

export type DefaultProps = Record<string, unknown>;

type PropsFromState = {
  comments: Comment[] | undefined;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export const CommentSummaryButtonBase = ({ comments, dispatch }: Props) => {
  const id = 'COMMENTS_SUMMARY';
  return (
    <PopoverButton
      id={id}
      content={
        <>
          <Popover.Title as="h3">{gettext('Comments')}</Popover.Title>
          <Popover.Content>
            <CommentSummary comments={comments || []} />
            <div className={styles.summaryControls}>
              <Button
                onClick={() => {
                  dispatch(popoverActions.hide(id));
                }}
                size="sm"
                variant="primary"
              >
                {gettext('Close')}
              </Button>
            </div>
          </Popover.Content>
        </>
      }
      popoverClassName={styles.popover}
      prompt={gettext('Comment Summary')}
    />
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  const currentVersion = selectCurrentVersionInfo(state.versions);
  return {
    comments: currentVersion
      ? selectVersionComments({
          comments: state.comments,
          versionId: currentVersion.id,
        })
      : undefined,
  };
};

export default connect(mapStateToProps)(CommentSummaryButtonBase);
