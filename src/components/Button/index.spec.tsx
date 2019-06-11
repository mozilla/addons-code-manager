import * as React from 'react';
import { shallow } from 'enzyme';
import BsButton from 'react-bootstrap/Button';

import styles from './styles.module.scss';

import Button from '.';

describe(__filename, () => {
  const render = (overrides = {}) => {
    const props = {
      onClick: jest.fn(),
      ...overrides,
    };
    return shallow(<Button {...props} />);
  };

  it('renders a button and children', () => {
    const className = 'example-className';
    const title = 'example-title';
    const ariaControls = 'example-aria-controls';
    const children = 'example-chilren';

    const root = render({
      children,
      className,
      title,
      ariaControls,
    });
    const button = root.find(BsButton);

    expect(button).toHaveLength(1);
    expect(button).toHaveClassName(styles.button);
    expect(button).toHaveClassName(className);
    expect(button).toHaveProp('title', title);
    expect(button).toHaveProp('aria-controls', ariaControls);

    expect(button.text()).toEqual(children);
  });

  it('calls the `onClick` prop when clicked', () => {
    const onClick = jest.fn();
    const root = render({ onClick });
    root.simulate('click');
    expect(onClick).toHaveBeenCalled();
  });
});
