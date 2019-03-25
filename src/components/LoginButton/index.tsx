import * as React from 'react';
import { Button } from 'react-bootstrap';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { gettext } from '../../utils';
import styles from './styles.module.scss';

type PublicProps = {};

type DefaultProps = {
  apiVersion: string;
  fxaConfig: string;
};

type Props = PublicProps & DefaultProps & RouteComponentProps;

export class LoginButtonBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    apiVersion: process.env.REACT_APP_DEFAULT_API_VERSION as string,
    fxaConfig: process.env.REACT_APP_FXA_CONFIG as string,
  };

  getFxaURL() {
    const { apiVersion, fxaConfig, location } = this.props;

    return `/api/${apiVersion}/accounts/login/start/?config=${fxaConfig}&to=${
      location.pathname
    }`;
  }

  render() {
    return (
      <Button href={this.getFxaURL()} className={styles.link}>
        {gettext('Log in')}
      </Button>
    );
  }
}

export default withRouter(LoginButtonBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
