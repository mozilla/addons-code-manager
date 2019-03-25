import * as React from 'react';
import { Button } from 'react-bootstrap';

import {
  createContextWithFakeRouter,
  createFakeLocation,
  shallowUntilTarget,
} from '../../test-helpers';

import LoginButton, { LoginButtonBase } from '.';

describe(__filename, () => {
  it('renders a login button', () => {
    const apiVersion = 'api-version';
    const fxaConfig = 'some-fxa-config';
    const pathname = '/en-US/browse/491343/versions/1527716/';

    const root = shallowUntilTarget(
      <LoginButton fxaConfig={fxaConfig} apiVersion={apiVersion} />,
      LoginButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({
          location: createFakeLocation({ pathname }),
        }),
      },
    );

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      `/api/${apiVersion}/accounts/login/start/?config=${fxaConfig}&to=${pathname}`,
    );
  });
});
