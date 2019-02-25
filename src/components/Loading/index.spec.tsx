import * as React from 'react';
import { shallow } from 'enzyme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Loading from '.';

describe(__filename, () => {
  const render = ({ message = 'default' } = {}) => {
    const props = {
      message,
    };

    return shallow(<Loading {...props} />);
  };

  it('renders a Loading message', () => {
    const message = 'loading content';

    const root = render({ message });

    expect(root).toIncludeText(message);
    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
  });
});
