import * as React from 'react';
import { Button } from 'react-bootstrap';

import { makeApiURL } from '../../api';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

type PublicProps = {};

type DefaultProps = {
  _window: typeof window;
  fxaConfig: string;
};

type Props = PublicProps & DefaultProps;

export class LoginButtonBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _window: window,
    fxaConfig: process.env.REACT_APP_FXA_CONFIG as string,
  };

  getFxaURL() {
    const { _window, fxaConfig } = this.props;

    return makeApiURL({
      path: `/accounts/login/start/?config=${fxaConfig}&to=${
        _window.location.href
      }`,
    });
  }

  render() {
    return (
      <Button href={this.getFxaURL()} className={styles.link}>
        {gettext('Log in')}
      </Button>
    );
  }
}

export default LoginButtonBase as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
