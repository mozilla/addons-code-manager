import * as React from 'react';
import { shallow } from 'enzyme';

import VersionSelect from '../VersionSelect';
import { fakeVersions } from '../../test-helpers';
import styles from './styles.module.scss';

import VersionChooser from '.';

describe(__filename, () => {
  const render = ({ versions = fakeVersions } = {}) => {
    const props = {
      versions,
    };

    return shallow(<VersionChooser {...props} />);
  };

  it('renders a title', () => {
    const root = render();

    expect(root.find(`.${styles.heading}`)).toHaveLength(1);
  });

  it('renders two VersionSelect components and an arrow', () => {
    const root = render();

    expect(root.find(VersionSelect)).toHaveLength(2);
    expect(root.find(VersionSelect).at(0)).toHaveProp(
      'label',
      'Choose a base version',
    );
    expect(root.find(VersionSelect).at(1)).toHaveProp(
      'label',
      'Choose a head version',
    );
    expect(root.find(`.${styles.arrow}`)).toHaveLength(1);
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
