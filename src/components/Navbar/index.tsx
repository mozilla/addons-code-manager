import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext, getLocalizedString } from '../../utils';
import CommentSummaryButton from '../CommentSummaryButton';
import LoginButton from '../LoginButton';
import { ApplicationState } from '../../reducers';
import { Comment, selectVersionComments } from '../../reducers/comments';
import { Version, selectCurrentVersionInfo } from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import { User, selectCurrentUser, requestLogOut } from '../../reducers/users';
import styles from './styles.module.scss';

type PublicProps = {
  _requestLogOut: typeof requestLogOut;
};

type PropsFromState = {
  comments: Comment[] | undefined;
  user: User | null;
  currentVersion: Version | null | undefined | false;
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

export class NavbarBase extends React.Component<Props> {
  static defaultProps = {
    _requestLogOut: requestLogOut,
  };

  logOut = () => {
    const { _requestLogOut, dispatch } = this.props;

    dispatch(_requestLogOut());
  };

  renderCommentsNavBar() {
    const { comments } = this.props;

    if (!comments || comments.length === 0) {
      return null;
    }

    return (
      <>
        <div className={styles.infoItem}>
          {gettext('Comments:')}
          <div className={styles.commentCount}>{comments.length}</div>
        </div>
        <div className={styles.infoItem}>
          <CommentSummaryButton />
        </div>
      </>
    );
  }

  render() {
    const { user, currentVersion } = this.props;

    return (
      <Navbar className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand className={styles.brand}>
          <div className={styles.info}>
            {currentVersion && (
              <div className={styles.infoItem}>
                {getLocalizedString(currentVersion.addon.name)}
              </div>
            )}
            {this.renderCommentsNavBar()}
          </div>
        </Navbar.Brand>
        <Navbar.Text className={styles.text}>
          {user ? <span className={styles.username}>{user.name}</span> : null}
          {user ? (
            <Button size="sm" className={styles.logOut} onClick={this.logOut}>
              {gettext('Log out')}
            </Button>
          ) : (
            <LoginButton />
          )}
        </Navbar.Text>
      </Navbar>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  const currentVersion = selectCurrentVersionInfo(state.versions);
  return {
    comments: currentVersion
      ? selectVersionComments({
          comments: state.comments,
          versionId: currentVersion.id,
        })
      : undefined,
    user: selectCurrentUser(state.users),
    currentVersion,
  };
};

export default connect(mapStateToProps)(NavbarBase);
