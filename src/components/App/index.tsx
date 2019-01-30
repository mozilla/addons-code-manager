import * as React from 'react';
import { connect } from 'react-redux';
import { Button, Container, Row } from 'react-bootstrap';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import { ApiState, actions as apiActions } from '../../reducers/api';
import {
  ExampleState,
  actions as exampleActions,
} from '../../reducers/example';
import * as api from '../../api';
import LoginButton from '../LoginButton';

type PublicProps = {
  authToken: string | null;
};

type PropsFromState = {
  apiState: ApiState;
  toggledOn: ExampleState['toggledOn'];
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

type Profile = {
  name: string;
};

type State = {
  profile: null | Profile;
  isLoggingOut: boolean;
};

class AppBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      profile: null,
      isLoggingOut: false,
    };
  }

  componentDidMount(): void {
    const { authToken, dispatch } = this.props;

    if (authToken) {
      dispatch(apiActions.setAuthToken({ authToken }));
    }
  }

  async componentDidUpdate(prevProps: Props): Promise<void> {
    const { apiState } = this.props;

    if (
      !this.state.profile &&
      prevProps.apiState.authToken !== apiState.authToken
    ) {
      const profile = (await api.callApi({
        apiState,
        endpoint: '/accounts/profile/',
      })) as State['profile'];

      if (profile && profile.name) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ profile });
      }
    }
  }

  logOut = async (): Promise<void> => {
    const { apiState } = this.props;

    this.setState({ isLoggingOut: true });

    await api.logOutFromServer(apiState);

    this.setState({ profile: null, isLoggingOut: false });
  };

  handleToggleClick = (
    event: React.SyntheticEvent<HTMLButtonElement>,
  ): void => {
    const { dispatch } = this.props;
    event.preventDefault();
    dispatch(exampleActions.toggle());
  };

  render(): React.ReactNode {
    const { toggledOn } = this.props;
    const { profile, isLoggingOut } = this.state;

    return (
      <Container className={styles.container} fluid>
        <Row className={styles.header}>
          {profile ? (
            <React.Fragment>
              <h3>
                Hello
                {profile.name}!
              </h3>

              <p>Toggle this on and off to test out Redux:</p>
              <p>
                <Button onClick={this.handleToggleClick} size="lg">
                  {toggledOn ? 'OFF' : 'ON'}
                </Button>
              </p>

              <p>
                {isLoggingOut ? (
                  'See you next time... 😕'
                ) : (
                  <Button onClick={this.logOut}>Log out</Button>
                )}
              </p>
            </React.Fragment>
          ) : (
            <LoginButton />
          )}
        </Row>
      </Container>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    apiState: state.api,
    toggledOn: state.example.toggledOn,
  };
};

export default connect(mapStateToProps)(AppBase);
