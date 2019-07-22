import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext, getLocalizedString } from '../../utils';
import LoginButton from '../LoginButton';
import { ApplicationState } from '../../reducers';
import { Version, selectCurrentVersionInfo } from '../../reducers/versions';
import { ConnectedReduxProps } from '../../configureStore';
import { User, selectCurrentUser, requestLogOut } from '../../reducers/users';
import styles from './styles.module.scss';

type PublicProps = {
  _requestLogOut: typeof requestLogOut;
};

type PropsFromState = {
  user: User | null;
  currentVersion: Version | null | undefined;
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

  render() {
    const { user, currentVersion } = this.props;

    return (
      <Navbar bg="dark" className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand className={styles.brand}>
          {currentVersion && (
            <span className={styles.addonName}>
              {getLocalizedString(currentVersion.addon.name)}
            </span>
          )}
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
  return {
    user: selectCurrentUser(state.users),
    currentVersion: selectCurrentVersionInfo(state.versions),
  };
};

export default connect(mapStateToProps)(NavbarBase);
