import React from 'react';
import { Container } from 'react-bootstrap';
import { Store } from 'redux';
import { Route } from 'react-router-dom';

import styles from './styles.module.scss';
import configureStore from '../../configureStore';
import { actions as apiActions } from '../../reducers/api';
import { actions as userActions } from '../../reducers/users';
import {
  createContextWithFakeRouter,
  fakeUser,
  shallowUntilTarget,
} from '../../test-helpers';
import Navbar from '../Navbar';

import App, { AppBase } from '.';

describe(__filename, () => {
  type RenderParams = {
    store?: Store;
    authToken?: string | null;
  };

  const render = ({
    store = configureStore(),
    authToken = 'some-token',
  }: RenderParams = {}) => {
    const contextWithRouter = createContextWithFakeRouter();
    const context = {
      ...contextWithRouter,
      context: {
        ...contextWithRouter.context,
        store,
      },
    };

    const root = shallowUntilTarget(<App authToken={authToken} />, AppBase, {
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

  it('displays a loading message until the user profile gets loaded', () => {
    const root = render();

    expect(root).toIncludeText('Getting your workspace ready');
    expect(root.find(Navbar)).toHaveLength(0);
  });

  it('dispatches setAuthToken on mount when authToken is valid', () => {
    const authToken = 'my-token';
    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ authToken, store });

    expect(dispatch).toHaveBeenCalledWith(
      apiActions.setAuthToken({ authToken }),
    );
  });

  it('does not dispatch setAuthToken on mount when authToken is null', () => {
    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

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

    expect(root.find(Route)).toHaveLength(3);
    expect(root.find(`.${styles.loginMessage}`)).toHaveLength(0);
  });
});
