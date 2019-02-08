import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { AnyAction } from 'redux';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { gettext } from '../../utils';
import LoginButton from '../LoginButton';
import { logOutFromServer } from '../../api';
import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import {
  User,
  actions as userActions,
  getCurrentUser,
  requestLogOut,
} from '../../reducers/users';
import styles from './styles.module.scss';

type PublicProps = {
  _requestLogOut: typeof requestLogOut;
};

type PropsFromState = {
  apiState: ApiState;
  profile: User | null;
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

export class NavbarBase extends React.Component<Props> {
  static defaultProps = {
    _requestLogOut: requestLogOut,
  };

  logOut = () => {
    const { _requestLogOut, apiState, dispatch } = this.props;
    // dispatch(_requestLogOut());
    (dispatch as ThunkDispatch<ApplicationState, undefined, AnyAction>)(
      _requestLogOut(),
    );
  };

  render() {
    const { profile } = this.props;

    return (
      <Navbar bg="dark" className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand href="/">addons-code-manager</Navbar.Brand>
        <Navbar.Text>
          {profile ? (
            <span className={styles.username}>{profile.name}</span>
          ) : null}
          {profile ? (
            <Button className={styles.logOut} onClick={this.logOut}>
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
    apiState: state.api,
    profile: getCurrentUser(state.users),
  };
};

export default connect(mapStateToProps)(NavbarBase);
