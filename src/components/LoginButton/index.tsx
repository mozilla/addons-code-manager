import * as React from 'react';
import { Button } from 'react-bootstrap';

import { gettext } from '../../utils';
import styles from './styles.module.scss';

type PublicProps = {
  apiVersion: string;
  fxaConfig: string;
};

export class LoginButtonBase extends React.Component<PublicProps> {
  static defaultProps = {
    apiVersion: process.env.REACT_APP_DEFAULT_API_VERSION,
    fxaConfig: process.env.REACT_APP_FXA_CONFIG,
  };

  getFxaURL() {
    const { apiVersion, fxaConfig } = this.props;

    return `/api/${apiVersion}/accounts/login/start/?config=${fxaConfig}&to=/`;
  }

  render() {
    return (
      <Button href={this.getFxaURL()} className={styles.link}>
        {gettext('Log in')}
      </Button>
    );
  }
}

export default LoginButtonBase;
