import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';
import { logOutFromServer } from '../api';

type UserId = number;

export type ExternalUser = {
  average_addon_rating: number;
  biography: string | null;
  created: string;
  has_anonymous_display_name: boolean;
  has_anonymous_username: boolean;
  homepage: string | null;
  id: UserId;
  is_addon_developer: boolean;
  is_artist: boolean;
  location: string | null;
  name: string;
  num_addons_listed: number;
  occupation: string | null;
  picture_type: string | null;
  picture_url: string | null;
  username: string;
  // Properties returned if we are accessing our own profile or the current user
  // has the `Users:Edit` permission.
  deleted?: boolean;
  display_name: string | null;
  email?: string;
  fxa_edit_email_url?: string;
  is_verified?: boolean;
  last_login?: string;
  last_login_ip?: string;
  permissions?: string[];
  read_dev_agreement?: boolean;
};

export type User = {
  id: UserId;
  name: string;
  email?: string;
  permissions?: string[];
};

export const actions = {
  loadCurrentUser: createAction('LOAD_CURRENT_USER', (resolve) => {
    return (payload: { user: ExternalUser }) => resolve(payload);
  }),
  logOut: createAction('LOG_OUT'),
};

export const requestLogOut = ({
  _logOutFromServer = logOutFromServer,
} = {}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    await _logOutFromServer(getState().api);
    dispatch(actions.logOut());
  };
};

export type UsersState = {
  currentUser: User | null;
};

export const initialState: UsersState = {
  currentUser: null,
};

export const createInternalUser = (user: ExternalUser): User => {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    permissions: user.permissions,
  };
};

export const getCurrentUser = (users: UsersState) => {
  return users.currentUser;
};

const reducer: Reducer<UsersState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): UsersState => {
  switch (action.type) {
    case getType(actions.loadCurrentUser):
      return {
        ...state,
        currentUser: createInternalUser(action.payload.user),
      };
    case getType(actions.logOut):
      return {
        ...state,
        currentUser: null,
      };
    default:
      return state;
  }
};

export default reducer;
