import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { connect } from 'react-redux';

import { gettext } from '../../utils';
import LoginButton from '../LoginButton';
import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { User, selectCurrentUser, requestLogOut } from '../../reducers/users';
import styles from './styles.module.scss';

type PublicProps = {
  _requestLogOut: typeof requestLogOut;
};

type PropsFromState = {
  user: User | null;
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
    const { user } = this.props;

    return (
      <Navbar bg="dark" className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand href="/">addons-code-manager</Navbar.Brand>
        <Navbar.Text>
          {user ? <span className={styles.username}>{user.name}</span> : null}
          {user ? (
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
    user: selectCurrentUser(state.users),
  };
};

export default connect(mapStateToProps)(NavbarBase);
