import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
import log from 'loglevel';

import { ThunkActionCreator } from '../configureStore';
import { getVersion, isErrorResponse } from '../api';

type VersionId = number;

type LocalizedString = {
  [lang: string]: string;
};

type VersionCompatibility = {
  [appName: string]: {
    min: string;
    max: string;
  };
};

type VersionLicense = {
  id: number;
  isCustom: boolean;
  name: LocalizedString;
  text: LocalizedString;
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

export type ExternalVersionFile = {
  content: string;
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

export type ExternalVersion = {
  channel: string;
  compatibility: VersionCompatibility;
  edit_url: string;
  file: ExternalVersionFile;
  has_been_validated: boolean;
  id: VersionId;
  is_strict_compatibility_enabled: boolean;
  license: VersionLicense;
  release_notes: LocalizedString | null;
  reviewed: string;
  url: string;
  validation_url: string;
  validation_url_json: string;
  version: string;
};

export type VersionFile = {
  content: string;
  created: string;
  id: number;
  size: number;
};

type VersionEntry = {
  depth: number;
  filename: string;
  modified: string;
  path: string;
  type: VersionEntryType;
};

export type Version = {
  entries: VersionEntry[];
  id: VersionId;
  reviewed: string;
  selectedPath: string;
  version: string;
};

export const actions = {
  loadVersionFile: createAction('LOAD_VERSION_FILE', (resolve) => {
    return (payload: { path: string; version: ExternalVersion }) =>
      resolve(payload);
  }),
  loadVersionInfo: createAction('LOAD_VERSION_INFO', (resolve) => {
    return (payload: { version: ExternalVersion }) => resolve(payload);
  }),
};

export type VersionsState = {
  versionInfo: {
    [versionId: number]: Version;
  };
  versionFiles: {
    [versionId: number]: {
      [path: string]: VersionFile;
    };
  };
};

export const initialState: VersionsState = {
  versionInfo: {},
  versionFiles: {},
};

export const createInternalVersionFile = (
  file: ExternalVersionFile,
): VersionFile => {
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
    modified: entry.modified,
    path: entry.path,
    type: entry.mime_category,
  };
};

export const createInternalVersion = (version: ExternalVersion): Version => {
  return {
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

export const getVersionFile = (
  versions: VersionsState,
  versionId: VersionId,
  path: string,
) => {
  const filesForVersion = getVersionFiles(versions, versionId);

  return filesForVersion ? filesForVersion[path] : undefined;
};

export const getVersionInfo = (
  versions: VersionsState,
  versionId: VersionId,
) => {
  return versions.versionInfo[versionId];
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
    default:
      return state;
  }
};

export default reducer;
