import { Dispatch, Action, AnyAction } from 'redux';
import { Store, applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';

import example, { ExampleState } from './reducers/example';

export interface ConnectedReduxProps<A extends Action = AnyAction> {
  dispatch: Dispatch<A>;
}

export interface ApplicationState {
  example: ExampleState;
}

function createRootReducer() {
  return combineReducers<ApplicationState>({ example });
}

export default function configureStore(
  preloadedState?: ApplicationState,
): Store<ApplicationState> {
  let middleware = applyMiddleware(createLogger());
  if (process.env.NODE_ENV !== 'production') {
    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  return createStore(createRootReducer(), preloadedState, middleware);
}
