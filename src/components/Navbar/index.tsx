import * as React from 'react';
import { Button, Nav, Navbar } from 'react-bootstrap';

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
        <Nav>
          {profile ? (
            <Nav.Link className="Navbar-username">{profile.name}</Nav.Link>
          ) : null}
          {profile ? (
            <Button className="Navbar-logOut" onClick={onLogOut}>
              Log out
            </Button>
          ) : (
            <LoginButton />
          )}
        </Nav>
      </Navbar>
    );
  }
}

export default NavbarBase;
