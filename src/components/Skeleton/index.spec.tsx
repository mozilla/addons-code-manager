import * as React from 'react';
import { shallow } from 'enzyme';

import styles from './styles.module.scss';

import Skeleton from '.';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Skeleton {...props} />);
  };

  it('renders correctly', () => {
    const root = render();

    expect(root).toHaveClassName(`.${styles.skeleton}`);
  });

  it('accepts a custom className', () => {
    const className = 'foo';
    const root = render({ className });

    expect(root).toHaveClassName(`.${className}`);
  });
});
