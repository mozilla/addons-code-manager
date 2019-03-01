import * as React from 'react';
import { shallow } from 'enzyme';

import LinterMessage from '.';

describe(__filename, () => {
  it('is cool', () => {
    shallow(<LinterMessage type="error" message="thing" description="yes" />);
  });
});
