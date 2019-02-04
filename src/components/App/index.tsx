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
import {
  ExternalUser,
  User,
  actions as userActions,
  getCurrentUser,
} from '../../reducers/users';
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
  profile: User | null;
};

/* eslint-disable @typescript-eslint/indent */
type Props = PublicProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps<{}>;
/* eslint-enable @typescript-eslint/indent */

class AppBase extends React.Component<Props> {
  componentDidMount() {
    const { authToken, dispatch } = this.props;

    if (authToken) {
      dispatch(apiActions.setAuthToken({ authToken }));
    }
  }

  async componentDidUpdate(prevProps: Props) {
    const { apiState, dispatch, profile } = this.props;

    if (!profile && prevProps.apiState.authToken !== apiState.authToken) {
      const response = (await api.callApi({
        apiState,
        endpoint: '/accounts/profile/',
      })) as ExternalUser;

      if (response && response.name) {
        dispatch(userActions.loadCurrentUser({ user: response }));
      }
    }
  }

  render() {
    const { profile } = this.props;

    return (
      <React.Fragment>
        <Navbar />

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
    profile: getCurrentUser(state.users),
  };
};

export default withRouter(connect(mapStateToProps)(AppBase));
