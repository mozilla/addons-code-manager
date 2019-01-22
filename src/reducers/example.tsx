import { Reducer } from 'redux';

const TOGGLE_ON = 'TOGGLE_ON';
const TOGGLE_OFF = 'TOGGLE_OFF';

export interface ExampleState {
  toggle: 'on' | 'off';
}

export function toggleOn() {
  return {
    type: TOGGLE_ON,
    payload: {},
  };
}

export function toggleOff() {
  return {
    type: TOGGLE_OFF,
    payload: {},
  };
}

const initialState: ExampleState = {
  toggle: 'off',
};

const reducer: Reducer<ExampleState> = (state = initialState, action) => {
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
