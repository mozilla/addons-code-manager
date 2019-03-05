import * as React from 'react';
import { shallow } from 'enzyme';

import VersionSelect from '../VersionSelect';
import { fakeVersions } from '../../test-helpers';

import VersionChooser from '.';

describe(__filename, () => {
  const render = ({ versions = fakeVersions } = {}) => {
    return shallow(<VersionChooser versions={versions} />);
  };

  it('renders a VersionChooser', () => {
    const root = render();

    expect(root.find(VersionSelect)).toHaveLength(2);
    expect(root.find(VersionSelect).at(0)).toHaveProp(
      'label',
      'Choose an old version',
    );
    expect(root.find(VersionSelect).at(1)).toHaveProp(
      'label',
      'Choose a new version',
    );
    expect(root.find(VersionSelect).at(1)).toHaveProp('withLeftArrow', true);
  });

  it('splits the list of versions into listed and unlisted lists', () => {
    const listedVersions = [
      {
        ...fakeVersions[0],
        channel: 'listed',
      },
    ];
    const unlistedVersions = [
      {
        ...fakeVersions[1],
        channel: 'unlisted',
      },
    ];

    const root = render({ versions: [...listedVersions, ...unlistedVersions] });

    root.find(VersionSelect).forEach((versionSelect) => {
      expect(versionSelect).toHaveProp('listedVersions', listedVersions);
      expect(versionSelect).toHaveProp('unlistedVersions', unlistedVersions);
    });
  });
});
