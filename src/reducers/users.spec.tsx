import reducer, {
  actions,
  createInternalUser,
  fetchCurrentUserProfile,
  getCurrentUser,
  initialState,
  requestLogOut,
} from './users';
import { getFakeLogger, fakeUser, thunkTester } from '../test-helpers';

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

  describe('requestLogOut', () => {
    it('calls logOutFromServer', async () => {
      const _logOutFromServer = jest.fn();
      const { store, thunk } = thunkTester({
        createThunk: () => requestLogOut({ _logOutFromServer }),
      });

      await thunk();

      expect(_logOutFromServer).toHaveBeenCalledWith(store.getState().api);
    });

    it('dispatches logOut', async () => {
      const { dispatch, thunk } = thunkTester({
        createThunk: () => requestLogOut({ _logOutFromServer: jest.fn() }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.logOut());
    });
  });

  describe('fetchCurrentUserProfile', () => {
    it('calls getCurrentuserProfile', async () => {
      const _getCurrentUserProfile = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeUser));

      const { store, thunk } = thunkTester({
        createThunk: () => fetchCurrentUserProfile({ _getCurrentUserProfile }),
      });

      await thunk();

      expect(_getCurrentUserProfile).toHaveBeenCalledWith(store.getState().api);
    });

    it('dispatches loadCurrentUser when API response is successful', async () => {
      const user = fakeUser;
      const _getCurrentUserProfile = jest
        .fn()
        .mockReturnValue(Promise.resolve(user));

      const { dispatch, thunk } = thunkTester({
        createThunk: () => fetchCurrentUserProfile({ _getCurrentUserProfile }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.loadCurrentUser({ user }));
    });

    it('logs an error when API response is not successful', async () => {
      const _log = getFakeLogger();

      const _getCurrentUserProfile = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          fetchCurrentUserProfile({ _log, _getCurrentUserProfile }),
      });

      await thunk();

      expect(_log.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
