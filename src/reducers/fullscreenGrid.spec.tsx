import reducer, { actions } from './fullscreenGrid';

describe(__filename, () => {
  describe('toggleMainSidePanel', () => {
    it('collapses the main side panel by default', () => {
      const state = reducer(undefined, actions.toggleMainSidePanel());

      expect(state.mainSidePanelIsExpanded).toEqual(false);
    });

    it('expands the main side panel if collapsed', () => {
      // Collapse the main side panel
      let state = reducer(undefined, actions.toggleMainSidePanel());
      // Expand it
      state = reducer(state, actions.toggleMainSidePanel());

      expect(state.mainSidePanelIsExpanded).toEqual(true);
    });
  });
});
