import { shallow } from 'enzyme';
import React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import LoginButton from '../LoginButton';
import styles from './styles.module.scss';
import { fakeUser } from '../../test-helpers';
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
    const createFakeThunk = () => {
      // This is a placeholder for the dispatch callback function.
      // In reality it would look like (dispatch, getState) => {}
      const dispatchCallback = '__dispatchCallback__';
      return {
        // This is a function that creates the dispatch callback.
        creator: jest.fn().mockReturnValue(dispatchCallback),
        dispatchCallback,
      };
    };

    it('dispatches requestLogOut when clicked', () => {
      const store = storeWithUser();
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockImplementation(jest.fn());

      const fakeThunk = createFakeThunk();
      const root = render({
        store,
        _requestLogOut: fakeThunk.creator,
      });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(dispatch).toHaveBeenCalledWith(fakeThunk.dispatchCallback);
    });
  });
});
