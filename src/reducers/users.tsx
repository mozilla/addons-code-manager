import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
import log from 'loglevel';

import { ThunkActionCreator } from '../configureStore';
import { getCurrentUser, isErrorResponse, logOutFromServer } from '../api';

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
  abortFetchCurrentUser: createAction('ABORT_FETCH_CURRENT_USER'),
  beginFetchCurrentUser: createAction('BEGIN_FETCH_CURRENT_USER'),
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
  currentUser: User | null | undefined;
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

export const selectCurrentUser = (users: UsersState) => {
  return users.currentUser || null;
};

export const currentUserIsLoading = (users: UsersState) => {
  return users.currentUser === undefined;
};

export const fetchCurrentUser = ({
  _getCurrentUser = getCurrentUser,
  _log = log,
} = {}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();
    dispatch(actions.beginFetchCurrentUser());

    const response = await _getCurrentUser(apiState);

    if (isErrorResponse(response)) {
      _log.error(`TODO: handle this error response: ${response.error}`);
      dispatch(actions.abortFetchCurrentUser());
    } else {
      dispatch(actions.loadCurrentUser({ user: response }));
    }
  };
};

const reducer: Reducer<UsersState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): UsersState => {
  switch (action.type) {
    case getType(actions.beginFetchCurrentUser):
      return {
        ...state,
        currentUser: undefined,
      };
    case getType(actions.abortFetchCurrentUser):
      return {
        ...state,
        currentUser: initialState.currentUser,
      };
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
