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
  LiftedLoopReducer,
  Loop,
  LoopReducer,
  // StoreCreator,
  combineReducers,
  install,
} from 'redux-loop';

import api, { Actions as ApiActions, ApiState } from './reducers/api';
import users, { Actions as UsersActions, UsersState } from './reducers/users';
import versions, { VersionsState } from './reducers/versions';

// TODO: move this somewhere better

import { StoreEnhancer } from 'redux';
interface StoreCreator {
  <S, A extends Action>(
    reducer: LoopReducer<S, A>,
    // Fix optional preloadedState.
    preloadedState: S | undefined,
    enhancer: StoreEnhancer<S>,
  ): Store<S>;
}

export type ConnectedReduxProps<A extends Action = AnyAction> = {
  dispatch: Dispatch<A>;
};

export type ApplicationState = {
  api: ApiState;
  users: UsersState;
  versions: VersionsState;
};

type Actions = ApiActions | UsersActions;

const createRootReducer = () => {
  return combineReducers<ApplicationState, Actions>({
    api,
    users,
    versions,
  });
};

const configureStore = () => {
  const enhancedCreateStore = createStore as StoreCreator;

  let composeEnhancers = compose;
  if (process.env.NODE_ENV === 'development') {
    composeEnhancers = composeWithDevTools({});
  }
  const enhancer = composeEnhancers(install<ApplicationState>());

  return enhancedCreateStore<ApplicationState, Actions>(
    createRootReducer(),
    undefined,
    enhancer,
  );

  // TODO: it should be possible to add middleware but TypeScript doesn't like it.

  // let composeEnhancers = compose;
  // const allMiddleware = [];

  // if (process.env.NODE_ENV === 'development') {
  //   allMiddleware.push(createLogger());
  //   composeEnhancers = composeWithDevTools({});
  // }

  // const middleware = composeEnhancers(
  //   applyMiddleware(...allMiddleware),
  //   install<ApplicationState>(),
  // );

  // return (createStore as StoreCreator)(
  //   createRootReducer(),
  //   preloadedState,
  //   middleware,
  // );
};

export default configureStore;
