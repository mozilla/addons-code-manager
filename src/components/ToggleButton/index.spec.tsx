import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './styles.module.scss';

import ToggleButton from '.';

describe(__filename, () => {
  const render = (overrides = {}) => {
    const props = {
      onClick: jest.fn(),
      ...overrides,
    };

    return shallow(<ToggleButton {...props} />);
  };

  it('renders a button', () => {
    const root = render();

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button).toHaveProp('title', 'Toggle this panel');
    expect(button).toHaveClassName(`${styles.ToggleButton}`);
  });

  it('renders a label if supplied', () => {
    const label = 'some label';

    const root = render({ label });

    // By default, the label is rendered before the icon.
    expect(root.childAt(0)).toIncludeText(label);
  });

  it('renders an icon', () => {
    const root = render();

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'angle-double-right');
  });

  it(`inverts the button's direction when toggleLeft is true`, () => {
    const label = 'text should be after the icon';

    const root = render({ label, toggleLeft: true });

    expect(root.childAt(0).type()).toEqual(FontAwesomeIcon);
    expect(root.childAt(0)).toHaveProp('icon', 'angle-double-left');
    expect(root.childAt(1)).toIncludeText(label);
  });

  it('calls the `onClick` prop when the button is clicked', () => {
    const onClick = jest.fn();

    const root = render({ onClick });
    root.simulate('click');

    expect(onClick).toHaveBeenCalled();
  });
});
