import * as React from 'react';
import { Button } from 'react-bootstrap';
import { shallow } from 'enzyme';

import { makeApiURL } from '../../api';

import LoginButton from '.';

describe(__filename, () => {
  const render = ({
    _window = window,
    fxaConfig = 'fxa',
    isLocalDev = false,
  } = {}) => {
    return shallow(
      <LoginButton
        _window={_window}
        fxaConfig={fxaConfig}
        isLocalDev={isLocalDev}
      />,
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
    };

    const root = render({ fxaConfig, _window });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      makeApiURL({
        path: `/accounts/login/start/?config=${fxaConfig}&to=${href}`,
      }),
    );
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
    };

    const root = render({ fxaConfig, _window, isLocalDev: true });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      makeApiURL({
        path: `/accounts/login/start/?config=${fxaConfig}&to=${path}`,
      }),
    );
  });
});
