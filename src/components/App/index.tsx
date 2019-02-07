import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Row } from 'react-bootstrap';
import {
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';
import makeClassName from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
  loading: boolean;
  profile: User | null;
};

/* eslint-disable @typescript-eslint/indent */
type Props = PublicProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps<{}>;
/* eslint-enable @typescript-eslint/indent */

export class AppBase extends React.Component<Props> {
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
    const { loading, profile } = this.props;

    const routesOrLoginMessage = profile ? (
      <Switch>
        <Route exact path="/" component={Index} />
        <Route
          component={Browse}
          exact
          path="/:lang/browse/:addonId/versions/:versionId/"
        />
        <Route component={NotFound} />
      </Switch>
    ) : (
      <p className={styles.loginMessage}>
        {gettext('Please log in to continue.')}
      </p>
    );

    return (
      <React.Fragment>
        {!loading && <Navbar />}

        <Container className={styles.container} fluid>
          <Row
            className={makeClassName(styles.content, styles.isoading, {
              [styles.isLoading]: loading,
            })}
          >
            {loading ? (
              <React.Fragment>
                <p>
                  <FontAwesomeIcon icon="spinner" size="3x" spin />
                </p>
                <p>{gettext('Getting your workspace ready')}</p>
                <p>{gettext(`Don't turn off your computer`)}</p>
              </React.Fragment>
            ) : (
              routesOrLoginMessage
            )}
          </Row>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const profile = getCurrentUser(state.users);
  const loading = !!ownProps.authToken && !profile;

  return {
    apiState: state.api,
    loading,
    profile,
  };
};

export default withRouter(connect(mapStateToProps)(AppBase));
