import {
  Action,
  AnyAction,
  Dispatch,
  Reducer,
  Store,
  applyMiddleware,
  combineReducers,
  createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';

import api, { ApiState } from './reducers/api';
import example, { ExampleState } from './reducers/example';

export type ConnectedReduxProps<A extends Action = AnyAction> = {
  dispatch: Dispatch<A>;
};

export type ApplicationState = {
  api: ApiState;
  example: ExampleState;
};

const createRootReducer = (): Reducer<ApplicationState> => {
  return combineReducers<ApplicationState>({ api, example });
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
