import * as React from 'react';
import { shallow } from 'enzyme';
import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Skeleton from '../Skeleton';
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
  type RenderParams = Partial<
    PublicProps & {
      versions: ExternalVersionsList;
    }
  >;

  const render = ({
    versions = fakeVersionsList,
    ...props
  }: RenderParams = {}) => {
    const versionsMap = createVersionsMap(versions);

    const allProps = {
      id: 'anyIdString',
      isLoading: false,
      isSelectable: jest.fn().mockReturnValue(true),
      label: 'select a version',
      listedVersions: versionsMap.listed,
      onChange: jest.fn(),
      unlistedVersions: versionsMap.unlisted,
      value: undefined,
      versions,
      withLeftArrow: false,
      ...props,
    };

    return shallow(<VersionSelect {...allProps} />);
  };

  it('renders a label', () => {
    const label = 'some label';
    const root = render({ label });

    expect(root.find(Form.Label)).toHaveLength(1);
    expect(root.find(Form.Label)).toIncludeText(label);
  });

  it('associates a label with its control', () => {
    const id = 'SomeIdString';
    const root = render({ id });

    expect(root.find(Form.Label)).toHaveProp('htmlFor', id);
    expect(root.find(Form.Control)).toHaveProp('id', id);
  });

  it('does not render an arrow icon by default', () => {
    const root = render();

    expect(root.find(FontAwesomeIcon)).toHaveLength(0);
  });

  it('renders an arrow icon when withLeftArrow is true', () => {
    const root = render({ withLeftArrow: true });

    const icon = root.find(FontAwesomeIcon);
    expect(icon).toHaveLength(1);
    expect(icon).toHaveProp('icon', 'long-arrow-alt-left');
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
    expect(root.find('option').at(0)).toHaveProp('disabled', false);

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
    expect(root.find('option').at(1)).toHaveProp('disabled', false);
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

  it('passes each version to `isSelectable`', () => {
    const versions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
        id: 123,
        channel: 'listed',
        version: 'v1',
      },
      {
        ...fakeVersionsListItem,
        id: 456,
        channel: 'unlisted',
        version: 'v2',
      },
    ];
    const isSelectable = jest.fn();

    render({ isSelectable, versions });

    expect(isSelectable).toHaveBeenCalledWith(versions[0]);
    expect(isSelectable).toHaveBeenCalledWith(versions[1]);
  });

  it('marks versions as disabled when they are not selectable', () => {
    const versions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
        id: 123,
        channel: 'listed',
        version: 'v1',
      },
      {
        ...fakeVersionsListItem,
        id: 456,
        channel: 'unlisted',
        version: 'v2',
      },
    ];

    const root = render({ isSelectable: () => false, versions });

    expect(root.find('option').at(0)).toHaveProp('disabled', true);
    expect(root.find('option').at(1)).toHaveProp('disabled', true);
  });

  it('marks one versions as disabled when not selectable', () => {
    const versions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
        id: 123,
        channel: 'listed',
        version: 'v1',
      },
      {
        ...fakeVersionsListItem,
        id: 456,
        channel: 'unlisted',
        version: 'v2',
      },
    ];

    const root = render({
      // Only the second version is selectable.
      isSelectable: (version) => version.id === versions[1].id,
      versions,
    });

    expect(root.find('option').at(0)).toHaveProp('disabled', true);
    expect(root.find('option').at(1)).toHaveProp('disabled', false);
  });

  it('renders a Skeleton when component is in a loading state', () => {
    const root = render({ isLoading: true });

    expect(root.find('.form-control')).toHaveLength(1);
    expect(root.find(Skeleton)).toHaveLength(1);
  });
});
