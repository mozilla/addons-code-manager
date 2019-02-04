import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';

import NotFound from '.';

describe(__filename, () => {
  it('renders an page', () => {
    const root = shallow(<NotFound />);

    expect(root.find('h1')).toHaveLength(1);
    expect(root.find(Link)).toHaveLength(1);
    expect(root.find(Link)).toHaveProp('to', '/');
  });
});
