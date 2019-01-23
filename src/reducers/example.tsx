import { Reducer } from 'redux';

const TOGGLE_ON = 'TOGGLE_ON';
const TOGGLE_OFF = 'TOGGLE_OFF';

export interface ExampleState {
  toggle: 'on' | 'off';
}

interface ToggleOnAction {
  type: typeof TOGGLE_ON;
  payload: {};
}

export function toggleOn(): ToggleOnAction {
  return {
    type: TOGGLE_ON,
    payload: {},
  };
}

interface ToggleOffAction {
  type: typeof TOGGLE_OFF;
  payload: {};
}

export function toggleOff(): ToggleOffAction {
  return {
    type: TOGGLE_OFF,
    payload: {},
  };
}

const initialState: ExampleState = {
  toggle: 'off',
};

type ActionTypes = ToggleOnAction | ToggleOffAction;

const reducer: Reducer<ExampleState, ActionTypes> = (
  state = initialState,
  action,
): ExampleState => {
  switch (action.type) {
    case TOGGLE_ON:
      return { ...state, toggle: 'on' };
    case TOGGLE_OFF:
      return { ...state, toggle: 'off' };
    default:
      return state;
  }
};

export default reducer;
