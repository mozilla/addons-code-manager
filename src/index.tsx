import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';

import './styles.scss';
import App from './components/App';
import configureApplication from './configureApplication';
import configureStore from './configureStore';

configureApplication();

const history = createBrowserHistory();
const store = configureStore({ history });

const rootElement = document.getElementById('root') as HTMLElement;
const authToken = (rootElement && rootElement.dataset.authToken) || null;

if (authToken === process.env.REACT_APP_AUTH_TOKEN_PLACEHOLDER) {
  throw new Error(
    `Runtime error: authentication token placeholder should not be present`,
  );
}

const render = (AppComponent: typeof App) => {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <AppComponent authToken={authToken} />
      </ConnectedRouter>
    </Provider>,
    rootElement,
  );
};

render(App);

/* istanbul ignore next */
if (module.hot) {
  /* istanbul ignore next */
  module.hot.accept('./components/App', () => {
    // eslint-disable-next-line global-require
    const NextApp = require('./components/App').default;
    render(NextApp);
  });
}
