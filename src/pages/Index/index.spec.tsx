import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';

import Index from '.';

describe(__filename, () => {
  it('renders a page', () => {
    const root = shallow(<Index />);

    expect(root.find(Link)).toHaveLength(1);
  });
});
