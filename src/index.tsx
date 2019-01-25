import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import './index.css';
import App from './components/App';
import configureStore from './configureStore';
import { actions as apiActions } from './reducers/api';

const store = configureStore();

const rootElement = document.getElementById('root') as HTMLElement;
const authToken = rootElement ? rootElement.dataset.authToken : null;

if (
  authToken &&
  authToken.length &&
  authToken !== process.env.REACT_APP_AUTH_TOKEN_PLACEHOLDER
) {
  store.dispatch(apiActions.setAuthToken({ authToken }));
}

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  rootElement,
);
