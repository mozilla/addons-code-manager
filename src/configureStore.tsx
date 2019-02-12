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
  // LoopReducer,
  // StoreCreator,
  combineReducers,
  install,
} from 'redux-loop';

import api, { Actions as ApiActions, ApiState } from './reducers/api';
import users, { Actions as UsersActions, UsersState } from './reducers/users';
import versions, { VersionsState } from './reducers/versions';

// TODO: move this somewhere better

interface LoopReducer<S, A extends Action> {
  (state: S | undefined, action: A, ...args: any[]): S | Loop<S, A>;
}

import { StoreEnhancer } from 'redux';
interface StoreCreator {
  <S, A extends Action>(
    reducer: LoopReducer<S, A>,
    // Fix optional preloadedState.
    preloadedState: S | undefined,
    enhancer: StoreEnhancer<S>,
  ): Store<S>;
}

type ReducerMapObject<S, A extends Action = AnyAction> = {
  [K in keyof S]: LoopReducer<S[K], A>
};

interface CombineReducers {
  <S, A extends Action = AnyAction>(
    reducers: ReducerMapObject<S, A>,
  ): LiftedLoopReducer<S, A>;
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
  return (combineReducers as CombineReducers)<ApplicationState, Actions>({
    api,
    users,
    versions,
  });
};

const configureStore = () => {
  const enhancedCreateStore = createStore as StoreCreator;

  let enhancer = compose(install<ApplicationState>());

  // if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION__) {
  //   enhancer = compose(
  //     install(),
  //     window.__REDUX_DEVTOOLS_EXTENSION__({
  //       serialize: {
  //         options: true,
  //       },
  //     })
  //   );
  // }

  return enhancedCreateStore<ApplicationState, Actions>(
    createRootReducer(),
    undefined,
    enhancer,
  );

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
