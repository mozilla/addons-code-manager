import reducer, {
  actions,
  getCurrentUser,
  getUserById,
  getUserByName,
  initialState,
} from './users';
import { fakeUser } from '../helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes the state', () => {
      const state = reducer(undefined, { type: 'SOME_ACTION' } as any);

      expect(state).toEqual(initialState);
    });

    it('loads a current user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadCurrentUser({ user }));

      expect(state).toEqual({
        ...initialState,
        currentUserId: user.id,
        byId: {
          [user.id]: user,
        },
        byName: {
          [user.name]: user.id,
        },
      });
    });

    it('loads a user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadUser({ user }));

      expect(state).toEqual({
        ...initialState,
        byId: {
          [user.id]: user,
        },
        byName: {
          [user.name]: user.id,
        },
      });
    });

    it('logs a user out', () => {
      const user = fakeUser;
      let state = reducer(undefined, actions.loadCurrentUser({ user }));
      state = reducer(state, actions.logOut());

      expect(getCurrentUser(state)).toEqual(null);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the current user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadCurrentUser({ user }));

      expect(getCurrentUser(state)).toEqual(user);
    });

    it('returns null if there is no current user', () => {
      const state = reducer(undefined, actions.loadUser({ user: fakeUser }));

      expect(getCurrentUser(state)).toEqual(null);
    });

    it('throws an exception if there is no user matching the currentUserId', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadCurrentUser({ user }));
      delete state.byId[user.id];

      expect(() => {
        getCurrentUser(state);
      }).toThrow(
        /currentUserId is defined but no matching user found in users state/,
      );
    });
  });

  describe('getUserById', () => {
    it('returns the user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadUser({ user }));

      expect(getUserById(state, user.id)).toEqual(user);
    });

    it('returns undefined if the user is not found', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadUser({ user }));

      expect(getUserById(state, user.id + 1)).toEqual(undefined);
    });
  });

  describe('getUserByName', () => {
    it('returns the user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadUser({ user }));

      expect(getUserByName(state, user.name)).toEqual(user);
    });

    it('returns undefined if the user is not found', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadUser({ user }));

      expect(getUserByName(state, `${user.name}-1`)).toEqual(undefined);
    });
  });
});
