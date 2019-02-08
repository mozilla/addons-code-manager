import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
import { Cmd, Loop, LoopReducer, loop } from 'redux-loop';

type SetAuthTokenPayload = {
  authToken: string;
};

export const actions = {
  setAuthToken: createAction('SET_AUTH_TOKEN', (resolve) => {
    return (payload: SetAuthTokenPayload) => resolve(payload);
  }),
};

export type ApiState = {
  authToken: string | null;
};

export const initialState: ApiState = {
  authToken: null,
};

export type Action = ActionType<typeof actions>

const reducer: LoopReducer<ApiState, Action> = (
  state: ApiState = initialState,
  action: Action,
): ApiState | Loop<ApiState, Action> => {
  switch (action.type) {
    case getType(actions.setAuthToken):
      return { ...state, authToken: action.payload.authToken };
    default:
      return state;
  }
};

export default reducer;
