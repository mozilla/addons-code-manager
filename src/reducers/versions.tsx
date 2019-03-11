import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
import log from 'loglevel';

import { ThunkActionCreator } from '../configureStore';
import { getVersion, getVersionsList, isErrorResponse } from '../api';
import { LocalizedStringMap } from '../utils';

type VersionId = number;

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
  id: VersionId;
  is_strict_compatibility_enabled: boolean;
  license: VersionLicense;
  release_notes: LocalizedStringMap | null;
  reviewed: string;
  url: string;
  validation_url: string;
  validation_url_json: string;
  version: string;
};

type ExternalChange = {
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
  id: number;
  size: number;
};

export type VersionFile = {
  content: string;
  created: string;
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
  id: VersionId;
  reviewed: string;
  selectedPath: string;
  version: string;
};

type VersionsListItem = {
  channel: 'unlisted' | 'listed';
  id: VersionId;
  version: string;
};

export type ExternalVersionsListItem = VersionsListItem;

export type ExternalVersionsList = ExternalVersionsListItem[];

export type VersionsList = VersionsListItem[];

export type VersionsMap = {
  listed: VersionsList;
  unlisted: VersionsList;
};

export const actions = {
  loadVersionFile: createAction('LOAD_VERSION_FILE', (resolve) => {
    return (payload: { path: string; version: ExternalVersionWithContent }) =>
      resolve(payload);
  }),
  loadVersionInfo: createAction('LOAD_VERSION_INFO', (resolve) => {
    return (payload: { version: ExternalVersionWithContent }) =>
      resolve(payload);
  }),
  updateSelectedPath: createAction('UPDATE_SELECTED_PATH', (resolve) => {
    return (payload: { selectedPath: string; versionId: VersionId }) =>
      resolve(payload);
  }),
  loadVersionsList: createAction('LOAD_VERSIONS_LIST', (resolve) => {
    return (payload: { addonId: number; versions: ExternalVersionsList }) =>
      resolve(payload);
  }),
};

export type VersionsState = {
  byAddonId: {
    [addonId: number]: VersionsMap;
  };
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
  versionInfo: {},
  versionFiles: {},
};

export const createInternalVersionFile = (
  file: ExternalVersionFileWithContent,
): InternalVersionFile => {
  return {
    content: file.content,
    created: file.created,
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
  version: ExternalVersionWithContent,
): Version => {
  return {
    addon: createInternalVersionAddon(version.addon),
    entries: Object.keys(version.file.entries).map((nodeName) => {
      return createInternalVersionEntry(version.file.entries[nodeName]);
    }),
    id: version.id,
    reviewed: version.reviewed,
    selectedPath: version.file.selected_file,
    version: version.version,
  };
};

export const getVersionFiles = (
  versions: VersionsState,
  versionId: VersionId,
) => {
  return versions.versionFiles[versionId];
};

export const getVersionInfo = (
  versions: VersionsState,
  versionId: VersionId,
) => {
  return versions.versionInfo[versionId];
};

export const getVersionFile = (
  versions: VersionsState,
  versionId: VersionId,
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
  _log = log,
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
      _log.error(`TODO: handle this error response: ${response.error}`);
    } else {
      dispatch(actions.loadVersionInfo({ version: response }));
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

const reducer: Reducer<VersionsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
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
        versionFiles: {
          [version.id]: {
            ...state.versionFiles[version.id],
            [version.file.selected_file]: createInternalVersionFile(
              version.file,
            ),
          },
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
    default:
      return state;
  }
};

export default reducer;
