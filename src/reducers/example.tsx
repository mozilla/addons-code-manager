import { Reducer } from 'redux';

const TOGGLE = 'TOGGLE';

export type ExampleState = {
  toggledOn: boolean;
};

type ToggleAction = {
  type: typeof TOGGLE;
  payload: {};
};

export function toggle(): ToggleAction {
  return {
    type: TOGGLE,
    payload: {},
  };
}

const initialState: ExampleState = {
  toggledOn: false,
};

type ActionTypes = ToggleAction; // | OtherAction | AnotherAction

const reducer: Reducer<ExampleState, ActionTypes> = (
  state = initialState,
  action,
): ExampleState => {
  switch (action.type) {
    case TOGGLE:
      return { ...state, toggledOn: !state.toggledOn };
    default:
      return state;
  }
};

export default reducer;
