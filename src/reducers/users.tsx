import { AnyAction, Dispatch, Reducer } from 'redux';
import { Cmd, Loop, LoopReducer, loop } from 'redux-loop';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { logOutFromServer } from '../api';
import { ApplicationState } from '../configureStore';

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
  requestLogOut: createAction('REQUEST_LOG_OUT'),
};

const doLogOut = async (
  dispatch: Dispatch,
  getState: () => ApplicationState,
) => {
  console.log('Doing the log out');
  await logOutFromServer(getState().api);
  dispatch(actions.logOut());
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

export type Actions = ActionType<typeof actions>;

const reducer: LoopReducer<UsersState, Actions> = (
  state: UsersState = initialState,
  // TODO: this type seems wrong because it removes any
  // type safety for action payloads.
  action: AnyAction,
): UsersState | Loop<UsersState, Actions> => {
  switch (action.type) {
    case getType(actions.requestLogOut):
      return loop(
        { ...state },
        Cmd.run(doLogOut, {
          args: [Cmd.dispatch, Cmd.getState],
        }),
      );
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
