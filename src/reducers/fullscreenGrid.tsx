import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

export const actions = {
  toggleMainSidePanel: createAction('TOGGLE_MAIN_SIDE_PANEL'),
};

export type FullscreenGridState = {
  mainSidePanelIsExpanded: boolean;
};

export const initialState: FullscreenGridState = {
  mainSidePanelIsExpanded: true,
};

const reducer: Reducer<FullscreenGridState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): FullscreenGridState => {
  switch (action.type) {
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
