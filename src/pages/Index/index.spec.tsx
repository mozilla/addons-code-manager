import * as React from 'react';
import { shallow } from 'enzyme';

import Index from '.';

describe(__filename, () => {
  it('renders a page with some links', () => {
    const root = shallow(<Index />);

    expect(root.find('a')).toExist();
  });
});
