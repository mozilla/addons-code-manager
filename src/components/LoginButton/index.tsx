import * as React from 'react';
import { Button } from 'react-bootstrap';

import styles from './styles.module.scss';

export class LoginButtonBase extends React.Component {
  getFxaURL(): string {
    const fxaConfig = process.env.REACT_APP_FXA_CONFIG;

    return `/api/v4/accounts/login/start/?config=${fxaConfig}&to=/`;
  }

  render(): React.ReactNode {
    return (
      <Button href={this.getFxaURL()} className={styles.link}>
        Log in
      </Button>
    );
  }
}

export default LoginButtonBase;
