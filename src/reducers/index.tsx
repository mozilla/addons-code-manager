import { combineReducers } from 'redux';
import { RouterState, connectRouter } from 'connected-react-router';
import { History } from 'history';

import api, { ApiState } from './api';
import errors, { ErrorsState } from './errors';
import fileTree, { FileTreeState } from './fileTree';
import linter, { LinterState } from './linter';
import users, { UsersState } from './users';
import versions, { VersionsState } from './versions';

export type ApplicationState = {
  api: ApiState;
  errors: ErrorsState;
  fileTree: FileTreeState;
  linter: LinterState;
  router: RouterState;
  users: UsersState;
  versions: VersionsState;
};

const createRootReducer = (history: History) => {
  return combineReducers<ApplicationState>({
    api,
    errors,
    fileTree,
    linter,
    router: connectRouter(history),
    users,
    versions,
  });
};

export default createRootReducer;
