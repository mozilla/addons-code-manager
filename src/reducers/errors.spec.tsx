import reducer, { actions, initialState } from './errors';

describe(__filename, () => {
  describe('reducer', () => {
    it('stores an error to show', () => {
      const message = 'oops, I am an error';
      const error = new Error(message);

      const state = reducer(undefined, actions.addError({ error }));

      expect(state).toMatchObject({
        errors: [{ id: initialState.nextErrorId, message }],
      });
    });

    it('increments the next error ID when storing a new error', () => {
      let state = reducer(
        undefined,
        actions.addError({ error: new Error('Bad Request') }),
      );
      expect(state).toMatchObject({
        nextErrorId: initialState.nextErrorId + 1,
      });

      state = reducer(
        state,
        actions.addError({ error: new Error('Bad Request, again') }),
      );
      expect(state).toMatchObject({
        nextErrorId: initialState.nextErrorId + 2,
      });
    });

    it('removes an error', () => {
      let state = reducer(
        undefined,
        actions.addError({ error: new Error('Bad Request') }),
      );

      expect(state.errors.length).toEqual(1);

      const { errors } = state;
      const lastError = errors[errors.length - 1];

      state = reducer(state, actions.removeError({ id: lastError.id }));
      expect(state.errors.length).toEqual(0);
    });

    it('does not remove other errors when one error is removed', () => {
      let state = reducer(
        undefined,
        actions.addError({ error: new Error('Bad Request') }),
      );

      const error2 = new Error('Bad Request, again');
      state = reducer(state, actions.addError({ error: error2 }));

      expect(state.errors.length).toEqual(2);

      const { errors } = state;
      const firstError = errors[0];

      state = reducer(state, actions.removeError({ id: firstError.id }));
      expect(state.errors).toEqual([
        {
          id: expect.any(Number),
          message: error2.message,
        },
      ]);
    });
  });
});
