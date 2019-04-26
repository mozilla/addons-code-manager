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
import FullscreenGrid, { ContentShell, Header } from '../FullscreenGrid';
import Navbar from '../Navbar';
import Browse from '../../pages/Browse';
import Compare from '../../pages/Compare';
import Index from '../../pages/Index';
import NotFound from '../../pages/NotFound';
import { gettext } from '../../utils';

export type PublicProps = {
  authToken: string | null;
};

export type DefaultProps = {
  _fetchCurrentUser: typeof fetchCurrentUser;
  _log: typeof log;
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
  };

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
    const { loading } = this.props;

    return (
      <FullscreenGrid>
        <Header>
          {!loading && <Navbar />}
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

export default withRouter<PublicProps & Partial<DefaultProps> & RouterProps>(
  connect(mapStateToProps)(AppBase),
);
