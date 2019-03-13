import * as React from 'react';
import { shallow } from 'enzyme';
import { Form } from 'react-bootstrap';

import {
  ExternalVersionsList,
  createVersionsMap,
} from '../../reducers/versions';
import {
  createFakeEvent,
  fakeVersionsList,
  fakeVersionsListItem,
} from '../../test-helpers';
import styles from './styles.module.scss';

import VersionSelect, { PublicProps } from '.';

describe(__filename, () => {
  const render = ({
    className = undefined as PublicProps['className'],
    label = 'select a version',
    onChange = jest.fn(),
    value = undefined as PublicProps['value'],
    versions = fakeVersionsList,
    withLeftArrow = false,
  } = {}) => {
    const versionsMap = createVersionsMap(versions);

    const allProps = {
      className,
      label,
      listedVersions: versionsMap.listed,
      onChange,
      unlistedVersions: versionsMap.unlisted,
      value,
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
        ...fakeVersionsListItem,
        id: 123,
        channel: 'listed',
        version: 'v1',
      },
    ];
    const unlistedVersions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
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

  it('passes the value prop to the Form.Control component', () => {
    const value = '345';

    const root = render({ value });

    expect(root.find(Form.Control)).toHaveProp('value', value);
  });

  it('calls the onChange() prop when value changes', () => {
    const onChange = jest.fn();
    const newValue = '123';

    const root = render({ onChange });

    root.find(Form.Control).simulate(
      'change',
      createFakeEvent({
        currentTarget: {
          value: newValue,
        },
      }),
    );

    expect(onChange).toHaveBeenCalledWith(newValue);
  });

  it('accepts a className', () => {
    const className = 'some-class';

    const root = render({ className });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
