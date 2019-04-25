import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';

import Index from '.';

describe(__filename, () => {
  it('renders a page with some links', () => {
    const root = shallow(<Index />);

    expect(root.find('a')).toExist();
    expect(root.find(Link)).not.toExist();
  });

  it('renders some example links for local dev', () => {
    const root = shallow(<Index showLocalDevLinks />);

    expect(root.find(Link)).toExist();
  });
});
