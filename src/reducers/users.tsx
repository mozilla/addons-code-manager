import invariant from 'invariant';
import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

type UserId = number;

export type User = {
  id: UserId;
  name: string;
  email?: string;
  permissions?: Array<string>;
};

export const actions = {
  loadCurrentUser: createAction('LOAD_CURRENT_USER', (resolve) => {
    return (payload: { user: User }) => resolve(payload);
  }),
  loadUser: createAction('LOAD_USER', (resolve) => {
    return (payload: { user: User }) => resolve(payload);
  }),
  logOut: createAction('LOG_OUT', (resolve) => {
    return () => resolve({});
  }),
};

export type UsersState = {
  currentUserId: UserId | null;
  byId: { [id: number]: User };
  byName: { [name: string]: UserId };
};

export const initialState: UsersState = {
  currentUserId: null,
  byId: {},
  byName: {},
};

type LoadUserIntoStateParams = {
  isCurrentUser?: boolean;
  state: UsersState;
  user: User;
};

export const loadUserIntoState = ({
  isCurrentUser,
  state,
  user,
}: LoadUserIntoStateParams) => {
  const newState = {
    ...state,
    byId: { ...state.byId, [user.id]: user },
    byName: { ...state.byName, [user.name]: user.id },
  };
  if (isCurrentUser) {
    newState.currentUserId = user.id;
  }
  return newState;
};

export const getCurrentUser = (users: UsersState) => {
  if (!users.currentUserId) {
    return null;
  }

  const currentUser = getUserById(users, users.currentUserId);

  invariant(
    currentUser,
    'currentUserId is defined but no matching user found in users state.',
  );

  return currentUser;
};

export const getUserById = (users: UsersState, id: UserId) => {
  return users.byId[id];
};

export const getUserByName = (users: UsersState, name: string) => {
  return users.byId[users.byName[name]];
};

const reducer: Reducer<UsersState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): UsersState => {
  switch (action.type) {
    case getType(actions.loadCurrentUser):
      return loadUserIntoState({
        isCurrentUser: true,
        state,
        user: action.payload.user,
      });
    case getType(actions.loadUser):
      return loadUserIntoState({
        state,
        user: action.payload.user,
      });
    case getType(actions.logOut):
      return {
        ...state,
        currentUserId: null,
      };
    default:
      return state;
  }
};

export default reducer;
