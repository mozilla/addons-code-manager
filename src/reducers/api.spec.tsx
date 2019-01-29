import reducer, { actions, initialState } from './api';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes the state', () => {
      const state = reducer(undefined, { type: 'SOME_ACTION' } as any);

      expect(state).toEqual(initialState);
    });

    it('sets the authentication token', () => {
      const authToken = 'token-123';
      const state = reducer(undefined, actions.setAuthToken({ authToken }));

      expect(state).toEqual({
        ...initialState,
        authToken,
      });
    });
  });
});
