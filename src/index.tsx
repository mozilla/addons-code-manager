import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';

import './styles.scss';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import configureApplication from './configureApplication';
import configureStore from './configureStore';

configureApplication();

const history = createBrowserHistory();
const store = configureStore({ history });

const rootElement = document.getElementById('root') as HTMLElement;
// rootElement.dataset.userAuthSessionId needs to match the data attribute
// in the public/index.html template, with camelCase instead of hyphen-case.
const userAuthSessionId =
  (rootElement && rootElement.dataset.userAuthSessionId) || null;

if (
  userAuthSessionId === process.env.REACT_APP_USER_AUTH_SESSION_ID_PLACEHOLDER
) {
  throw new Error(
    `Runtime error: authentication token placeholder should not be present`,
  );
}

const render = (AppComponent: typeof App) => {
  ReactDOM.render(
    <ErrorBoundary>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <AppComponent userAuthSessionId={userAuthSessionId} />
        </ConnectedRouter>
      </Provider>
    </ErrorBoundary>,
    rootElement,
  );
};

render(App);

/* istanbul ignore next */
if (module.hot) {
  /* istanbul ignore next */
  module.hot.accept('./components/App', () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const NextApp = require('./components/App').default;
    render(NextApp);
  });
}
