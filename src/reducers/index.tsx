import { combineReducers } from 'redux';

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
  users: UsersState;
  versions: VersionsState;
};

const createRootReducer = () => {
  return combineReducers<ApplicationState>({
    api,
    errors,
    fileTree,
    linter,
    users,
    versions,
  });
};

export default createRootReducer;
