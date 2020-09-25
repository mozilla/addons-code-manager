import * as React from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { currentUserIsLoading } from '../../reducers/users';
import { ConnectedReduxProps } from '../../configureStore';
import { makeApiURL } from '../../api';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

type PublicProps = Record<string, unknown>;

type PropsFromState = {
  userIsLoading: boolean;
};

type DefaultProps = {
  _window: typeof window;
  fxaConfig: string;
  isLocalDev: boolean;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class LoginButtonBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _window: window,
    fxaConfig: process.env.REACT_APP_FXA_CONFIG as string,
    isLocalDev: process.env.REACT_APP_IS_LOCAL_DEV === 'true',
  };

  getFxaURL() {
    const { _window, fxaConfig, isLocalDev } = this.props;
    let { href } = _window.location;

    // We use a relative URL when we run the app locally.
    if (isLocalDev) {
      href = href.replace(_window.location.origin, '');
    }

    return makeApiURL({
      path: `/accounts/login/start/?config=${fxaConfig}&to=${href}`,
    });
  }

  render() {
    const { userIsLoading } = this.props;
    return (
      <Button
        disabled={userIsLoading}
        size="sm"
        href={this.getFxaURL()}
        className={styles.link}
      >
        {gettext('Log in')}
      </Button>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    userIsLoading: currentUserIsLoading(state.users),
  };
};

export default connect(mapStateToProps)(LoginButtonBase);
