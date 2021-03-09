import * as React from 'react';
import { shallow } from 'enzyme';

import styles from './styles.module.scss';

import SidePanel from '.';

describe(__filename, () => {
  const render = ({
    children = <p />,
    className = 'class-name',
    isExpanded = true,
    onClick = jest.fn(),
    toggleLeft = false,
    borderless = false,
  } = {}) => {
    return shallow(
      <SidePanel
        className={className}
        isExpanded={isExpanded}
        onClick={onClick}
        toggleLeft={toggleLeft}
        borderless={borderless}
      >
        {children}
      </SidePanel>,
    );
  };

  it('adds a className when it is collapsed', () => {
    const root = render({ isExpanded: false });

    expect(root).toHaveClassName(`.${styles.isCollapsed}`);
  });

  it('accepts a className', () => {
    const className = 'a-class-name';

    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it('adds className borderlessContent when borderless is true', () => {
    const root = render({ borderless: true });

    expect(root.find(`.${styles.content}`)).toHaveClassName(
      `${styles.borderlessContent}`,
    );
  });

  it('renders no className borderlessContent when borderless is false', () => {
    const root = render({ borderless: false });

    expect(root.find(`.${styles.content}`)).not.toHaveClassName(
      `${styles.borderlessContent}`,
    );
  });

  it('renders children', () => {
    const childClass = 'child-class';
    const children = <div className={childClass} />;

    const root = render({ children });

    const content = root.find(`.${styles.content}`);
    expect(content).toHaveLength(1);
    expect(content.find(`.${childClass}`)).toHaveLength(1);
  });

  it('renders a ToggleButton', () => {
    const root = render();

    expect(root.find(`.${styles.ToggleButton}`)).toHaveLength(1);
    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp(
      'label',
      'Collapse this panel',
    );
    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp(
      'title',
      'Collapse this panel',
    );
    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp(
      'toggleLeft',
      false,
    );
  });

  it('sets a different button title/label when collapsed', () => {
    const root = render({ isExpanded: false });

    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp('label', null);
    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp(
      'title',
      'Expand this panel',
    );
  });

  it('passes the `toggleLeft` prop to the button', () => {
    const toggleLeft = true;

    const root = render({ toggleLeft });

    expect(root.find(`.${styles.ToggleButton}`)).toHaveProp(
      'toggleLeft',
      toggleLeft,
    );
  });

  it('calls the onClick prop when the button is clicked', () => {
    const onClick = jest.fn();

    const root = render({ onClick });
    root.find(`.${styles.ToggleButton}`).simulate('click');

    expect(onClick).toHaveBeenCalled();
  });
});
