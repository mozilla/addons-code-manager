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
  } = {}) => {
    return shallow(
      <SidePanel
        className={className}
        isExpanded={isExpanded}
        onClick={onClick}
        toggleLeft={toggleLeft}
      >
        {children}
      </SidePanel>,
    );
  };

  it('marks the top-level as expanded when it is expanded', () => {
    const root = render({ isExpanded: true });

    expect(root).toHaveProp('aria-expanded', 'true');
  });

  it('adds a className and marks the top-level as collapsed when it is collapsed', () => {
    const root = render({ isExpanded: false });

    expect(root).toHaveProp('aria-expanded', 'false');
    expect(root).toHaveClassName(`.${styles.isCollapsed}`);
  });

  it('accepts a className', () => {
    const className = 'a-class-name';

    const root = render({ className });

    expect(root).toHaveClassName(className);
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
