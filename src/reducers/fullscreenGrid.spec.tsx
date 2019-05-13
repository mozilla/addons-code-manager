import reducer, { actions, initialState } from './fullscreenGrid';

describe(__filename, () => {
  it('is configured to expand the main side panel by default', () => {
    expect(initialState.mainSidePanelIsExpanded).toEqual(true);
  });

  it('is configured to expand the alt side panel by default', () => {
    expect(initialState.altSidePanelIsExpanded).toEqual(true);
  });

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

  describe('toggleAltSidePanel', () => {
    it('collapses the alt side panel by default', () => {
      const state = reducer(undefined, actions.toggleAltSidePanel());

      expect(state.altSidePanelIsExpanded).toEqual(false);
    });

    it('expands the alt side panel if collapsed', () => {
      // Collapse the alt side panel
      let state = reducer(undefined, actions.toggleAltSidePanel());
      // Expand it
      state = reducer(state, actions.toggleAltSidePanel());

      expect(state.altSidePanelIsExpanded).toEqual(true);
    });
  });
});
