import * as React from 'react';
import { Button, Navbar } from 'react-bootstrap';

import { gettext } from '../../utils';
import { Profile } from '../App';
import LoginButton from '../LoginButton';
import styles from './styles.module.scss';

type Props = {
  onLogOut: () => void;
  profile: null | Profile;
};

export class NavbarBase extends React.Component<Props> {
  render() {
    const { onLogOut, profile } = this.props;

    return (
      <Navbar bg="dark" className={styles.Navbar} expand="lg" variant="dark">
        <Navbar.Brand href="#">addons-code-manager</Navbar.Brand>
        <Navbar.Text>
          {profile ? (
            <span className={styles.username}>{profile.name}</span>
          ) : null}
          {profile ? (
            <Button className={styles.logOut} onClick={onLogOut}>
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

export default NavbarBase;
