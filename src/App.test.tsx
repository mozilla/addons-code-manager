import React from 'react';
import { mount, shallow } from 'enzyme';

import App from './App';
import styles from './App.module.scss';
import configureStore from './configureStore';

it('renders without crashing', () => {
  const store = configureStore();
  // TODO: Use shallowUntilTarget()
  // https://github.com/mozilla/addons-code-manager/issues/15
  const root = shallow(<App />, { context: { store } }).shallow();

  expect(root).toHaveClassName(styles.container);
  expect(root.find(styles.header)).toHaveLength(1);
});
