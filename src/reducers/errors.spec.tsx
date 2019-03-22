import reducer, { actions, initialState } from './errors';

describe(__filename, () => {
  describe('reducer', () => {
    it('stores an error to show', () => {
      const message = 'oops, I am an error';
      const error = new Error(message);

      const state = reducer(undefined, actions.showError({ error }));

      expect(state).toMatchObject({
        errors: [{ id: initialState.nextErrorId, message }],
      });
    });

    it('increments the next error ID when storing a new error', () => {
      let state = reducer(
        undefined,
        actions.showError({ error: new Error('Bad Request') }),
      );
      expect(state).toMatchObject({
        nextErrorId: initialState.nextErrorId + 1,
      });

      state = reducer(
        state,
        actions.showError({ error: new Error('Bad Request, again') }),
      );
      expect(state).toMatchObject({
        nextErrorId: initialState.nextErrorId + 2,
      });
    });

    it('removes an error when dismissed', () => {
      let state = reducer(
        undefined,
        actions.showError({ error: new Error('Bad Request') }),
      );

      expect(state.errors.length).toEqual(1);

      const { errors } = state;
      const lastError = errors[errors.length - 1];

      state = reducer(state, actions.dismissError({ id: lastError.id }));
      expect(state.errors.length).toEqual(0);
    });

    it('does not update the next error ID when dismissing an error', () => {
      const prevState = reducer(
        undefined,
        actions.showError({ error: new Error('Bad Request') }),
      );

      const newState = reducer(
        prevState,
        actions.dismissError({ id: prevState.errors[0].id }),
      );

      expect(newState).toMatchObject({ nextErrorId: prevState.nextErrorId });
    });
  });
});
