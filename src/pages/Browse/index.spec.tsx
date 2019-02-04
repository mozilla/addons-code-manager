import * as React from 'react';
import { shallow } from 'enzyme';

import { createFakeHistory } from '../../test-helpers';

import Browse from '.';

describe(__filename, () => {
  const render = ({
    history = createFakeHistory(),
    versionId = '123',
  } = {}) => {
    const props = {
      history,
      location: history.location,
      match: {
        isExact: true,
        params: { versionId },
        path: '/some-path',
        url: '/some-url',
      },
    };

    return shallow(<Browse {...props} />);
  };

  it('renders an page', () => {
    const versionId = '123';

    const root = render({ versionId });

    expect(root).toIncludeText(`Version ID: ${versionId}`);
  });
});
