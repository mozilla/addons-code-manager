import {
  Action,
  AnyAction,
  Dispatch,
  Middleware,
  Store,
  applyMiddleware,
  combineReducers,
  createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import thunk, {
  ThunkAction,
  ThunkDispatch as ReduxThunkDispatch,
  ThunkMiddleware,
} from 'redux-thunk';

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

export type ThunkActionCreator<PromiseResult = void> = ThunkAction<
  Promise<PromiseResult>,
  ApplicationState,
  undefined,
  AnyAction
>;

export type ThunkDispatch = ReduxThunkDispatch<
  ApplicationState,
  undefined,
  AnyAction
>;

const createRootReducer = () => {
  return combineReducers<ApplicationState>({ api, users, versions });
};

const configureStore = (
  preloadedState?: ApplicationState,
): Store<ApplicationState> => {
  const allMiddleware: Middleware[] = [
    thunk as ThunkMiddleware<ApplicationState, AnyAction>,
  ];
  let addDevTools = false;

  if (process.env.NODE_ENV === 'development') {
    allMiddleware.push(createLogger());
    addDevTools = true;
  }

  let middleware = applyMiddleware(...allMiddleware);
  if (addDevTools) {
    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  return createStore(createRootReducer(), preloadedState, middleware);
};

export default configureStore;
