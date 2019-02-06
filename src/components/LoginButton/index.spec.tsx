import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from 'react-bootstrap';

import LoginButton from '.';

describe(__filename, () => {
  it('renders a page', () => {
    const fxaConfig = 'some-fxa-config';

    const root = shallow(<LoginButton fxaConfig={fxaConfig} />);

    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      `/api/v4/accounts/login/start/?config=${fxaConfig}&to=/`,
    );
  });
});
