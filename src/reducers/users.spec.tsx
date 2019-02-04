import reducer, {
  actions,
  createInternalUser,
  getCurrentUser,
  initialState,
} from './users';
import { fakeUser } from '../test-helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('loads a current user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadCurrentUser({ user }));

      expect(state).toEqual({
        ...initialState,
        currentUser: createInternalUser(user),
      });
    });

    it('logs a user out', () => {
      const user = fakeUser;
      let state = reducer(undefined, actions.loadCurrentUser({ user }));
      state = reducer(state, actions.logOut());

      expect(getCurrentUser(state)).toEqual(null);
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
      const state = reducer(undefined, actions.loadCurrentUser({ user }));

      expect(getCurrentUser(state)).toEqual(createInternalUser(user));
    });

    it('returns null if there is no current user', () => {
      const state = initialState;

      expect(getCurrentUser(state)).toEqual(null);
    });
  });
});
