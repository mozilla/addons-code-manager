import * as React from 'react';
import { Button } from 'react-bootstrap';

import { actions as userActions } from '../../reducers/users';
import configureStore from '../../configureStore';
import { makeApiURL } from '../../api';
import { shallowUntilTarget } from '../../test-helpers';

import LoginButton, { LoginButtonBase } from '.';

describe(__filename, () => {
  const render = ({
    _window = window,
    fxaConfig = 'fxa',
    isLocalDev = false,
    store = configureStore(),
  } = {}) => {
    return shallowUntilTarget(
      <LoginButton
        _window={_window}
        fxaConfig={fxaConfig}
        isLocalDev={isLocalDev}
      />,
      LoginButtonBase,
      {
        shallowOptions: { context: { store } },
      },
    );
  };

  it('renders a login button', () => {
    const fxaConfig = 'some-fxa-config';
    const href = 'https://example.org/en-US/browse/4913/versions/1527/';
    const _window = {
      ...window,
      location: {
        ...window.location,
        href,
      },
    } as typeof window;

    const root = render({ fxaConfig, _window });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      makeApiURL({
        path: `/accounts/login/start/?config=${fxaConfig}&to=${href}`,
      }),
    );
    expect(root.find(Button)).toHaveProp('disabled', false);
  });

  it('passes a relative URL to addons-server in local dev', () => {
    const fxaConfig = 'local';
    const origin = 'https://example.org';
    const path = '/en-US/browse/4913/versions/1527/';
    const href = `${origin}${path}`;
    const _window = {
      ...window,
      location: {
        ...window.location,
        href,
        origin,
      },
    } as typeof window;

    const root = render({ fxaConfig, _window, isLocalDev: true });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      makeApiURL({
        path: `/accounts/login/start/?config=${fxaConfig}&to=${path}`,
      }),
    );
  });

  it('renders a disabled button while the user is loading', () => {
    const store = configureStore();
    store.dispatch(userActions.beginFetchCurrentUser());
    const root = render({ store });

    expect(root.find(Button)).toHaveProp('disabled', true);
  });
});
