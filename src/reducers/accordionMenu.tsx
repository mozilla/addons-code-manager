import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

export const actions = {
  toggleItem: createAction('TOGGLE_ACCORDION_ITEM', (resolve) => {
    return (payload: { itemId: string }) => resolve(payload);
  }),
};

export type AccordionMenuState = {
  expanded: string | null;
};

export const initialState: AccordionMenuState = {
  expanded: null,
};

export const isExpanded = (state: AccordionMenuState, itemId: string) => {
  return state.expanded === itemId;
};

const reducer: Reducer<AccordionMenuState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): AccordionMenuState => {
  switch (action.type) {
    case getType(actions.toggleItem): {
      const { itemId } = action.payload;
      return { ...state, expanded: isExpanded(state, itemId) ? null : itemId };
    }
    default:
      return state;
  }
};

export default reducer;
