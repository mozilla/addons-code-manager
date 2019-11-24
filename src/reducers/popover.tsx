import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

export type PopoverIdType = 'COMMENTS_SUMMARY' | 'COMPARE_VERSIONS';

export type PopoverState = {
  current: PopoverIdType | undefined;
};

export const initialState: PopoverState = {
  current: undefined,
};

export const actions = {
  hide: createAction('HIDE_POPOVER', (resolve) => {
    return (payload: PopoverIdType) => resolve(payload);
  }),
  show: createAction('SHOW_POPOVER', (resolve) => {
    return (payload: PopoverIdType) => resolve(payload);
  }),
};

export const selectPopoverIsVisible = ({
  id,
  popover,
}: {
  id: PopoverIdType;
  popover: PopoverState;
}) => {
  return popover.current === id;
};

const reducer: Reducer<PopoverState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): PopoverState => {
  switch (action.type) {
    case getType(actions.hide): {
      let { current } = state;
      if (current === action.payload) {
        current = undefined;
      }
      return { ...state, current };
    }
    case getType(actions.show): {
      return { ...state, current: action.payload };
    }
    default:
      return state;
  }
};

export default reducer;
