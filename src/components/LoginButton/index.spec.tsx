import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from 'react-bootstrap';

import LoginButton from '.';

describe(__filename, () => {
  it('renders a login button', () => {
    const apiVersion = 'api-version';
    const fxaConfig = 'some-fxa-config';

    const root = shallow(
      <LoginButton fxaConfig={fxaConfig} apiVersion={apiVersion} />,
    );

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      `/api/${apiVersion}/accounts/login/start/?config=${fxaConfig}&to=/`,
    );
  });
});
