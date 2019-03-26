import * as React from 'react';
import { Button } from 'react-bootstrap';

import { getApiHost } from '../../api';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  shallowUntilTarget,
} from '../../test-helpers';

import LoginButton, { LoginButtonBase } from '.';

describe(__filename, () => {
  const render = ({
    _getApiHost = getApiHost,
    apiVersion = '123',
    fxaConfig = 'fxa',
    pathname = '/',
  } = {}) => {
    return shallowUntilTarget(
      <LoginButton
        _getApiHost={_getApiHost}
        apiVersion={apiVersion}
        fxaConfig={fxaConfig}
      />,
      LoginButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({
          location: createFakeLocation({ pathname }),
        }),
      },
    );
  };

  it('renders a login button', () => {
    const apiVersion = 'api-version';
    const fxaConfig = 'some-fxa-config';
    const pathname = '/en-US/browse/491343/versions/1527716/';

    const root = render({ apiVersion, fxaConfig, pathname });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      `${getApiHost()}/api/${apiVersion}/accounts/login/start/?config=${fxaConfig}&to=${pathname}`,
    );
  });

  it('calls _getApiHost() when rendering the button', () => {
    const apiHost = 'http://example.org';
    const _getApiHost = jest.fn().mockReturnValue(apiHost);

    const root = render({ _getApiHost });

    expect(_getApiHost).toHaveBeenCalled();
    expect(root.find(Button)).toHaveProp(
      'href',
      expect.stringMatching(`^${apiHost}`),
    );
  });
});
