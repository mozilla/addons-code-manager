import reducer, {
  actions,
  createInternalUser,
  getCurrentUser,
  initialState,
} from './users';

import { fakeUser } from '../test-helpers';
import configureStore from '../configureStore';

describe(__filename, () => {
  let store = configureStore();

  beforeEach(() => {
    store = configureStore();
  });

  describe('reducer', () => {
    it('loads a current user', () => {
      const user = fakeUser;
      store.dispatch(actions.loadCurrentUser({ user }));

      expect(store.getState().users).toEqual({
        ...initialState,
        currentUser: createInternalUser(user),
      });
    });

    it('logs a user out', () => {
      store.dispatch(actions.loadCurrentUser({ user: fakeUser }));
      store.dispatch(actions.logOut());

      expect(getCurrentUser(store.getState().users)).toEqual(null);
    });
  });

  describe('createInternalUser', () => {
    it('creates a User', () => {
      const user = fakeUser;
      expect(createInternalUser(user)).toEqual({
        email: user.email,
        id: user.id,
        name: user.name,
        permissions: user.permissions,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the current user', () => {
      const user = fakeUser;
      store.dispatch(actions.loadCurrentUser({ user }));

      expect(getCurrentUser(store.getState().users)).toEqual(
        createInternalUser(user),
      );
    });

    it('returns null if there is no current user', () => {
      const state = initialState;

      expect(getCurrentUser(state)).toEqual(null);
    });
  });
});
