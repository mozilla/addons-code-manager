import React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import { Store } from 'redux';

import styles from './styles.module.scss';
import configureStore from '../../configureStore';
import { actions as apiActions } from '../../reducers/api';

import App from '.';

describe(__filename, () => {
  type RenderParams = {
    store?: Store;
    authToken?: string | null;
  };

  const render = ({
    store = configureStore(),
    authToken = 'some-token',
  }: RenderParams = {}): ShallowWrapper => {
    // TODO: Use shallowUntilTarget()
    // https://github.com/mozilla/addons-code-manager/issues/15
    const root = shallow(<App authToken={authToken} />, {
      context: { store },
    }).shallow();

    return root;
  };

  it('renders without crashing', () => {
    const root = render();

    expect(root).toHaveClassName(styles.container);
    expect(root.find(`.${styles.header}`)).toHaveLength(1);
  });

  it('dispatches setAuthToken on mount when authToken is valid', () => {
    const authToken = 'my-token';
    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ authToken, store });

    expect(dispatch).toHaveBeenCalledWith(
      apiActions.setAuthToken({ authToken }),
    );
  });

  it('does not dispatch setAuthToken on mount when authToken is null', () => {
    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ authToken: null, store });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
