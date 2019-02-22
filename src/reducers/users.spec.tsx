import { getType } from 'typesafe-actions';

import reducer, {
  actions,
  createInternalUser,
  currentUserIsLoading,
  fetchCurrentUser,
  initialState,
  requestLogOut,
  selectCurrentUser,
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

      expect(selectCurrentUser(state)).toEqual(null);
    });
  });

  describe('beginFetchCurrentUser', () => {
    it('sets the current user to undefined', () => {
      const state = reducer(undefined, actions.beginFetchCurrentUser());

      expect(state.currentUser).toEqual(undefined);
    });
  });

  describe('abortFetchCurrentUser', () => {
    it('resets the current user state', () => {
      let state;
      state = reducer(state, actions.beginFetchCurrentUser());
      state = reducer(state, actions.abortFetchCurrentUser());

      expect(selectCurrentUser(state)).toEqual(null);
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

  describe('selectCurrentUser', () => {
    it('returns the current user', () => {
      const user = fakeUser;
      const state = reducer(undefined, actions.loadCurrentUser({ user }));

      expect(selectCurrentUser(state)).toEqual(createInternalUser(user));
    });

    it('returns null if there is no current user', () => {
      const state = initialState;

      expect(selectCurrentUser(state)).toEqual(null);
    });

    it('returns null while the user is loading', () => {
      const state = reducer(undefined, actions.beginFetchCurrentUser());

      expect(selectCurrentUser(state)).toEqual(null);
    });
  });

  describe('currentUserIsLoading', () => {
    it('returns false before a user has loaded', () => {
      expect(currentUserIsLoading(initialState)).toEqual(false);
    });

    it('returns true while the user is loading', () => {
      const state = reducer(undefined, actions.beginFetchCurrentUser());

      expect(currentUserIsLoading(state)).toEqual(true);
    });

    it('returns false after aborting loading the user', () => {
      let state;
      state = reducer(state, actions.beginFetchCurrentUser());
      state = reducer(state, actions.abortFetchCurrentUser());

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

  describe('fetchCurrentUser', () => {
    const _fetchCurrentUser = (params = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchCurrentUser({
            _getCurrentUser: jest
              .fn()
              .mockReturnValue(Promise.resolve(fakeUser)),
            ...params,
          }),
      });
    };

    it('calls selectCurrentUser', async () => {
      const _getCurrentUser = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeUser));

      const { store, thunk } = _fetchCurrentUser({ _getCurrentUser });

      await thunk();

      expect(_getCurrentUser).toHaveBeenCalledWith(store.getState().api);
    });

    it('dispatches beginFetchCurrentUser before an API request', async () => {
      const { dispatch, thunk } = _fetchCurrentUser();

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.beginFetchCurrentUser());
    });

    it('dispatches loadCurrentUser when API response is successful', async () => {
      const user = fakeUser;
      const _getCurrentUser = jest.fn().mockReturnValue(Promise.resolve(user));

      const { dispatch, thunk } = _fetchCurrentUser({ _getCurrentUser });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.loadCurrentUser({ user }));
    });

    it('logs an error when API response is not successful', async () => {
      const _log = getFakeLogger();

      const _getCurrentUser = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchCurrentUser({
        _log,
        _getCurrentUser,
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
      const _getCurrentUser = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchCurrentUser({ _getCurrentUser });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.abortFetchCurrentUser());
    });
  });
});
