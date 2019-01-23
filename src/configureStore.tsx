import { Dispatch, Action, AnyAction } from 'redux';
import { Store, applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';

import example, { ExampleState } from './reducers/example';

export interface ApplicationState {
  example: ExampleState;
}

export interface ConnectedReduxProps<A extends Action = AnyAction> {
  dispatch: Dispatch<A>;
}

const reducers = { example };

export default function configureStore(
  preloadedState?: ApplicationState,
): Store<ApplicationState> {
  const rootReducer = combineReducers<ApplicationState>(reducers);

  let middleware = applyMiddleware(createLogger());
  if (process.env.NODE_ENV !== 'production') {
    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  const store = createStore(rootReducer, preloadedState, middleware);

  return store;
}
