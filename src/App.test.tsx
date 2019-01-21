import React from 'react';
import { shallow } from 'enzyme';

import App from './App';
import styles from './App.module.scss';

it('renders without crashing', () => {
  const root = shallow(<App />);

  expect(root).toHaveClassName(styles.container);
  expect(root.find(styles.header)).toHaveLength(1);
});
