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
import { routerMiddleware } from 'connected-react-router';
import { History, createBrowserHistory } from 'history';
import * as Sentry from '@sentry/browser';
import createSentryMiddleware from 'redux-sentry-middleware';

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

const flattenObject = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: Record<string, any>,
) => {
  return Object.keys(object).reduce((newObject: typeof object, k: string) => {
    const value = object[k];
    let newValue;

    if (
      value === null ||
      ['string', 'number', 'boolean', 'undefined'].includes(typeof value)
    ) {
      newValue = value;
    } else {
      newValue = `[type: ${typeof value}]`;
    }

    // eslint-disable-next-line no-param-reassign
    newObject[k] = newValue;
    return newObject;
  }, {});
};

export const actionToSentryBreadcrumb = (action: AnyAction) => {
  return {
    ...flattenObject(action),
    payload: action.payload ? flattenObject(action.payload) : undefined,
  };
};

export const redactStateForSentry = (state: ApplicationState) => {
  // When adding a new state entry to this object, consider the
  // implication of sending it to Sentry and redact data if necessary.
  return {
    accordionMenu: state.accordionMenu,
    // This intentionally doesn't spread api state. As the api shape evolves,
    // the tests will fail and that will help the author consider redaction
    // implications.
    api: { authToken: '[redacted]' },
    comments: state.comments,
    errors: state.errors,
    fileTree: state.fileTree,
    fullscreenGrid: state.fullscreenGrid,
    linter: state.linter,
    popover: state.popover,
    router: state.router,
    users: state.users,
    versions: state.versions,
  };
};

type ConfigureStoreParams = {
  history?: History;
  preloadedState?: ApplicationState;
};

const configureStore = ({
  history = createBrowserHistory(),
  preloadedState,
}: ConfigureStoreParams = {}): Store<ApplicationState> => {
  const allMiddleware: Middleware[] = [
    routerMiddleware(history),
    thunk as ThunkMiddleware<ApplicationState, AnyAction>,
  ];
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (process.env.REACT_APP_SENTRY_DSN) {
    allMiddleware.push(
      // Sentry needs to come after redux-thunk and anything that
      // intercepts / emits actions.
      createSentryMiddleware(Sentry, {
        breadcrumbDataFromAction: actionToSentryBreadcrumb,
        stateTransformer: redactStateForSentry,
      }),
    );
  }

  if (isDevelopment) {
    allMiddleware.push(createLogger());
  }

  let middleware = applyMiddleware(...allMiddleware);
  if (isDevelopment) {
    const composeEnhancers = composeWithDevTools({});
    middleware = composeEnhancers(middleware);
  }

  const store = createStore(
    createRootReducer(history),
    preloadedState,
    middleware,
  );

  if (isDevelopment) {
    /* istanbul ignore next */
    if (module.hot) {
      /* istanbul ignore next */
      module.hot.accept('./reducers', () => {
        store.replaceReducer(createRootReducer(history));
      });
    }
  }

  return store;
};

export default configureStore;
