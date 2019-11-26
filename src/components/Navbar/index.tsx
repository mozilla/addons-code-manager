import makeClassName from 'classnames';
import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { gettext, getLocalizedString } from '../../utils';
import CommentSummaryButton from '../CommentSummaryButton';
import LoginButton from '../LoginButton';
import VersionChooser from '../VersionChooser';
import { ApplicationState } from '../../reducers';
import { Comment, selectVersionComments } from '../../reducers/comments';
import {
  Version,
  fetchVersion,
  getVersionInfo,
  selectCurrentVersionInfo,
} from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import { User, selectCurrentUser, requestLogOut } from '../../reducers/users';
import styles from './styles.module.scss';

export type PublicProps = {
  _requestLogOut: typeof requestLogOut;
  reviewersHost: string;
};

export type DefaultProps = {
  _fetchVersion: typeof fetchVersion;
};

type PropsFromState = {
  comments: Comment[] | undefined;
  user: User | null;
  currentBaseVersion: Version | null | undefined | false;
  currentBaseVersionId: number | undefined | false;
  currentVersion: Version | null | undefined | false;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

type State = {
  nextBaseVersionImprint: string | undefined;
};

export class NavbarBase extends React.Component<Props, State> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
    _requestLogOut: requestLogOut,
    reviewersHost: process.env.REACT_APP_REVIEWERS_HOST,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      nextBaseVersionImprint: undefined,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const {
      _fetchVersion,
      currentVersion,
      currentBaseVersion,
      currentBaseVersionId,
      dispatch,
    } = this.props;
    const { nextBaseVersionImprint } = this.state;

    if (
      currentBaseVersion &&
      nextBaseVersionImprint !== currentBaseVersion.version
    ) {
      this.setState({ nextBaseVersionImprint: currentBaseVersion.version });
    }

    if (
      currentVersion &&
      currentBaseVersion === undefined &&
      currentBaseVersionId
    ) {
      dispatch(
        _fetchVersion({
          addonId: currentVersion.addon.id,
          path: undefined,
          setAsCurrent: false,
          versionId: currentBaseVersionId,
        }),
      );
    }

    if (currentBaseVersionId === false && nextBaseVersionImprint) {
      this.setState({ nextBaseVersionImprint: undefined });
    }
  }

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
          <div className={makeClassName(styles.itemData, styles.commentCount)}>
            {comments.length}
          </div>
        </div>
        <div className={styles.infoItem}>
          <CommentSummaryButton />
        </div>
      </>
    );
  }

  render() {
    const {
      currentBaseVersion,
      currentVersion,
      reviewersHost,
      user,
    } = this.props;
    const { nextBaseVersionImprint } = this.state;

    return (
      <Navbar className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand className={styles.brand}>
          <div className={styles.info}>
            {currentVersion && (
              <>
                <div className={styles.infoItem}>
                  <a
                    className={styles.reviewerToolsLink}
                    href={`${reviewersHost}/reviewers/review/${currentVersion.addon.slug}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <FontAwesomeIcon
                      className={styles.reviewerToolsIcon}
                      icon={['fas', 'arrow-left']}
                    />
                    {gettext('Reviewer Tools')}
                  </a>
                </div>
                <div
                  className={makeClassName(styles.infoItem, styles.addonName)}
                >
                  {getLocalizedString(currentVersion.addon.name)}
                  <div
                    className={makeClassName(
                      styles.versionIndicator,
                      styles.itemData,
                    )}
                  >
                    {
                      // Render a version range like `base…current`
                      // or just `current`
                    }
                    {currentBaseVersion || nextBaseVersionImprint ? (
                      <span
                        className={makeClassName({
                          [styles.baseVersionIsLoading]:
                            !currentBaseVersion && nextBaseVersionImprint,
                        })}
                      >
                        {`${(currentBaseVersion &&
                          currentBaseVersion.version) ||
                          nextBaseVersionImprint}…`}
                      </span>
                    ) : null}
                    {currentVersion.version}
                  </div>
                </div>
              </>
            )}
            {currentVersion && (
              <div className={styles.infoItem}>
                <VersionChooser addonId={currentVersion.addon.id} />
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

export const mapStateToProps = (state: ApplicationState): PropsFromState => {
  const { currentBaseVersionId } = state.versions;
  let currentBaseVersion;
  if (currentBaseVersionId) {
    currentBaseVersion = getVersionInfo(state.versions, currentBaseVersionId);
  }

  const currentVersion = selectCurrentVersionInfo(state.versions);

  return {
    comments: currentVersion
      ? selectVersionComments({
          comments: state.comments,
          versionId: currentVersion.id,
        })
      : undefined,
    user: selectCurrentUser(state.users),
    currentBaseVersion,
    currentBaseVersionId,
    currentVersion,
  };
};

export default connect(mapStateToProps)(NavbarBase);
