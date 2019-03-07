import { getType } from 'typesafe-actions';

import reducer, {
  ExternalVersionsList,
  VersionEntryType,
  actions,
  createInternalVersion,
  createInternalVersionAddon,
  createInternalVersionEntry,
  createInternalVersionFile,
  createVersionsMap,
  fetchVersion,
  fetchVersionFile,
  fetchVersionsList,
  getVersionFile,
  getVersionFiles,
  getVersionInfo,
  initialState,
} from './versions';
import {
  fakeVersion,
  fakeVersionAddon,
  fakeVersionEntry,
  fakeVersionFile,
  fakeVersionsList,
  fakeVersionsListItem,
  getFakeLogger,
  thunkTester,
} from '../test-helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('loads a version file', () => {
      const path = 'test.js';
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionFile({ path, version }),
      );

      expect(state).toEqual({
        ...initialState,
        versionFiles: {
          [version.id]: {
            [path]: createInternalVersionFile(version.file),
          },
        },
      });
    });

    it('preserves existing files', () => {
      const path1 = 'test1.js';
      const path2 = 'test2.js';
      const version = fakeVersion;

      let state = reducer(
        undefined,
        actions.loadVersionFile({ path: path1, version }),
      );
      state = reducer(state, actions.loadVersionFile({ path: path2, version }));

      expect(state).toEqual({
        ...initialState,
        versionFiles: {
          [version.id]: {
            [path1]: createInternalVersionFile(version.file),
            [path2]: createInternalVersionFile(version.file),
          },
        },
      });
    });

    it('loads version info and the default file', () => {
      const version = fakeVersion;
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state).toEqual({
        ...initialState,
        versionInfo: {
          [version.id]: createInternalVersion(version),
        },
        versionFiles: {
          [version.id]: {
            [version.file.selected_file]: createInternalVersionFile(
              version.file,
            ),
          },
        },
      });
    });

    it('updates a selected path for a given version', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state).toHaveProperty(
        `versionInfo.${version.id}.selectedPath`,
        version.file.selected_file,
      );

      const selectedPath = 'new/selected/path';
      state = reducer(
        state,
        actions.updateSelectedPath({ selectedPath, versionId: version.id }),
      );

      expect(state).toHaveProperty(
        `versionInfo.${version.id}.selectedPath`,
        selectedPath,
      );
    });

    it('stores lists of versions by add-on ID', () => {
      const addonId = 1245;
      const versions = fakeVersionsList;

      const state = reducer(
        undefined,
        actions.loadVersionsList({ addonId, versions }),
      );

      expect(state.byAddonId[addonId]).toEqual(createVersionsMap(versions));
    });
  });

  describe('createInternalVersionAddon', () => {
    it('creates a VersionAddon', () => {
      const addon = fakeVersionAddon;

      expect(createInternalVersionAddon(addon)).toEqual({
        iconUrl: addon.icon_url,
        id: addon.id,
        name: addon.name,
        slug: addon.slug,
      });
    });
  });

  describe('createInternalVersionEntry', () => {
    it('creates a VersionEntry', () => {
      const entry = { ...fakeVersionEntry, filename: 'entry' };

      expect(createInternalVersionEntry(entry)).toEqual({
        depth: entry.depth,
        filename: entry.filename,
        mimeType: entry.mimetype,
        modified: entry.modified,
        path: entry.path,
        type: entry.mime_category,
      });
    });
  });

  describe('createInternalVersion', () => {
    it('creates a Version', () => {
      const version = fakeVersion;
      const entry = version.file.entries[Object.keys(version.file.entries)[0]];

      expect(createInternalVersion(version)).toEqual({
        addon: createInternalVersionAddon(version.addon),
        entries: [createInternalVersionEntry(entry)],
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
        selectedPath: version.file.selected_file,
      });
    });

    it('creates a Version with multiple entries', () => {
      const entry1 = { ...fakeVersionEntry, filename: 'entry1' };
      const entry2 = { ...fakeVersionEntry, filename: 'entry2' };
      const file = {
        ...fakeVersionFile,
        entries: {
          'file1.js': entry1,
          'file2.js': entry2,
        },
      };
      const version = { ...fakeVersion, file };

      expect(createInternalVersion(version)).toEqual({
        addon: createInternalVersionAddon(version.addon),
        entries: [
          createInternalVersionEntry(entry1),
          createInternalVersionEntry(entry2),
        ],
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
        selectedPath: version.file.selected_file,
      });
    });
  });

  describe('getVersionFile', () => {
    /* eslint-disable @typescript-eslint/camelcase */
    it('returns a version file', () => {
      const mimeType = 'mime/type';
      const path = 'test.js';
      const type = 'text';
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersionFile,
          entries: {
            [path]: {
              ...fakeVersionEntry,
              mime_category: type as VersionEntryType,
              mimetype: mimeType,
              path,
            },
          },
          selected_file: path,
        },
      };
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(getVersionFile(state, version.id, path)).toEqual({
        ...createInternalVersionFile(version.file),
        mimeType,
        type,
      });
    });
    /* eslint-enable @typescript-eslint/camelcase */

    it('returns undefined if there is no version found', () => {
      const state = initialState;

      expect(getVersionFile(state, 1, 'some-file-name.js')).toEqual(undefined);
    });

    it('returns undefined if there is no file for the path', () => {
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionInfo({ version: fakeVersion }),
      );

      expect(getVersionFile(state, version.id, 'path-to-unknown-file')).toEqual(
        undefined,
      );
    });

    it('returns undefined if there is no entry for the path', () => {
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionInfo({ version: fakeVersion }),
      );

      // We have to manually remove the entry to test this. This is because the
      // condition that checks for a file will return undefined before we reach
      // this test under normal circumstances.
      state.versionInfo[version.id].entries = [];
      expect(
        getVersionFile(state, version.id, version.file.selected_file),
      ).toEqual(undefined);
    });

    it('logs a debug message if there is no entry for the path', async () => {
      const _log = getFakeLogger();

      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionInfo({ version: fakeVersion }),
      );

      // We have to manually remove the entry to test this. This is because the
      // condition that checks for a file will return undefined before we reach
      // this test under normal circumstances.
      state.versionInfo[version.id].entries = [];
      getVersionFile(state, version.id, version.file.selected_file, { _log });

      expect(_log.debug).toHaveBeenCalled();
    });
  });

  describe('getVersionFiles', () => {
    it('returns all the files for a given version', () => {
      const path1 = 'test.js';
      const path2 = 'function.js';
      const version = fakeVersion;

      let state = reducer(
        undefined,
        actions.loadVersionFile({ path: path1, version }),
      );
      state = reducer(state, actions.loadVersionFile({ path: path2, version }));

      const internalVersionFile = createInternalVersionFile(version.file);
      expect(getVersionFiles(state, version.id)).toEqual({
        [path1]: internalVersionFile,
        [path2]: internalVersionFile,
      });
    });

    it('returns undefined if there are no files found', () => {
      expect(getVersionFiles(initialState, 1)).toEqual(undefined);
    });
  });

  describe('getVersionInfo', () => {
    it('returns version info', () => {
      const version = fakeVersion;
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(getVersionInfo(state, version.id)).toEqual(
        createInternalVersion(version),
      );
    });

    it('returns undefined if there is no version found', () => {
      const state = initialState;

      expect(getVersionInfo(state, 1)).toEqual(undefined);
    });
  });

  describe('fetchVersion', () => {
    it('calls getVersion', async () => {
      const version = fakeVersion;
      const _getVersion = jest.fn().mockReturnValue(Promise.resolve(version));

      const addonId = 123;
      const versionId = version.id;

      const { store, thunk } = thunkTester({
        createThunk: () => fetchVersion({ _getVersion, addonId, versionId }),
      });

      await thunk();

      expect(_getVersion).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        versionId,
      });
    });

    it('dispatches loadVersionInfo when API response is successful', async () => {
      const version = fakeVersion;
      const _getVersion = jest.fn().mockReturnValue(Promise.resolve(version));

      const addonId = 123;
      const versionId = version.id;

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          fetchVersion({
            _getVersion,
            addonId,
            versionId,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadVersionInfo({
          version,
        }),
      );
    });

    it('logs an error when API response is not successful', async () => {
      const _log = getFakeLogger();

      const _getVersion = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const addonId = 123;
      const versionId = 456;

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          fetchVersion({
            _getVersion,
            _log,
            addonId,
            versionId,
          }),
      });

      await thunk();

      expect(_log.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('fetchVersionFile', () => {
    const _fetchVersionFile = ({
      _log = getFakeLogger(),
      addonId = 123,
      path = 'some/path.js',
      version = fakeVersion,
      _getVersion = jest.fn().mockReturnValue(Promise.resolve(version)),
    } = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchVersionFile({
            _getVersion,
            _log,
            addonId,
            path,
            versionId: version.id,
          }),
      });
    };

    it('calls getVersion', async () => {
      const addonId = 123;
      const path = 'some/path.js';
      const version = fakeVersion;

      const _getVersion = jest.fn().mockReturnValue(Promise.resolve(version));

      const { store, thunk } = _fetchVersionFile({
        _getVersion,
        addonId,
        path,
        version,
      });

      await thunk();

      expect(_getVersion).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        versionId: version.id,
        path,
      });
    });

    it('dispatches updateSelectedPath', async () => {
      const version = fakeVersion;
      const path = 'some/path.js';

      const { dispatch, thunk } = _fetchVersionFile({ version, path });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.updateSelectedPath({
          selectedPath: path,
          versionId: version.id,
        }),
      );
    });

    it('dispatches loadVersionFile when API response is successful', async () => {
      const version = fakeVersion;
      const path = 'some/path.js';

      const { dispatch, thunk } = _fetchVersionFile({ version, path });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadVersionFile({
          path,
          version,
        }),
      );
    });

    it('logs an error when API response is not successful', async () => {
      const _log = getFakeLogger();

      const _getVersion = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchVersionFile({ _log, _getVersion });

      await thunk();

      expect(_log.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: getType(actions.loadVersionFile),
        }),
      );
    });
  });

  describe('fetchVersionsList', () => {
    const _fetchVersionsList = ({
      _getVersionsList = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeVersionsList)),
      _log = getFakeLogger(),
      addonId = 123,
    } = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchVersionsList({
            _getVersionsList,
            _log,
            addonId,
          }),
      });
    };

    it('calls getVersionsList', async () => {
      const addonId = 123;
      const _getVersionsList = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeVersionsList));

      const { store, thunk } = _fetchVersionsList({
        _getVersionsList,
        addonId,
      });

      await thunk();

      expect(_getVersionsList).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
      });
    });

    it('dispatches loadVersionsList when API response is successful', async () => {
      const addonId = 123;
      const versions = fakeVersionsList;
      const _getVersionsList = jest
        .fn()
        .mockReturnValue(Promise.resolve(versions));

      const { dispatch, thunk } = _fetchVersionsList({
        _getVersionsList,
        addonId,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadVersionsList({ addonId, versions }),
      );
    });

    it('logs an error when API response is not successful', async () => {
      const _log = getFakeLogger();
      const _getVersionsList = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchVersionsList({
        _getVersionsList,
        _log,
      });

      await thunk();

      expect(_log.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: getType(actions.loadVersionsList),
        }),
      );
    });
  });

  describe('createVersionsMap', () => {
    it('splits a list of versions into listed and unlisted versions', () => {
      const listedVersions: ExternalVersionsList = [
        {
          ...fakeVersionsListItem,
          id: 1,
          channel: 'listed',
        },
      ];
      const unlistedVersions: ExternalVersionsList = [
        {
          ...fakeVersionsListItem,
          id: 2,
          channel: 'unlisted',
        },
        {
          ...fakeVersionsListItem,
          id: 3,
          channel: 'unlisted',
        },
      ];
      const versions = [...listedVersions, ...unlistedVersions];

      const { listed, unlisted } = createVersionsMap(versions);

      expect(listed).toHaveLength(listedVersions.length);
      expect(unlisted).toHaveLength(unlistedVersions.length);

      listedVersions.forEach((version, index) => {
        expect(listed[index]).toEqual(version);
      });

      unlistedVersions.forEach((version, index) => {
        expect(unlisted[index]).toEqual(version);
      });
    });
  });
});
