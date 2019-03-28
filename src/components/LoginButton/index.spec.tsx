import * as React from 'react';
import { Button } from 'react-bootstrap';

import { makeApiURL } from '../../api';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  shallowUntilTarget,
} from '../../test-helpers';

import LoginButton, { LoginButtonBase } from '.';

describe(__filename, () => {
  const render = ({ fxaConfig = 'fxa', pathname = '/' } = {}) => {
    return shallowUntilTarget(
      <LoginButton fxaConfig={fxaConfig} />,
      LoginButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({
          location: createFakeLocation({ pathname }),
        }),
      },
    );
  };

  it('renders a login button', () => {
    const fxaConfig = 'some-fxa-config';
    const pathname = '/en-US/browse/491343/versions/1527716/';

    const root = render({ fxaConfig, pathname });

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      makeApiURL({
        path: `/accounts/login/start/?config=${fxaConfig}&to=${pathname}`,
      }),
    );
  });
});
