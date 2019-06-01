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
    return shallow(<Button {...props}>example-children</Button>);
  };

  it('renders a button and children', () => {
    const root = render({
      className: 'example-className',
      title: 'example-title',
      'aria-controls': 'example-aria-controls',
    });
    const button = root.find(BsButton);

    expect(button).toHaveLength(1);
    expect(button).toHaveClassName(styles.button);
    expect(button).toHaveClassName('example-className');
    expect(button).toHaveProp('title', 'example-title');
    expect(button).toHaveProp('aria-controls', 'example-aria-controls');

    expect(button.text()).toEqual('example-children');
  });

  it('calls the `onClick` prop when clicked', () => {
    const onClick = jest.fn();
    const root = render({ onClick });
    root.simulate('click');
    expect(onClick).toHaveBeenCalled();
  });
});
