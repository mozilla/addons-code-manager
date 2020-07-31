import * as React from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';
import {
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';
import log from 'loglevel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import { ApiState, actions as apiActions } from '../../reducers/api';
import {
  ApplicationError,
  actions as errorsActions,
} from '../../reducers/errors';
import {
  User,
  currentUserIsLoading,
  fetchCurrentUser,
  selectCurrentUser,
} from '../../reducers/users';
import ContentShell from '../FullscreenGrid/ContentShell';
import FullscreenGrid, { Header } from '../FullscreenGrid';
import Navbar from '../Navbar';
import Browse from '../../pages/Browse';
import Compare from '../../pages/Compare';
import Index from '../../pages/Index';
import NotFound from '../../pages/NotFound';
import { gettext } from '../../utils';
import tracking from '../../tracking';

export const resourceObserverCallback = (
  _tracking: typeof tracking,
  resource: Partial<PerformanceResourceTiming>,
) => {
  if (resource.initiatorType === 'fetch' && resource.duration) {
    _tracking.timing({
      category: 'resource',
      label: resource.name,
      value: resource.duration,
      variable: 'fetch',
    });
  }
};

export type MockObserver = { disconnect: () => void; observe: () => void };

export type PublicProps = {
  _mockObserver?: jest.Mock;
  authToken: string | null;
};

export type DefaultProps = {
  _fetchCurrentUser: typeof fetchCurrentUser;
  _log: typeof log;
  _tracking: typeof tracking;
};

type PropsFromState = {
  apiState: ApiState;
  errors: ApplicationError[];
  loading: boolean;
  user: User | null;
};

type RouterProps = RouteComponentProps<{}>;

type Props = PublicProps &
  DefaultProps &
  PropsFromState &
  ConnectedReduxProps &
  RouterProps;

export class AppBase extends React.Component<Props> {
  static defaultProps = {
    _fetchCurrentUser: fetchCurrentUser,
    _log: log,
    _tracking: tracking,
  };

  resourceObserver: PerformanceObserver | MockObserver;

  createResourceObserver() {
    const { _mockObserver, _tracking } = this.props;

    const ObserverConstructor =
      (_mockObserver && _mockObserver) || PerformanceObserver;

    const observer = new ObserverConstructor((list) => {
      const resourceEntries = list.getEntriesByType(
        'resource',
      ) as PerformanceResourceTiming[];

      for (const resource of resourceEntries) {
        resourceObserverCallback(_tracking, resource);
      }
      performance.clearResourceTimings();
    });
    return observer;
  }

  constructor(props: Props) {
    super(props);

    this.resourceObserver = this.createResourceObserver();
    this.resourceObserver.observe({ entryTypes: ['resource'] });
  }

  componentDidMount() {
    const { apiState, authToken, dispatch } = this.props;

    if (authToken && authToken !== apiState.authToken) {
      dispatch(apiActions.setAuthToken({ authToken }));
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { apiState, user } = this.props;

    if (!user && prevProps.apiState.authToken !== apiState.authToken) {
      const { _fetchCurrentUser, dispatch } = this.props;

      dispatch(_fetchCurrentUser());
    }
  }

  componentWillUnmount() {
    this.resourceObserver.disconnect();
  }

  renderContent() {
    const { loading, user } = this.props;

    if (loading) {
      return (
        <ContentShell className={styles.isLoading}>
          <p>
            <FontAwesomeIcon icon="spinner" size="3x" spin />
          </p>
          <p>{gettext('Getting your workspace ready')}</p>
          <p>{gettext("Don't turn off your computer")}</p>
        </ContentShell>
      );
    }

    if (user) {
      // Important: when adding a new route below, you will also have to update
      // the Nginx config (maintained by ops).
      return (
        <Switch>
          <Route exact path="/" component={Index} />
          <Route
            component={Browse}
            exact
            path="/:lang/browse/:addonId/versions/:versionId/"
          />
          <Route
            component={Compare}
            exact
            path="/:lang/compare/:addonId/versions/:baseVersionId...:headVersionId/"
          />
          <Route component={NotFound} />
        </Switch>
      );
    }

    return (
      <ContentShell className={styles.loginMessage}>
        <p>{gettext('Please log in to continue.')}</p>
      </ContentShell>
    );
  }

  dismissError = (errorId: number) => {
    const { dispatch } = this.props;

    dispatch(errorsActions.removeError({ id: errorId }));
  };

  renderErrors() {
    const { errors } = this.props;

    if (errors.length === 0) {
      return null;
    }

    return (
      <div className={styles.errors}>
        {errors.map((error) => (
          <Alert
            className={styles.errorAlert}
            dismissible
            key={error.id}
            onClose={() => this.dismissError(error.id)}
            variant="danger"
          >
            {error.message}
          </Alert>
        ))}
      </div>
    );
  }

  render() {
    return (
      <FullscreenGrid>
        <Header>
          <Navbar />
          {this.renderErrors()}
        </Header>
        {this.renderContent()}
      </FullscreenGrid>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    apiState: state.api,
    errors: state.errors.errors,
    loading: currentUserIsLoading(state.users),
    user: selectCurrentUser(state.users),
  };
};

export default withRouter(
  connect(mapStateToProps)(AppBase),
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
