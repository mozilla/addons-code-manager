import {
  Action,
  AnyAction,
  Dispatch,
  Store,
  applyMiddleware,
  compose,
  createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import {
  LoopReducer,
  StoreCreator,
  combineReducers,
  install,
} from 'redux-loop';

import api, { ApiState } from './reducers/api';
import users, { UsersState } from './reducers/users';
import versions, { VersionsState } from './reducers/versions';

export type ConnectedReduxProps<A extends Action = AnyAction> = {
  dispatch: Dispatch<A>;
};

export type ApplicationState = {
  api: ApiState;
  users: UsersState;
  versions: VersionsState;
};

const createRootReducer = () => {
  return combineReducers<ApplicationState>({ api, users, versions });
};

const configureStore = (
  preloadedState?: ApplicationState,
): Store<ApplicationState> => {
  let composeEnhancers = compose;
  const allMiddleware = [];

  if (process.env.NODE_ENV === 'development') {
    allMiddleware.push(createLogger());
    composeEnhancers = composeWithDevTools({});
  }

  const middleware = composeEnhancers(
    applyMiddleware(...allMiddleware),
    install<ApplicationState>(),
  );

  return (createStore as StoreCreator)(
    createRootReducer(),
    preloadedState,
    middleware,
  );
};

export default configureStore;
