import reducer, { actions, initialState, isExpanded } from './accordionMenu';

describe(__filename, () => {
  describe('toggleItem', () => {
    it('expands an item by default', () => {
      const itemId = 'any item ID';

      const state = reducer(undefined, actions.toggleItem({ itemId }));

      expect(state.expanded).toEqual(itemId);
    });

    it('collapses an item if expanded', () => {
      const itemId = 'any item ID';

      let state;
      // Expand it:
      state = reducer(state, actions.toggleItem({ itemId }));
      // This should collapse it:
      state = reducer(state, actions.toggleItem({ itemId }));

      expect(state.expanded).toEqual(null);
    });

    it('expands an item if collapsed', () => {
      const itemId = 'any item ID';
      let state;

      // Expand and collapse:
      state = reducer(state, actions.toggleItem({ itemId }));
      state = reducer(state, actions.toggleItem({ itemId }));

      // This should expand it again:
      state = reducer(state, actions.toggleItem({ itemId }));

      expect(state.expanded).toEqual(itemId);
    });

    it('overrides any previously expanded item', () => {
      const itemId = 'any item ID';
      let state;

      state = reducer(state, actions.toggleItem({ itemId: 'first item' }));
      state = reducer(state, actions.toggleItem({ itemId }));

      expect(state.expanded).toEqual(itemId);
    });
  });

  describe('isExpanded', () => {
    it('returns false before anything has been expanded', () => {
      expect(isExpanded(initialState, 'some item ID')).toEqual(false);
    });

    it('returns true for an expanded item', () => {
      const itemId = 'some item ID';
      const state = reducer(undefined, actions.toggleItem({ itemId }));

      expect(isExpanded(state, itemId)).toEqual(true);
    });

    it('returns false for a not expanded item', () => {
      const itemId = 'some item ID';
      const state = reducer(
        undefined,
        actions.toggleItem({ itemId: 'another item ID' }),
      );

      expect(isExpanded(state, itemId)).toEqual(false);
    });
  });
});
