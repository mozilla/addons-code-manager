import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Row } from 'react-bootstrap';
import {
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import { ApiState, actions as apiActions } from '../../reducers/api';
import * as api from '../../api';
import Navbar from '../Navbar';
import Browse from '../../pages/Browse';
import Index from '../../pages/Index';
import NotFound from '../../pages/NotFound';
import { gettext } from '../../utils';

type PublicProps = {
  authToken: string | null;
};

type PropsFromState = {
  apiState: ApiState;
};

/* eslint-disable @typescript-eslint/indent */
type Props = PublicProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps<{}>;
/* eslint-enable @typescript-eslint/indent */

export type Profile = {
  name: string;
};

type State = {
  profile: null | Profile;
};

class AppBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      profile: null,
    };
  }

  componentDidMount() {
    const { authToken, dispatch } = this.props;

    if (authToken) {
      dispatch(apiActions.setAuthToken({ authToken }));
    }
  }

  async componentDidUpdate(prevProps: Props) {
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

  logOut = async () => {
    const { apiState } = this.props;

    await api.logOutFromServer(apiState);

    this.setState({ profile: null });
  };

  render() {
    const { profile } = this.state;

    return (
      <React.Fragment>
        <Navbar onLogOut={this.logOut} profile={profile} />

        <Container className={styles.container} fluid>
          <Row className={styles.content}>
            <Switch>
              {profile ? (
                <React.Fragment>
                  <Route exact path="/" component={Index} />
                  <Route
                    component={Browse}
                    exact
                    path="/:lang/:application/files/browse/:versionId/"
                  />
                </React.Fragment>
              ) : (
                <p className={styles.loginMessage}>
                  {gettext('Please log in to continue.')}
                </p>
              )}

              <Route component={NotFound} />
            </Switch>
          </Row>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    apiState: state.api,
  };
};

export default withRouter(connect(mapStateToProps)(AppBase));
