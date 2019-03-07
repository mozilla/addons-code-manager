import * as React from 'react';
import { shallow } from 'enzyme';
import { Form } from 'react-bootstrap';

import {
  ExternalVersionsList,
  createVersionsMap,
} from '../../reducers/versions';
import { fakeVersionsList } from '../../test-helpers';
import styles from './styles.module.scss';

import VersionSelect from '.';

describe(__filename, () => {
  const render = ({
    label = 'select a version',
    versions = fakeVersionsList,
    withLeftArrow = false,
  } = {}) => {
    const versionsMap = createVersionsMap(versions);

    const allProps = {
      label,
      listedVersions: versionsMap.listed,
      unlistedVersions: versionsMap.unlisted,
      withLeftArrow,
    };

    return shallow(<VersionSelect {...allProps} />);
  };

  it('renders a label', () => {
    const label = 'some label';
    const root = render({ label });

    expect(root.find(Form.Label)).toHaveLength(1);
    expect(root.find(Form.Label)).toIncludeText(label);
  });

  it('does not render an arrow by default', () => {
    const root = render();

    expect(root.find(`.${styles.arrow}`)).toHaveLength(0);
  });

  it('renders an arrow when withLeftArrow is true', () => {
    const root = render({ withLeftArrow: true });

    expect(root.find(`.${styles.arrow}`)).toHaveLength(1);
  });

  it('renders two lists of versions', () => {
    const listedVersions: ExternalVersionsList = [
      {
        id: 123,
        channel: 'listed',
        version: 'v1',
      },
    ];
    const unlistedVersions: ExternalVersionsList = [
      {
        id: 456,
        channel: 'unlisted',
        version: 'v2',
      },
    ];

    const root = render({ versions: [...listedVersions, ...unlistedVersions] });

    expect(root.find(`.${styles.listedGroup}`)).toHaveProp('label', 'Listed');
    expect(root.find('option').at(0)).toHaveProp('value', listedVersions[0].id);
    expect(root.find('option').at(0)).toIncludeText(listedVersions[0].version);

    expect(root.find(`.${styles.unlistedGroup}`)).toHaveProp(
      'label',
      'Unlisted',
    );
    expect(root.find('option').at(1)).toHaveProp(
      'value',
      unlistedVersions[0].id,
    );
    expect(root.find('option').at(1)).toIncludeText(
      unlistedVersions[0].version,
    );
  });
});
