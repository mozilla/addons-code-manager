import { Reducer } from 'redux';
import { ActionType, deprecated, getType } from 'typesafe-actions';

// See: https://github.com/piotrwitek/typesafe-actions/issues/143
const { createAction } = deprecated;

type SetAuthSessionIdPayload = {
  userAuthSessionId: string;
};

export const actions = {
  setAuthSessionId: createAction('SET_AUTH_SESSION_ID', (resolve) => {
    return (payload: SetAuthSessionIdPayload) => resolve(payload);
  }),
};

export type ApiState = {
  userAuthSessionId: string | null;
};

export const initialState: ApiState = {
  userAuthSessionId: null,
};

const reducer: Reducer<ApiState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): ApiState => {
  switch (action.type) {
    case getType(actions.setAuthSessionId):
      return { ...state, userAuthSessionId: action.payload.userAuthSessionId };
    default:
      return state;
  }
};

export default reducer;
