import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
import log from 'loglevel';
import { DiffInfo, DiffInfoType } from 'react-diff-view';

import { ThunkActionCreator } from '../configureStore';
import { getDiff, getVersion, getVersionsList, isErrorResponse } from '../api';
import { LocalizedStringMap } from '../utils';
import { actions as errorsActions } from './errors';

type VersionCompatibility = {
  [appName: string]: {
    min: string;
    max: string;
  };
};

type VersionLicense = {
  id: number;
  isCustom: boolean;
  name: LocalizedStringMap;
  text: LocalizedStringMap;
  url: string;
};

export type VersionEntryType = 'image' | 'directory' | 'text' | 'binary';

export type ExternalVersionEntry = {
  depth: number;
  filename: string;
  mime_category: VersionEntryType;
  mimetype: string;
  modified: string;
  path: string;
  sha256: string;
  size: number | null;
};

type PartialExternalVersionFile = {
  created: string;
  download_url: string | null;
  entries: {
    [nodeName: string]: ExternalVersionEntry;
  };
  hash: string;
  id: number;
  is_mozilla_signed_extension: boolean;
  is_restart_required: boolean;
  is_webextension: boolean;
  permissions: string[];
  platform: string;
  selected_file: string;
  size: number;
  status: string;
  url: string;
};

export type ExternalVersionAddon = {
  icon_url: string;
  id: number;
  name: LocalizedStringMap;
  slug: string;
};

type PartialExternalVersion = {
  addon: ExternalVersionAddon;
  channel: string;
  compatibility: VersionCompatibility;
  edit_url: string;
  has_been_validated: boolean;
  id: number;
  is_strict_compatibility_enabled: boolean;
  license: VersionLicense;
  release_notes: LocalizedStringMap | null;
  reviewed: string;
  url: string;
  validation_url: string;
  validation_url_json: string;
  version: string;
};

export type ExternalChange = {
  content: string;
  new_line_number: number;
  old_line_number: number;
  type: 'normal' | 'delete' | 'insert';
};

type ExternalHunk = {
  changes: ExternalChange[];
  header: string;
  new_lines: number;
  new_start: number;
  old_lines: number;
  old_start: number;
};

type ExternalDiff = {
  hash: string;
  hunks: ExternalHunk[];
  is_binary: boolean;
  lines_added: number;
  lines_deleted: number;
  mode: string;
  new_ending_new_line: boolean;
  old_ending_new_line: boolean;
  old_path: string;
  parent: string;
  path: string;
  size: number;
};

export type ExternalVersionFileWithContent = PartialExternalVersionFile & {
  content: string;
};

export type ExternalVersionFileWithDiff = PartialExternalVersionFile & {
  diff: ExternalDiff[];
};

export type ExternalVersionWithContent = PartialExternalVersion & {
  file: ExternalVersionFileWithContent;
};

export type ExternalVersionWithDiff = PartialExternalVersion & {
  file: ExternalVersionFileWithDiff;
};

// This is how we store file information, but the getVersionFile selector
// returns more info, which is defined in VersionFile, below.
type InternalVersionFile = {
  content: string;
  created: string;
  downloadURL: string | null;
  id: number;
  size: number;
};

export type VersionFile = {
  content: string;
  created: string;
  downloadURL: string | null;
  filename: string;
  id: number;
  mimeType: string;
  sha256: string;
  size: number;
  type: VersionEntryType;
  version: string;
};

type VersionEntry = {
  depth: number;
  filename: string;
  mimeType: string;
  modified: string;
  path: string;
  sha256: string;
  type: VersionEntryType;
};

type VersionAddon = {
  iconUrl: string;
  id: number;
  name: LocalizedStringMap;
  slug: string;
};

export type Version = {
  addon: VersionAddon;
  entries: VersionEntry[];
  expandedPaths: string[];
  id: number;
  reviewed: string;
  selectedPath: string;
  validationURL: string;
  version: string;
};

type VersionsListItem = {
  channel: 'unlisted' | 'listed';
  id: number;
  version: string;
};

export type ExternalVersionsListItem = VersionsListItem;

export type ExternalVersionsList = ExternalVersionsListItem[];

export type VersionsList = VersionsListItem[];

export type VersionsMap = {
  listed: VersionsList;
  unlisted: VersionsList;
};

export type CompareInfo = {
  diffs: DiffInfo[];
  mimeType: string;
};

export const actions = {
  loadVersionFile: createAction('LOAD_VERSION_FILE', (resolve) => {
    return (payload: { path: string; version: ExternalVersionWithContent }) =>
      resolve(payload);
  }),
  loadVersionInfo: createAction('LOAD_VERSION_INFO', (resolve) => {
    return (payload: {
      version: ExternalVersionWithContent | ExternalVersionWithDiff;
    }) => resolve(payload);
  }),
  updateSelectedPath: createAction('UPDATE_SELECTED_PATH', (resolve) => {
    return (payload: { selectedPath: string; versionId: number }) =>
      resolve(payload);
  }),
  toggleExpandedPath: createAction('TOGGLE_EXPANDED_PATH', (resolve) => {
    return (payload: { path: string; versionId: number }) => resolve(payload);
  }),
  loadVersionsList: createAction('LOAD_VERSIONS_LIST', (resolve) => {
    return (payload: { addonId: number; versions: ExternalVersionsList }) =>
      resolve(payload);
  }),
  beginFetchDiff: createAction('BEGIN_FETCH_DIFF'),
  abortFetchDiff: createAction('ABORT_FETCH_DIFF'),
  loadDiff: createAction('LOAD_DIFF', (resolve) => {
    return (payload: {
      addonId: number;
      baseVersionId: number;
      headVersionId: number;
      version: ExternalVersionWithDiff;
      path?: string;
    }) => resolve(payload);
  }),
};

export type VersionsState = {
  byAddonId: {
    [addonId: number]: VersionsMap;
  };
  compareInfo:
    | CompareInfo // data successfully loaded
    | null // an error has occured
    | undefined; // data not fetched yet
  versionInfo: {
    [versionId: number]: Version;
  };
  versionFiles: {
    [versionId: number]: {
      [path: string]: InternalVersionFile;
    };
  };
};

export const initialState: VersionsState = {
  byAddonId: {},
  compareInfo: undefined,
  versionFiles: {},
  versionInfo: {},
};

export const createInternalVersionFile = (
  file: ExternalVersionFileWithContent,
): InternalVersionFile => {
  return {
    content: file.content,
    created: file.created,
    downloadURL: file.download_url,
    id: file.id,
    size: file.size,
  };
};

export const createInternalVersionEntry = (
  entry: ExternalVersionEntry,
): VersionEntry => {
  return {
    depth: entry.depth,
    filename: entry.filename,
    mimeType: entry.mimetype,
    modified: entry.modified,
    path: entry.path,
    sha256: entry.sha256,
    type: entry.mime_category,
  };
};

export const createInternalVersionAddon = (
  addon: ExternalVersionAddon,
): VersionAddon => {
  return {
    iconUrl: addon.icon_url,
    id: addon.id,
    name: addon.name,
    slug: addon.slug,
  };
};

export const createInternalVersion = (
  version: ExternalVersionWithContent | ExternalVersionWithDiff,
): Version => {
  return {
    addon: createInternalVersionAddon(version.addon),
    entries: Object.keys(version.file.entries).map((nodeName) => {
      return createInternalVersionEntry(version.file.entries[nodeName]);
    }),
    expandedPaths: [],
    id: version.id,
    reviewed: version.reviewed,
    selectedPath: version.file.selected_file,
    version: version.version,
    validationURL: version.validation_url_json,
  };
};

export const getVersionFiles = (versions: VersionsState, versionId: number) => {
  return versions.versionFiles[versionId];
};

export const getVersionInfo = (versions: VersionsState, versionId: number) => {
  return versions.versionInfo[versionId];
};

export const getVersionFile = (
  versions: VersionsState,
  versionId: number,
  path: string,
  { _log = log } = {},
): VersionFile | void => {
  const version = getVersionInfo(versions, versionId);
  const filesForVersion = getVersionFiles(versions, versionId);

  if (version && filesForVersion) {
    const file = filesForVersion[path];
    const entry = versions.versionInfo[versionId].entries.find(
      (e) => e.path === path,
    );

    if (!entry) {
      _log.debug(`Entry missing for path: ${path}, versionId: ${versionId}`);
      return undefined;
    }

    if (file) {
      return {
        ...file,
        filename: entry.filename,
        mimeType: entry.mimeType,
        sha256: entry.sha256,
        type: entry.type,
        version: version.version,
      };
    }
  }

  // The version or file was not found.
  return undefined;
};

type FetchVersionParams = {
  _log?: typeof log;
  _getVersion?: typeof getVersion;
  addonId: number;
  versionId: number;
};

export const fetchVersion = ({
  _getVersion = getVersion,
  addonId,
  versionId,
}: FetchVersionParams): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    const response = await _getVersion({
      addonId,
      apiState,
      versionId,
    });

    if (isErrorResponse(response)) {
      dispatch(errorsActions.addError({ error: response.error }));
    } else {
      dispatch(actions.loadVersionInfo({ version: response }));
      dispatch(
        actions.loadVersionFile({
          version: response,
          path: response.file.selected_file,
        }),
      );
    }
  };
};

type FetchVersionFileParams = {
  _getVersion?: typeof getVersion;
  _log?: typeof log;
  addonId: number;
  path: string;
  versionId: number;
};

export const fetchVersionFile = ({
  _getVersion = getVersion,
  _log = log,
  addonId,
  path,
  versionId,
}: FetchVersionFileParams): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    dispatch(actions.updateSelectedPath({ selectedPath: path, versionId }));

    const response = await _getVersion({
      addonId,
      apiState,
      versionId,
      path,
    });

    if (isErrorResponse(response)) {
      _log.error(`TODO: handle this error response: ${response.error}`);
    } else {
      dispatch(actions.loadVersionFile({ path, version: response }));
    }
  };
};

export const createVersionsMap = (
  versions: ExternalVersionsList,
): VersionsMap => {
  const listed = versions.filter((version) => version.channel === 'listed');
  const unlisted = versions.filter((version) => version.channel === 'unlisted');

  return {
    listed,
    unlisted,
  };
};

type FetchVersionsListParams = {
  _getVersionsList?: typeof getVersionsList;
  _log?: typeof log;
  addonId: number;
};

export const fetchVersionsList = ({
  _getVersionsList = getVersionsList,
  _log = log,
  addonId,
}: FetchVersionsListParams): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    const response = await _getVersionsList({ addonId, apiState });

    if (isErrorResponse(response)) {
      _log.error(`TODO: handle this error response: ${response.error}`);
    } else {
      dispatch(actions.loadVersionsList({ addonId, versions: response }));
    }
  };
};

type CreateInternalDiffsParams = {
  version: ExternalVersionWithDiff;
  baseVersionId: number;
  headVersionId: number;
};

// This function returns an array of objects compatible with `react-diff-view`.
export const createInternalDiffs = ({
  baseVersionId,
  headVersionId,
  version,
}: CreateInternalDiffsParams) => {
  const GIT_STATUS_TO_TYPE: { [status: string]: DiffInfoType } = {
    A: 'add',
    C: 'copy',
    D: 'delete',
    M: 'modify',
    R: 'rename',
  };

  return version.file.diff.map(
    (diff: ExternalDiff): DiffInfo => {
      return {
        newRevision: String(headVersionId),
        oldRevision: String(baseVersionId),
        hunks: diff.hunks.map((hunk: ExternalHunk) => ({
          changes: hunk.changes.map((change: ExternalChange) => ({
            content: change.content,
            isDelete: change.type === 'delete',
            isInsert: change.type === 'insert',
            isNormal: change.type === 'normal',
            lineNumber:
              change.type === 'insert'
                ? change.new_line_number
                : change.old_line_number,
            newLineNumber: change.new_line_number,
            oldLineNumber: change.old_line_number,
            type: change.type,
          })),
          content: hunk.header,
          isPlain: false,
          newLines: hunk.new_lines,
          newStart: hunk.new_start,
          oldLines: hunk.old_lines,
          oldStart: hunk.old_start,
        })),
        type: GIT_STATUS_TO_TYPE[diff.mode] || GIT_STATUS_TO_TYPE.M,
        newEndingNewLine: diff.new_ending_new_line,
        oldEndingNewLine: diff.old_ending_new_line,
        newMode: diff.mode,
        oldMode: diff.mode,
        newPath: diff.path,
        oldPath: diff.old_path,
      };
    },
  );
};

type FetchDiffParams = {
  _getDiff?: typeof getDiff;
  _log?: typeof log;
  addonId: number;
  baseVersionId: number;
  headVersionId: number;
  path?: string;
};

export const fetchDiff = ({
  _getDiff = getDiff,
  _log = log,
  addonId,
  baseVersionId,
  headVersionId,
  path,
}: FetchDiffParams): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    dispatch(actions.beginFetchDiff());

    const response = await _getDiff({
      addonId,
      apiState,
      baseVersionId,
      headVersionId,
      path,
    });

    if (isErrorResponse(response)) {
      _log.error(`TODO: handle this error response: ${response.error}`);
      dispatch(actions.abortFetchDiff());
    } else {
      dispatch(actions.loadVersionInfo({ version: response }));
      dispatch(
        actions.loadDiff({
          addonId,
          baseVersionId,
          headVersionId,
          path,
          version: response,
        }),
      );
    }
  };
};

const reducer: Reducer<VersionsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
  { _log = log } = {},
): VersionsState => {
  switch (action.type) {
    case getType(actions.loadVersionInfo): {
      const { version } = action.payload;

      return {
        ...state,
        versionInfo: {
          ...state.versionInfo,
          [version.id]: createInternalVersion(version),
        },
      };
    }
    case getType(actions.loadVersionFile): {
      const { path, version } = action.payload;

      return {
        ...state,
        versionFiles: {
          ...state.versionFiles,
          [version.id]: {
            ...state.versionFiles[version.id],
            [path]: createInternalVersionFile(version.file),
          },
        },
      };
    }
    case getType(actions.updateSelectedPath): {
      const { selectedPath, versionId } = action.payload;

      return {
        ...state,
        versionInfo: {
          ...state.versionInfo,
          [versionId]: {
            ...state.versionInfo[versionId],
            selectedPath,
          },
        },
      };
    }
    case getType(actions.toggleExpandedPath): {
      const { path, versionId } = action.payload;

      const { expandedPaths } = state.versionInfo[versionId];

      return {
        ...state,
        versionInfo: {
          ...state.versionInfo,
          [versionId]: {
            ...state.versionInfo[versionId],
            expandedPaths: expandedPaths.includes(path)
              ? expandedPaths.filter((storedPath) => path !== storedPath)
              : [...expandedPaths, path],
          },
        },
      };
    }
    case getType(actions.loadVersionsList): {
      const { addonId, versions } = action.payload;

      return {
        ...state,
        byAddonId: {
          ...state.byAddonId,
          [addonId]: createVersionsMap(versions),
        },
      };
    }
    case getType(actions.beginFetchDiff): {
      return {
        ...state,
        compareInfo: undefined,
      };
    }
    case getType(actions.abortFetchDiff): {
      return {
        ...state,
        compareInfo: null,
      };
    }
    case getType(actions.loadDiff): {
      const { baseVersionId, headVersionId, version } = action.payload;

      const { entries, selectedPath } = getVersionInfo(state, headVersionId);
      const entry = entries.find((e) => e.path === selectedPath);

      if (!entry) {
        _log.debug(`Entry missing for headVersionId: ${headVersionId}`);
        return state;
      }

      return {
        ...state,
        compareInfo: {
          diffs: createInternalDiffs({
            baseVersionId,
            headVersionId,
            version,
          }),
          mimeType: entry.mimeType,
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
