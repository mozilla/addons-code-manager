import {
  Action,
  AnyAction,
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
import errors, { ErrorsState } from './reducers/errors';
import fileTree, { FileTreeState } from './reducers/fileTree';
import linter, { LinterState } from './reducers/linter';
import users, { UsersState } from './reducers/users';
import versions, { VersionsState } from './reducers/versions';

export type ApplicationState = {
  api: ApiState;
  errors: ErrorsState;
  fileTree: FileTreeState;
  linter: LinterState;
  users: UsersState;
  versions: VersionsState;
};

export type ThunkActionCreator<PromiseResult = void> = ThunkAction<
  Promise<PromiseResult>,
  ApplicationState,
  undefined,
  AnyAction
>;

export type ThunkDispatch<A extends Action = AnyAction> = ReduxThunkDispatch<
  ApplicationState,
  undefined,
  A
>;

export type ConnectedReduxProps<A extends Action = AnyAction> = {
  dispatch: ThunkDispatch<A>;
};

const createRootReducer = () => {
  return combineReducers<ApplicationState>({
    api,
    errors,
    fileTree,
    linter,
    users,
    versions,
  });
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
