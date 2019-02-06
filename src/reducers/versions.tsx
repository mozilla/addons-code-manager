import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

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

export type ExternalVersionEntry = {
  binary: boolean | string;
  depth: number;
  directory: boolean;
  filename: string;
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

type VersionFile = {
  content: string;
  created: string;
  id: number;
  size: number;
};

export enum VersionEntryType {
  image,
  binary,
  text,
  directory,
}

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
  version: string;
};

export const actions = {
  loadVersionFile: createAction('LOAD_VERSION_FILE', (resolve) => {
    return (payload: { filename: string; version: ExternalVersion }) =>
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
      [filename: string]: VersionFile;
    };
  };
};

export const initialState: VersionsState = {
  versionInfo: {},
  versionFiles: {},
};

export const getVersionEntryType = (entry: ExternalVersionEntry) => {
  if (entry.directory) {
    return VersionEntryType.directory;
  }
  if (entry.binary === 'image') {
    return VersionEntryType.image;
  }
  if (entry.binary) {
    return VersionEntryType.binary;
  }
  return VersionEntryType.text;
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

export const createInternalVersion = (version: ExternalVersion): Version => {
  return {
    entries: Object.keys(version.file.entries).map((nodeName) => {
      const entry = version.file.entries[nodeName];
      return {
        type: getVersionEntryType(entry),
        depth: entry.depth,
        filename: entry.filename,
        modified: entry.modified,
        path: entry.path,
      };
    }),
    id: version.id,
    reviewed: version.reviewed,
    version: version.version,
  };
};

export const getVersionFile = (
  filename: string,
  versions: VersionsState,
  versionId: VersionId,
) => {
  const filesForVersion = versions.versionFiles[versionId];
  return filesForVersion ? filesForVersion[filename] : undefined;
};

export const getVersionInfo = (
  versions: VersionsState,
  versionId: VersionId,
) => {
  return versions.versionInfo[versionId];
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
      };
    }
    case getType(actions.loadVersionFile): {
      const { filename, version } = action.payload;
      return {
        ...state,
        versionFiles: {
          ...state.versionFiles,
          [version.id]: {
            ...state.versionFiles[version.id],
            [filename]: createInternalVersionFile(version.file),
          },
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
