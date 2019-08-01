import { shallow } from 'enzyme';
import React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import LoginButton from '../LoginButton';
import styles from './styles.module.scss';
import {
  createFakeThunk,
  createStoreWithVersion,
  fakeUser,
  fakeVersion,
  fakeVersionAddon,
  spyOn,
} from '../../test-helpers';
import { actions as userActions, requestLogOut } from '../../reducers/users';

import Navbar from '.';

describe(__filename, () => {
  type RenderParams = {
    _requestLogOut?: typeof requestLogOut;
    store?: Store;
  };

  const render = ({
    _requestLogOut = jest.fn(),
    store = configureStore(),
  }: RenderParams = {}) => {
    // TODO: Use shallowUntilTarget()
    // https://github.com/mozilla/addons-code-manager/issues/15
    const root = shallow(<Navbar _requestLogOut={_requestLogOut} />, {
      context: { store },
    }).shallow();

    return root;
  };

  const storeWithUser = (user = fakeUser) => {
    const store = configureStore();

    store.dispatch(userActions.loadCurrentUser({ user }));
    return store;
  };

  describe('when a version is loaded', () => {
    it('renders addon name', () => {
      const addonName = 'addon name example';
      const store = createStoreWithVersion({
        version: {
          ...fakeVersion,
          addon: { ...fakeVersionAddon, name: { 'en-US': addonName } },
        },
        makeCurrent: true,
      });
      const root = render({ store });

      expect(root.find(`.${styles.addonName}`)).toHaveText(addonName);
    });
  });

  describe('when version is undefined', () => {
    it('does not render addon name', () => {
      const root = render();

      expect(root.find(`.${styles.addonName}`)).toHaveLength(0);
    });
  });

  describe('when a user is provided', () => {
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

  describe('when user is null', () => {
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
    it('dispatches requestLogOut when clicked', () => {
      const store = storeWithUser();
      const dispatch = spyOn(store, 'dispatch');

      const fakeThunk = createFakeThunk();
      const root = render({
        store,
        _requestLogOut: fakeThunk.createThunk,
      });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    });
  });
});
