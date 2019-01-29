import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import {
  ExampleState,
  actions as exampleActions,
} from '../../reducers/example';
import * as api from '../../api';
import Login from '../Login';

type PublicProps = {};

type PropsFromState = {
  toggledOn: ExampleState['toggledOn'];
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

interface State {
  profile: null | {
    name: string;
  };
  isLoggingOut: boolean;
}

class AppBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      profile: null,
      isLoggingOut: false,
    };
  }

  async componentDidMount() {
    const profile = (await api.callApi({
      endpoint: '/accounts/profile/',
    })) as State['profile'];

    if (profile && profile.name) {
      this.setState({ profile });
    }
  }

  logOut = async () => {
    this.setState({ isLoggingOut: true });

    await api.logOutFromServer();

    this.setState({ profile: null, isLoggingOut: false });
  };

  handleToggleClick = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    const { dispatch } = this.props;
    event.preventDefault();
    dispatch(exampleActions.toggle());
  };

  render() {
    const { toggledOn } = this.props;
    const { profile, isLoggingOut } = this.state;

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          {profile ? (
            <React.Fragment>
              <h3>Hello {profile.name}!</h3>

              <p>Toggle this on and off to test out Redux:</p>
              <p>
                <button
                  onClick={this.handleToggleClick}
                  style={{ padding: '32px' }}
                >
                  {toggledOn ? 'OFF' : 'ON'}
                </button>
              </p>

              <p>
                {isLoggingOut ? (
                  'See you next time... 😕'
                ) : (
                  <button onClick={this.logOut}>Log out</button>
                )}
              </p>
            </React.Fragment>
          ) : (
            <Login />
          )}
        </header>
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    toggledOn: state.example.toggledOn,
  };
};

export default connect(mapStateToProps)(AppBase);
