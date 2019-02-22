import { getType } from 'typesafe-actions';

import reducer, {
  actions,
  createInternalUser,
  currentUserIsLoading,
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

  describe('beginLoadCurrentUser', () => {
    it('sets the current user to undefined', () => {
      const state = reducer(undefined, actions.beginLoadCurrentUser());

      expect(state.currentUser).toEqual(undefined);
    });
  });

  describe('abortLoadCurrentUser', () => {
    it('resets the current user state', () => {
      let state;
      state = reducer(state, actions.beginLoadCurrentUser());
      state = reducer(state, actions.abortLoadCurrentUser());

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

    it('returns null while the user is loading', () => {
      const state = reducer(undefined, actions.beginLoadCurrentUser());

      expect(getCurrentUser(state)).toEqual(null);
    });
  });

  describe('currentUserIsLoading', () => {
    it('returns false before a user has loaded', () => {
      expect(currentUserIsLoading(initialState)).toEqual(false);
    });

    it('returns true while the user is loading', () => {
      const state = reducer(undefined, actions.beginLoadCurrentUser());

      expect(currentUserIsLoading(state)).toEqual(true);
    });

    it('returns false after aborting loading the user', () => {
      let state;
      state = reducer(state, actions.beginLoadCurrentUser());
      state = reducer(state, actions.abortLoadCurrentUser());

      expect(currentUserIsLoading(state)).toEqual(false);
    });

    it('returns false when a user has loaded', () => {
      const state = reducer(
        undefined,
        actions.loadCurrentUser({ user: fakeUser }),
      );

      expect(currentUserIsLoading(state)).toEqual(false);
    });

    it('returns false after the user has logged out', () => {
      let state;
      state = reducer(state, actions.loadCurrentUser({ user: fakeUser }));
      state = reducer(state, actions.logOut());

      expect(currentUserIsLoading(state)).toEqual(false);
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
    const _fetchCurrentUserProfile = (params = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchCurrentUserProfile({
            _getCurrentUserProfile: jest
              .fn()
              .mockReturnValue(Promise.resolve(fakeUser)),
            ...params,
          }),
      });
    };

    it('calls getCurrentUserProfile', async () => {
      const _getCurrentUserProfile = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeUser));

      const { store, thunk } = _fetchCurrentUserProfile({
        _getCurrentUserProfile,
      });

      await thunk();

      expect(_getCurrentUserProfile).toHaveBeenCalledWith(store.getState().api);
    });

    it('dispatches beginLoadCurrentUser before an API request', async () => {
      const { dispatch, thunk } = _fetchCurrentUserProfile();

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.beginLoadCurrentUser());
    });

    it('dispatches loadCurrentUser when API response is successful', async () => {
      const user = fakeUser;
      const _getCurrentUserProfile = jest
        .fn()
        .mockReturnValue(Promise.resolve(user));

      const { dispatch, thunk } = _fetchCurrentUserProfile({
        _getCurrentUserProfile,
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

      const { dispatch, thunk } = _fetchCurrentUserProfile({
        _log,
        _getCurrentUserProfile,
      });

      await thunk();

      expect(_log.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: getType(actions.loadCurrentUser),
        }),
      );
    });

    it('aborts loading a user when API response is not successful', async () => {
      const _getCurrentUserProfile = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchCurrentUserProfile({
        _getCurrentUserProfile,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.abortLoadCurrentUser());
    });
  });
});
