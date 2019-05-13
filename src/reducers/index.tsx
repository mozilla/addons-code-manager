import { combineReducers } from 'redux';
import { RouterState, connectRouter } from 'connected-react-router';
import { History } from 'history';

import accordionMenu, { AccordionMenuState } from './accordionMenu';
import api, { ApiState } from './api';
import errors, { ErrorsState } from './errors';
import fileTree, { FileTreeState } from './fileTree';
import fullscreenGrid, { FullscreenGridState } from './fullscreenGrid';
import linter, { LinterState } from './linter';
import users, { UsersState } from './users';
import versions, { VersionsState } from './versions';

export type ApplicationState = {
  accordionMenu: AccordionMenuState;
  api: ApiState;
  errors: ErrorsState;
  fileTree: FileTreeState;
  fullscreenGrid: FullscreenGridState;
  linter: LinterState;
  router: RouterState;
  users: UsersState;
  versions: VersionsState;
};

const createRootReducer = (history: History) => {
  return combineReducers<ApplicationState>({
    accordionMenu,
    api,
    errors,
    fileTree,
    fullscreenGrid,
    linter,
    router: connectRouter(history),
    users,
    versions,
  });
};

export default createRootReducer;
