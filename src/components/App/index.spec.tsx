import React from 'react';
import { Alert, Container } from 'react-bootstrap';
import { Store } from 'redux';
import { Route } from 'react-router-dom';

import styles from './styles.module.scss';
import configureStore from '../../configureStore';
import { actions as apiActions } from '../../reducers/api';
import { actions as errorsActions } from '../../reducers/errors';
import { actions as userActions } from '../../reducers/users';
import {
  createContextWithFakeRouter,
  createFakeThunk,
  fakeUser,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import Navbar from '../Navbar';

import App, { AppBase, DefaultProps, PublicProps } from '.';

describe(__filename, () => {
  type RenderParams = {
    _fetchCurrentUser?: DefaultProps['_fetchCurrentUser'];
    authToken?: PublicProps['authToken'];
    store?: Store;
  };

  const render = ({
    _fetchCurrentUser = createFakeThunk().createThunk,
    authToken = 'some-token',
    store = configureStore(),
  }: RenderParams = {}) => {
    const contextWithRouter = createContextWithFakeRouter();
    const context = {
      ...contextWithRouter,
      context: {
        ...contextWithRouter.context,
        store,
      },
    };

    const props = {
      _fetchCurrentUser,
      authToken,
    };

    const root = shallowUntilTarget(<App {...props} />, AppBase, {
      shallowOptions: { ...context },
    });

    return root;
  };

  it('renders without an authentication token', () => {
    const root = render({ authToken: null });

    expect(root.find(Container)).toHaveClassName(styles.container);
    expect(root.find(`.${styles.content}`)).toHaveLength(1);
    expect(root.find(Navbar)).toHaveLength(1);
  });

  it('renders with an empty authentication token', () => {
    const root = render({ authToken: '' });

    expect(root.find(Container)).toHaveClassName(styles.container);
    expect(root.find(`.${styles.content}`)).toHaveLength(1);
    expect(root.find(Navbar)).toHaveLength(1);
  });

  it('displays a loading message until the user gets loaded', () => {
    const store = configureStore();
    store.dispatch(userActions.beginFetchCurrentUser());
    const root = render({ store });

    expect(root).toIncludeText('Getting your workspace ready');
    expect(root.find(Navbar)).toHaveLength(0);
  });

  it('does not dispatch setAuthToken on mount when authToken is already present in the state', () => {
    const authToken = 'my-token';
    const store = configureStore();
    store.dispatch(apiActions.setAuthToken({ authToken }));
    const dispatch = spyOn(store, 'dispatch');

    render({ authToken, store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches setAuthToken on mount when authToken is valid and not already set', () => {
    const authToken = 'my-token';
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    render({ authToken, store });

    expect(dispatch).toHaveBeenCalledWith(
      apiActions.setAuthToken({ authToken }),
    );
  });

  it('does not dispatch setAuthToken on mount when authToken is null', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    render({ authToken: null, store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('configures no route when the user is not logged in', () => {
    const root = render({ authToken: null });

    expect(root.find(Route)).toHaveLength(0);
    expect(root.find(`.${styles.loginMessage}`)).toIncludeText('Please log in');
  });

  it('exposes more routes when the user is logged in', () => {
    const store = configureStore();
    store.dispatch(userActions.loadCurrentUser({ user: fakeUser }));

    const root = render({ store });

    expect(root.find(Route)).toExist();
    expect(root.find(`.${styles.loginMessage}`)).toHaveLength(0);
  });

  it('fetches the current user on update when there is no loaded user and authToken changes', () => {
    const store = configureStore();
    const fakeThunk = createFakeThunk();

    const root = render({
      _fetchCurrentUser: fakeThunk.createThunk,
      authToken: null,
      store,
    });

    store.dispatch(apiActions.setAuthToken({ authToken: 'some-token' }));
    const { api: apiState } = store.getState();
    const dispatch = spyOn(store, 'dispatch');

    root.setProps({ apiState, dispatch });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not fetch the current user on update when there is no loaded user and authToken is the same', () => {
    const store = configureStore();
    store.dispatch(apiActions.setAuthToken({ authToken: 'some-token' }));

    const root = render({ store });

    const { api: apiState } = store.getState();
    const dispatch = spyOn(store, 'dispatch');

    root.setProps({ apiState, dispatch });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not fetch the current user on update when the user has been already loaded', () => {
    const store = configureStore();
    store.dispatch(userActions.loadCurrentUser({ user: fakeUser }));

    const root = render({ authToken: null, store });

    store.dispatch(apiActions.setAuthToken({ authToken: 'some-token' }));
    const { api: apiState } = store.getState();
    const dispatch = spyOn(store, 'dispatch');

    root.setProps({ apiState, dispatch });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not render application errors when there is no error', () => {
    const root = render();

    expect(root.find(`.${styles.errors}`)).toHaveLength(0);
  });

  it('renders application errors', () => {
    const error1 = new Error('error 1');
    const error2 = new Error('error 2');
    const store = configureStore();
    store.dispatch(errorsActions.addError({ error: error1 }));
    store.dispatch(errorsActions.addError({ error: error2 }));

    const root = render({ store });

    expect(root.find(Alert)).toHaveLength(2);
    expect(root.find(Alert).at(0)).toIncludeText(error1.message);
    expect(root.find(Alert).at(1)).toIncludeText(error2.message);
  });

  it('dispatches removeError() when dismissing an error', () => {
    const error1 = new Error('first error');
    const error2 = new Error('second error');
    const store = configureStore();
    store.dispatch(errorsActions.addError({ error: error1 }));
    store.dispatch(errorsActions.addError({ error: error2 }));
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ store });

    // User clicks the "close" button of the first error shown.
    const onClose = root
      .find(Alert)
      .at(0)
      .prop('onClose') as Function;
    onClose();

    const { errors } = store.getState().errors;
    const firstError = errors[0];
    expect(dispatch).toHaveBeenCalledWith(
      errorsActions.removeError({
        id: firstError.id,
      }),
    );
  });
});
