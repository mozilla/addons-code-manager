import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import './styles.scss';
import App from './components/App';
import configureApplication from './configureApplication';
import configureStore from './configureStore';

configureApplication();

const store = configureStore();

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
      <BrowserRouter>
        <AppComponent authToken={authToken} />
      </BrowserRouter>
    </Provider>,
    rootElement,
  );
};

render(App);

if (module.hot) {
  module.hot.accept('./components/App', () => {
    // eslint-disable-next-line global-require
    const NextApp = require('./components/App').default;
    render(NextApp);
  });
}
