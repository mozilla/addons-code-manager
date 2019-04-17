import * as React from 'react';
import { shallow } from 'enzyme';

import styles from './styles.module.scss';

import Skeleton from '.';

describe(__filename, () => {
  const render = () => {
    return shallow(<Skeleton />);
  };

  it('renders correctly', () => {
    const root = render();

    expect(root).toHaveClassName(`.${styles.skeleton}`);
  });
});
