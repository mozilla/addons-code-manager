import { Reducer } from 'redux';
import { ActionType, deprecated, getType } from 'typesafe-actions';

// See: https://github.com/piotrwitek/typesafe-actions/issues/143
const { createAction } = deprecated;

export const actions = {
  toggleAltSidePanel: createAction('TOGGLE_ALT_SIDE_PANEL'),
  toggleMainSidePanel: createAction('TOGGLE_MAIN_SIDE_PANEL'),
};

export type FullscreenGridState = {
  altSidePanelIsExpanded: boolean;
  mainSidePanelIsExpanded: boolean;
};

export const initialState: FullscreenGridState = {
  altSidePanelIsExpanded: true,
  mainSidePanelIsExpanded: true,
};

const reducer: Reducer<FullscreenGridState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): FullscreenGridState => {
  switch (action.type) {
    case getType(actions.toggleAltSidePanel):
      return {
        ...state,
        altSidePanelIsExpanded: !state.altSidePanelIsExpanded,
      };
    case getType(actions.toggleMainSidePanel):
      return {
        ...state,
        mainSidePanelIsExpanded: !state.mainSidePanelIsExpanded,
      };
    default:
      return state;
  }
};

export default reducer;
