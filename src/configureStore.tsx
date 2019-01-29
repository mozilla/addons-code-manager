import {
  Action,
  AnyAction,
  Dispatch,
  Store,
  applyMiddleware,
  combineReducers,
  createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';

import api, { ApiState } from './reducers/api';
import example, { ExampleState } from './reducers/example';
import users, { UsersState } from './reducers/users';

export type ConnectedReduxProps<A extends Action = AnyAction> = {
  dispatch: Dispatch<A>;
};

export type ApplicationState = {
  api: ApiState;
  example: ExampleState;
  users: UsersState;
};

const createRootReducer = () => {
  return combineReducers<ApplicationState>({ api, example, users });
};

const configureStore = (
  preloadedState?: ApplicationState,
): Store<ApplicationState> => {
  let middleware;
  if (process.env.NODE_ENV === 'development') {
    middleware = applyMiddleware(createLogger());

    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  return createStore(createRootReducer(), preloadedState, middleware);
};

export default configureStore;
