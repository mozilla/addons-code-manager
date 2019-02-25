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
import log from 'loglevel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import { ApiState, actions as apiActions } from '../../reducers/api';
import {
  User,
  currentUserIsLoading,
  fetchCurrentUser,
  selectCurrentUser,
} from '../../reducers/users';
import Navbar from '../Navbar';
import Browse from '../../pages/Browse';
import Compare from '../../pages/Compare';
import Index from '../../pages/Index';
import NotFound from '../../pages/NotFound';
import { gettext } from '../../utils';

export type PublicProps = {
  _fetchCurrentUser: typeof fetchCurrentUser;
  _log: typeof log;
  authToken: string | null;
};

type PropsFromState = {
  apiState: ApiState;
  loading: boolean;
  user: User | null;
};

type Props = PublicProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps<{}>;

export class AppBase extends React.Component<Props> {
  static defaultProps = {
    _fetchCurrentUser: fetchCurrentUser,
    _log: log,
  };

  componentDidMount() {
    const { authToken, dispatch } = this.props;

    if (authToken) {
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

  renderRow(content: JSX.Element, { className = '' } = {}) {
    return (
      <Row className={makeClassName(styles.content, className)}>{content}</Row>
    );
  }

  renderContent() {
    const { loading, user } = this.props;

    if (loading) {
      return this.renderRow(
        <React.Fragment>
          <p>
            <FontAwesomeIcon icon="spinner" size="3x" spin />
          </p>
          <p>{gettext('Getting your workspace ready')}</p>
          <p>{gettext("Don't turn off your computer")}</p>
        </React.Fragment>,
        {
          className: styles.isLoading,
        },
      );
    }

    if (user) {
      return this.renderRow(
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
        </Switch>,
      );
    }

    return this.renderRow(<p>{gettext('Please log in to continue.')}</p>, {
      className: styles.loginMessage,
    });
  }

  render() {
    const { loading } = this.props;

    return (
      <React.Fragment>
        {!loading && <Navbar />}
        <Container className={styles.container} fluid>
          {this.renderContent()}
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    apiState: state.api,
    loading: currentUserIsLoading(state.users),
    user: selectCurrentUser(state.users),
  };
};

export default withRouter(connect(mapStateToProps)(AppBase));
