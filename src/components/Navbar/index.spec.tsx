import { shallow } from 'enzyme';
import React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import LoginButton from '../LoginButton';
import styles from './styles.module.scss';
import { fakeUser } from '../../test-helpers';
import { logOutFromServer } from '../../api';
import { actions as userActions } from '../../reducers/users';

import Navbar from '.';

describe(__filename, () => {
  type RenderParams = {
    _logOutFromServer?: typeof logOutFromServer;
    store?: Store;
  };

  const render = ({
    _logOutFromServer = jest.fn(),
    store = configureStore(),
  }: RenderParams = {}) => {
    // TODO: Use shallowUntilTarget()
    // https://github.com/mozilla/addons-code-manager/issues/15
    const root = shallow(<Navbar _logOutFromServer={_logOutFromServer} />, {
      context: { store },
    }).shallow();

    return root;
  };

  const storeWithUser = (user = fakeUser) => {
    const store = configureStore();

    store.dispatch(userActions.loadCurrentUser({ user }));
    return store;
  };

  describe('when a profile is provided', () => {
    it('renders a username', () => {
      const name = 'Bob';
      const store = storeWithUser({ ...fakeUser, name });
      const root = render({ store });

      expect(root.find(`.${styles.username}`)).toHaveText(name);
    });

    it('renders a log out button', () => {
      const root = render({ store: storeWithUser() });

      expect(root.find(`.${styles.logOut}`)).toHaveLength(1);
    });

    it('does not render a log in button', () => {
      const root = render({ store: storeWithUser() });

      expect(root.find(LoginButton)).toHaveLength(0);
    });
  });

  describe('when profile is null', () => {
    it('does not render a username', () => {
      const root = render();

      expect(root.find(`.${styles.username}`)).toHaveLength(0);
    });

    it('renders a log in button', () => {
      const root = render();

      expect(root.find(LoginButton)).toHaveLength(1);
    });

    it('does not render a log out button', () => {
      const root = render();

      expect(root.find(`.${styles.logOut}`)).toHaveLength(0);
    });
  });

  describe('Log out button', () => {
    it('calls logOutFromServer when clicked', () => {
      const logOutFromServerMock = jest.fn();
      const root = render({
        _logOutFromServer: logOutFromServerMock,
        store: storeWithUser(),
      });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(logOutFromServerMock).toHaveBeenCalled();
    });

    it('dispatches userActions.logOut when clicked', () => {
      const store = storeWithUser();
      const dispatch = jest.spyOn(store, 'dispatch');

      const root = render({ store });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(dispatch).toHaveBeenCalledWith(userActions.logOut());
    });
  });
});
