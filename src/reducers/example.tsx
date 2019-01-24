import { Reducer } from 'redux';

enum ExampleActionTypes {
  TOGGLE = 'TOGGLE',
}

export type ExampleState = {
  toggledOn: boolean;
};

type ToggleAction = {
  type: typeof ExampleActionTypes.TOGGLE;
  payload: {};
};

export function toggle(): ToggleAction {
  return {
    type: ExampleActionTypes.TOGGLE,
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
    case ExampleActionTypes.TOGGLE:
      return { ...state, toggledOn: !state.toggledOn };
    default:
      return state;
  }
};

export default reducer;
