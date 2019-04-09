import {
  Action,
  AnyAction,
  Middleware,
  Store,
  applyMiddleware,
  createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import thunk, {
  ThunkAction,
  ThunkDispatch as ReduxThunkDispatch,
  ThunkMiddleware,
} from 'redux-thunk';

import createRootReducer, { ApplicationState } from './reducers';

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

const configureStore = (
  preloadedState?: ApplicationState,
): Store<ApplicationState> => {
  const allMiddleware: Middleware[] = [
    thunk as ThunkMiddleware<ApplicationState, AnyAction>,
  ];
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    allMiddleware.push(createLogger());
  }

  let middleware = applyMiddleware(...allMiddleware);
  if (isDevelopment) {
    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  const store = createStore(createRootReducer(), preloadedState, middleware);

  if (isDevelopment) {
    /* istanbul ignore next */
    if (module.hot) {
      /* istanbul ignore next */
      module.hot.accept('./reducers', () => {
        store.replaceReducer(createRootReducer());
      });
    }
  }

  return store;
};

export default configureStore;
