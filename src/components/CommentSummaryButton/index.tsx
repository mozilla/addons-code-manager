import * as React from 'react';
import { Button, Popover } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext } from '../../utils';
import { ApplicationState } from '../../reducers';
import {
  Comment,
  actions as commentsActions,
  selectVersionComments,
} from '../../reducers/comments';
import { selectCurrentVersionInfo } from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import CommentSummary from '../CommentSummary';
import PopoverButton from '../PopoverButton';
import styles from './styles.module.scss';

export type PublicProps = {};

export type DefaultProps = {};

type PropsFromState = {
  comments: Comment[] | undefined;
  showOverlay: boolean;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export const CommentSummaryButtonBase = ({
  comments,
  dispatch,
  showOverlay,
}: Props) => {
  return (
    <PopoverButton
      content={
        <>
          <Popover.Title as="h3">{gettext('Comments')}</Popover.Title>
          <Popover.Content>
            <CommentSummary comments={comments || []} />
            <div className={styles.summaryControls}>
              <Button
                onClick={() => {
                  dispatch(commentsActions.hideSummaryOverlay());
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
      onHide={() => {
        dispatch(commentsActions.hideSummaryOverlay());
      }}
      onOpen={() => {
        dispatch(commentsActions.toggleSummaryOverlay());
      }}
      prompt={gettext('Comment Summary')}
      showPopover={showOverlay}
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
    showOverlay: state.comments.showSummaryOverlay,
  };
};

export default connect(mapStateToProps)(CommentSummaryButtonBase);
