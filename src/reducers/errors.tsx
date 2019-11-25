import { Reducer } from 'redux';
import { ActionType, deprecated, getType } from 'typesafe-actions';

// See: https://github.com/piotrwitek/typesafe-actions/issues/143
const { createAction } = deprecated;

export type ApplicationError = {
  id: number;
  message: string;
};

export type ErrorsState = {
  errors: ApplicationError[];
  nextErrorId: number;
};

export const initialState: ErrorsState = {
  errors: [],
  // This is a sequence to give each error a unique ID.
  nextErrorId: 1,
};

export const actions = {
  addError: createAction('ADD_ERROR', (resolve) => {
    return (payload: { error: Error }) => resolve(payload);
  }),
  removeError: createAction('REMOVE_ERROR', (resolve) => {
    return (payload: { id: number }) => resolve(payload);
  }),
};

const reducer: Reducer<ErrorsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): ErrorsState => {
  switch (action.type) {
    case getType(actions.addError):
      return {
        ...state,
        errors: state.errors.concat({
          id: state.nextErrorId,
          message: action.payload.error.message,
        }),
        nextErrorId: state.nextErrorId + 1,
      };
    case getType(actions.removeError):
      return {
        ...state,
        errors: state.errors.filter(({ id }) => id !== action.payload.id),
      };
    default:
      return state;
  }
};

export default reducer;
