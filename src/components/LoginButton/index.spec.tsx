import * as React from 'react';
import { Button } from 'react-bootstrap';
import { shallow } from 'enzyme';

import { makeApiURL } from '../../api';

import LoginButton from '.';

describe(__filename, () => {
  const render = ({ fxaConfig = 'fxa', _window = window } = {}) => {
    return shallow(<LoginButton fxaConfig={fxaConfig} _window={_window} />);
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
});
