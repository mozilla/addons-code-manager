import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

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

const reducer: Reducer<ApiState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): ApiState => {
  switch (action.type) {
    case getType(actions.setAuthToken):
      return { ...state, authToken: action.payload.authToken };
    default:
      return state;
  }
};

export default reducer;
