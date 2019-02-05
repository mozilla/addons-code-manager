import * as React from 'react';
import { shallow } from 'enzyme';

import { createFakeHistory } from '../../test-helpers';
import configureStore from '../../configureStore';

import Browse from '.';

describe(__filename, () => {
  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = {
      versionId: '123',
    },
  } = {}) => {
    return {
      history,
      location: history.location,
      match: {
        params,
        isExact: true,
        path: '/some-path',
        url: '/some-url',
      },
    };
  };

  const render = ({ versionId = '123' } = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { versionId } }),
      store: configureStore(),
    };

    return shallow(<Browse {...props} />);
  };

  it('renders a page', () => {
    const versionId = '123456';

    const root = render({ versionId });

    expect(root.dive()).toIncludeText(`Version ID: ${versionId}`);
  });
});
