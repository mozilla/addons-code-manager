import { getType } from 'typesafe-actions';
import { push } from 'connected-react-router';

import { actions as errorsActions } from './errors';
import reducer, {
  ExternalVersionWithDiff,
  ExternalVersionsList,
  Version,
  VersionEntryType,
  actions,
  createInternalDiffs,
  createInternalVersion,
  createInternalVersionAddon,
  createInternalVersionEntry,
  createInternalVersionFile,
  createVersionsMap,
  fetchDiff,
  fetchVersion,
  fetchVersionFile,
  fetchVersionsList,
  getParentFolders,
  getVersionFile,
  getVersionFiles,
  getVersionInfo,
  initialState,
  isFileLoading,
  viewVersionFile,
} from './versions';
import { ROOT_PATH } from './fileTree';
import configureStore from '../configureStore';
import {
  createFakeEntry,
  createFakeHistory,
  createFakeLocation,
  createFakeLogger,
  fakeExternalDiff,
  fakeVersion,
  fakeVersionAddon,
  fakeVersionEntry,
  fakeVersionFile,
  fakeVersionWithDiff,
  fakeVersionsList,
  fakeVersionsListItem,
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

      expect(state).toEqual(
        expect.objectContaining({
          versionFiles: {
            [version.id]: {
              [path]: createInternalVersionFile(version.file),
            },
          },
        }),
      );
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

      expect(state).toEqual(
        expect.objectContaining({
          versionFiles: {
            [version.id]: {
              [path1]: createInternalVersionFile(version.file),
              [path2]: createInternalVersionFile(version.file),
            },
          },
        }),
      );
    });

    it('loads version info', () => {
      const version = fakeVersion;
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state).toEqual({
        ...initialState,
        versionInfo: {
          [version.id]: createInternalVersion(version),
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

    it('throws an error when updateSelectedPath is called for an unknown version', () => {
      expect(() => {
        reducer(
          undefined,
          actions.updateSelectedPath({ selectedPath: 'pa/th', versionId: 123 }),
        );
      }).toThrow();
    });

    it('expands all parent folders when updateSelectedPath is dispatched', () => {
      const selectedPath = 'folder1/folder2/file1.js';

      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      state = reducer(
        state,
        actions.updateSelectedPath({ selectedPath, versionId: version.id }),
      );

      expect(state).toHaveProperty(
        `versionInfo.${version.id}.expandedPaths`,
        getParentFolders(selectedPath),
      );
    });

    it('retains all expanded folders when updateSelectedPath is dispatched', () => {
      const newFolder = 'newFolder';
      const file = 'file.js';
      const selectedPath = `${newFolder}/${file}`;

      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const { expandedPaths } = getVersionInfo(state, version.id) as Version;

      const initialPath = 'new/selected/path';
      state = reducer(
        state,
        actions.toggleExpandedPath({
          path: initialPath,
          versionId: version.id,
        }),
      );

      state = reducer(
        state,
        actions.updateSelectedPath({ selectedPath, versionId: version.id }),
      );

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        ...expandedPaths,
        initialPath,
        newFolder,
      ]);
    });

    it('throws an error when toggleExpandedPath is called for an unknown version', () => {
      expect(() => {
        reducer(
          undefined,
          actions.toggleExpandedPath({ path: 'pa/th', versionId: 123 }),
        );
      }).toThrow();
    });

    it('does not duplicate paths in expandedPaths when updateSelectedPath is dispatched', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const { expandedPaths } = getVersionInfo(state, version.id) as Version;

      const path = 'path1';
      state = reducer(
        state,
        actions.toggleExpandedPath({
          path,
          versionId: version.id,
        }),
      );

      state = reducer(
        state,
        actions.updateSelectedPath({
          selectedPath: path,
          versionId: version.id,
        }),
      );

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        ...expandedPaths,
        path,
      ]);
    });

    it('adds a path to expandedPaths', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const { expandedPaths } = getVersionInfo(state, version.id) as Version;

      const path = 'new/selected/path';
      state = reducer(
        state,
        actions.toggleExpandedPath({ path, versionId: version.id }),
      );

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        ...expandedPaths,
        path,
      ]);
    });

    it('removes a path from expandedPaths', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const { expandedPaths } = getVersionInfo(state, version.id) as Version;

      const path = 'new/selected/path';
      state = reducer(
        state,
        actions.toggleExpandedPath({ path, versionId: version.id }),
      );

      state = reducer(
        state,
        actions.toggleExpandedPath({ path, versionId: version.id }),
      );

      expect(state).toHaveProperty(
        `versionInfo.${version.id}.expandedPaths`,
        expandedPaths,
      );
    });

    it('maintains other paths when removing a path from expandedPaths', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const { expandedPaths } = getVersionInfo(state, version.id) as Version;

      const path1 = 'new/selected/path1';
      const path2 = 'new/selected/path2';

      // Add both paths.
      state = reducer(
        state,
        actions.toggleExpandedPath({ path: path1, versionId: version.id }),
      );
      state = reducer(
        state,
        actions.toggleExpandedPath({ path: path2, versionId: version.id }),
      );

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        ...expandedPaths,
        path1,
        path2,
      ]);

      // Remove the first path.
      state = reducer(
        state,
        actions.toggleExpandedPath({ path: path1, versionId: version.id }),
      );

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        ...expandedPaths,
        path2,
      ]);
    });

    it('adds all paths to expandedPaths when expandTree is dispatched', () => {
      const path1 = 'path/1';
      const path2 = 'path/2';
      const entries = {
        [path1]: createFakeEntry('directory', path1),
        [path2]: createFakeEntry('directory', path2),
      };

      const version = { ...fakeVersion, file: { ...fakeVersionFile, entries } };
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      state = reducer(state, actions.expandTree({ versionId: version.id }));

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        path1,
        path2,
        ROOT_PATH,
      ]);
    });

    it('throws an error when expandTree is called for an unknown version', () => {
      expect(() => {
        reducer(undefined, actions.expandTree({ versionId: 123 }));
      }).toThrow();
    });

    it('does not add paths for files to expandedPaths when expandTree is dispatched', () => {
      const path1 = 'scripts/';
      const path2 = 'scripts/background.js';
      const entries = {
        [path1]: createFakeEntry('directory', path1),
        [path2]: createFakeEntry('text', path2),
      };

      const version = { ...fakeVersion, file: { ...fakeVersionFile, entries } };
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      state = reducer(state, actions.expandTree({ versionId: version.id }));

      expect(state).toHaveProperty(`versionInfo.${version.id}.expandedPaths`, [
        path1,
        ROOT_PATH,
      ]);
    });

    it('removes all paths from expandedPaths when collapseTree is dispatched', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const path1 = 'new/selected/path1';
      const path2 = 'new/selected/path2';
      state = reducer(
        state,
        actions.toggleExpandedPath({ path: path1, versionId: version.id }),
      );
      state = reducer(
        state,
        actions.toggleExpandedPath({ path: path2, versionId: version.id }),
      );
      state = reducer(state, actions.collapseTree({ versionId: version.id }));

      expect(state).toHaveProperty(
        `versionInfo.${version.id}.expandedPaths`,
        [],
      );
    });

    it('throws an error when collapseTree is called for an unknown version', () => {
      expect(() => {
        reducer(initialState, actions.collapseTree({ versionId: 123 }));
      }).toThrow();
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

    it('sets the compare info to `null` on abortFetchDiff()', () => {
      const versionsState = reducer(undefined, actions.abortFetchDiff());

      expect(versionsState.compareInfo).toEqual(null);
    });

    it('resets the compare info on beginFetchDiff()', () => {
      let versionsState = reducer(undefined, actions.abortFetchDiff());
      versionsState = reducer(versionsState, actions.beginFetchDiff());

      expect(versionsState.compareInfo).toEqual(undefined);
    });

    it('loads compare info', () => {
      const addonId = 1;
      const baseVersionId = 2;
      const path = 'manifest.json';
      const mimeType = 'mime/type';

      const version = {
        ...fakeVersionWithDiff,
        file: {
          ...fakeVersionWithDiff.file,
          entries: {
            ...fakeVersionWithDiff.file.entries,
            [path]: {
              ...fakeVersionWithDiff.file.entries[path],
              mimetype: mimeType,
            },
          },
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: path,
        },
      };
      const headVersionId = version.id;

      let versionsState = reducer(
        undefined,
        actions.loadVersionInfo({ version }),
      );
      versionsState = reducer(
        versionsState,
        actions.loadDiff({
          addonId,
          baseVersionId,
          headVersionId,
          version,
        }),
      );

      expect(versionsState.compareInfo).toEqual({
        diffs: createInternalDiffs({
          baseVersionId,
          headVersionId,
          version,
        }),
        mimeType,
      });
    });

    it('throws an error when entry is missing on loadDiff()', () => {
      const addonId = 1;
      const baseVersionId = 2;
      const path = 'some/other/file.js';

      const version = {
        ...fakeVersionWithDiff,
        file: {
          ...fakeVersionWithDiff.file,
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: path,
        },
      };
      const headVersionId = version.id;

      const previousState = reducer(
        undefined,
        actions.loadVersionInfo({ version }),
      );

      expect(() => {
        reducer(
          previousState,
          actions.loadDiff({
            addonId,
            baseVersionId,
            headVersionId,
            version,
          }),
        );
      }).toThrow();
    });

    it('throws an error message when headVersion is missing on loadDiff()', () => {
      const addonId = 1;
      const baseVersionId = 2;
      const version = fakeVersionWithDiff;
      const headVersionId = version.id;

      expect(() => {
        reducer(
          undefined,
          actions.loadDiff({
            addonId,
            baseVersionId,
            headVersionId,
            version,
          }),
        );
      }).toThrow();
    });
  });

  describe('getParentFolders', () => {
    it('returns all parent folders, including the root, for a path', () => {
      const folder1 = 'folder1';
      const folder2 = 'folder2';
      const file1 = 'file1.js';
      const path = `${folder1}/${folder2}/${file1}`;

      expect(getParentFolders(path)).toEqual([
        ROOT_PATH,
        `${folder1}/${folder2}`,
        folder1,
      ]);
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
        sha256: entry.sha256,
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
        expandedPaths: getParentFolders(version.file.selected_file),
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
        selectedPath: version.file.selected_file,
        validationURL: fakeVersion.validation_url_json,
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

      expect(createInternalVersion(version)).toMatchObject({
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
      const downloadURL = 'http://example.org/download/file';
      const mimeType = 'mime/type';
      const filename = 'test.js';
      const path = `some/dir/${filename}`;
      const sha256 = 'some-sha';
      const type = 'text';
      const versionString = '1.0.1';
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersionFile,
          download_url: downloadURL,
          entries: {
            [path]: {
              ...fakeVersionEntry,
              filename,
              mime_category: type as VersionEntryType,
              mimetype: mimeType,
              path,
              sha256,
            },
          },
          selected_file: path,
        },
        version: versionString,
      };
      let state = reducer(undefined, actions.loadVersionInfo({ version }));
      state = reducer(state, actions.loadVersionFile({ version, path }));

      expect(getVersionFile(state, version.id, path)).toEqual({
        ...createInternalVersionFile(version.file),
        downloadURL,
        filename,
        mimeType,
        path,
        sha256,
        type,
        version: versionString,
      });
    });
    /* eslint-enable @typescript-eslint/camelcase */

    it('returns undefined if there is no version found', () => {
      const state = initialState;

      expect(getVersionFile(state, 1, 'some-file-name.js')).toEqual(undefined);
    });

    it('returns `null` when the file was not retrieved from the API', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));
      state = reducer(
        state,
        actions.abortFetchVersionFile({
          versionId: version.id,
          path: version.file.selected_file,
        }),
      );

      expect(
        getVersionFile(state, version.id, version.file.selected_file),
      ).toEqual(null);
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
      let state = reducer(undefined, actions.loadVersionInfo({ version }));
      state = reducer(
        state,
        actions.loadVersionFile({ version, path: version.file.selected_file }),
      );

      // We have to manually remove the entry to test this. This is because the
      // condition that checks for a file will return undefined before we reach
      // this test under normal circumstances.
      (state.versionInfo[version.id] as Version).entries = [];
      expect(
        getVersionFile(state, version.id, version.file.selected_file),
      ).toEqual(undefined);
    });

    it('logs a debug message if there is no entry for the path', async () => {
      const _log = createFakeLogger();

      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));
      state = reducer(
        state,
        actions.loadVersionFile({ version, path: version.file.selected_file }),
      );

      // We have to manually remove the entry to test this. This is because the
      // condition that checks for a file will return undefined before we reach
      // this test under normal circumstances.
      (state.versionInfo[version.id] as Version).entries = [];
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
    it('dispatches beginFetchVersionFile', async () => {
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
        actions.beginFetchVersion({ versionId }),
      );
    });

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

    it('dispatches loadVersionInfo() when API response is successful', async () => {
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

    it('dispatches loadVersionFile() when API response is successful', async () => {
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
        actions.loadVersionFile({
          path: version.file.selected_file,
          version,
        }),
      );
    });

    it('dispatches abortFetchVersion when API response is not successful', async () => {
      const error = new Error('Bad Request');
      const _getVersion = jest.fn().mockReturnValue(Promise.resolve({ error }));

      const addonId = 123;
      const versionId = 456;

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
        actions.abortFetchVersion({ versionId }),
      );
    });

    it('dispatches addError when API response is not successful', async () => {
      const error = new Error('Bad Request');
      const _getVersion = jest.fn().mockReturnValue(Promise.resolve({ error }));

      const addonId = 123;
      const versionId = 456;

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          fetchVersion({
            _getVersion,
            addonId,
            versionId,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(errorsActions.addError({ error }));
    });
  });

  describe('fetchVersionFile', () => {
    const _fetchVersionFile = ({
      addonId = 123,
      path = 'some/path.js',
      version = fakeVersion,
      _getVersion = jest.fn().mockReturnValue(Promise.resolve(version)),
    } = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchVersionFile({
            _getVersion,
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

    it('dispatches beginFetchVersionFile', async () => {
      const version = { ...fakeVersion, id: 3214 };
      const path = 'some/path.js';

      const { dispatch, thunk } = _fetchVersionFile({ version, path });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginFetchVersionFile({ path, versionId: version.id }),
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

    it('dispatches addError() when API response is not successful', async () => {
      const error = new Error('Bad Request');
      const _getVersion = jest.fn().mockReturnValue(Promise.resolve({ error }));

      const { dispatch, thunk } = _fetchVersionFile({ _getVersion });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(errorsActions.addError({ error }));
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: getType(actions.loadVersionFile),
        }),
      );
    });

    it('dispatches abortFetchVersionFile() when API response is not successful', async () => {
      const path = 'scripts/background.js';
      const version = { ...fakeVersion, id: 54123 };
      const _getVersion = jest
        .fn()
        .mockReturnValue(Promise.resolve({ error: new Error('Bad Request') }));

      const { dispatch, thunk } = _fetchVersionFile({
        _getVersion,
        path,
        version,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortFetchVersionFile({ path, versionId: version.id }),
      );
    });
  });

  describe('fetchVersionsList', () => {
    const _fetchVersionsList = ({
      _getVersionsList = jest
        .fn()
        .mockReturnValue(Promise.resolve(fakeVersionsList)),
      addonId = 123,
    } = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchVersionsList({
            _getVersionsList,
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
      const error = new Error('Bad Request');
      const _getVersionsList = jest
        .fn()
        .mockReturnValue(Promise.resolve({ error }));

      const { dispatch, thunk } = _fetchVersionsList({ _getVersionsList });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(errorsActions.addError({ error }));
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

  describe('createInternalDiffs', () => {
    type CreateInternalDiffsParams = {
      baseVersionId?: number;
      headVersionId?: number;
      version: ExternalVersionWithDiff;
    };

    const _createInternalDiffs = ({
      baseVersionId = 1,
      headVersionId = 2,
      version,
    }: CreateInternalDiffsParams) => {
      return createInternalDiffs({ baseVersionId, headVersionId, version });
    };

    const createVersionWithChange = (change = {}) => {
      return {
        ...fakeVersion,
        file: {
          ...fakeVersion.file,
          diff: [
            {
              ...fakeExternalDiff,
              hunks: [
                {
                  ...fakeExternalDiff.hunks[0],
                  changes: [
                    {
                      ...fakeExternalDiff.hunks[0].changes[0],
                      ...change,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };
    };

    it('creates an array of DiffInfo objects from a version with diff', () => {
      const baseVersionId = 132;
      const headVersionId = 133;
      const externalDiffs = [fakeExternalDiff];
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersion.file,
          diff: externalDiffs,
        },
      };

      const diffs = _createInternalDiffs({
        baseVersionId,
        headVersionId,
        version,
      });

      expect(diffs).toHaveLength(externalDiffs.length);
      diffs.forEach((diff, index) => {
        const externalDiff = externalDiffs[index];

        expect(diff).toHaveProperty('oldRevision', String(baseVersionId));
        expect(diff).toHaveProperty('newRevision', String(headVersionId));
        expect(diff).toHaveProperty('oldMode', externalDiff.mode);
        expect(diff).toHaveProperty('newMode', externalDiff.mode);
        expect(diff).toHaveProperty('oldPath', externalDiff.old_path);
        expect(diff).toHaveProperty('newPath', externalDiff.path);
        expect(diff).toHaveProperty(
          'oldEndingNewLine',
          externalDiff.old_ending_new_line,
        );
        expect(diff).toHaveProperty(
          'newEndingNewLine',
          externalDiff.new_ending_new_line,
        );

        // These props will be tested in a different test case below.
        expect(diff).toHaveProperty('type');
        expect(diff).toHaveProperty('hunks');
      });
    });

    it.each([
      ['add', 'A'],
      ['copy', 'C'],
      ['delete', 'D'],
      ['modify', 'M'],
      ['rename', 'R'],
      // This simulates an unknown mode.
      ['modify', 'unknown'],
    ])('sets type "%s" for mode "%s"', (type, mode) => {
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersion.file,
          diff: [{ ...fakeExternalDiff, mode }],
        },
      };

      const diff = _createInternalDiffs({ version })[0];

      expect(diff.type).toEqual(type);
    });

    it('creates hunks from external diff hunks', () => {
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersion.file,
          diff: [fakeExternalDiff],
        },
      };

      const diff = _createInternalDiffs({ version })[0];

      expect(diff.hunks).toHaveLength(fakeExternalDiff.hunks.length);
      diff.hunks.forEach((hunk, index) => {
        const externalHunk = fakeExternalDiff.hunks[index];

        expect(hunk).toHaveProperty('content', externalHunk.header);
        expect(hunk).toHaveProperty('isPlain', false);
        expect(hunk).toHaveProperty('oldLines', externalHunk.old_lines);
        expect(hunk).toHaveProperty('newLines', externalHunk.new_lines);
        expect(hunk).toHaveProperty('oldStart', externalHunk.old_start);
        expect(hunk).toHaveProperty('newStart', externalHunk.new_start);

        // This prop will be tested in a different test case below.
        expect(hunk).toHaveProperty('changes');
      });
    });

    it('creates changes from external diff changes', () => {
      const version = {
        ...fakeVersion,
        file: {
          ...fakeVersion.file,
          diff: [fakeExternalDiff],
        },
      };

      const diff = _createInternalDiffs({ version })[0];

      const firstHunk = diff.hunks[0];
      const firstExternalHunk = fakeExternalDiff.hunks[0];

      expect(firstHunk.changes).toHaveLength(firstExternalHunk.changes.length);
      firstHunk.changes.forEach((change, index) => {
        const externalChange = firstExternalHunk.changes[index];

        expect(change).toHaveProperty('content', externalChange.content);
        expect(change).toHaveProperty('type', externalChange.type);
        expect(change).toHaveProperty(
          'oldLineNumber',
          externalChange.old_line_number,
        );
        expect(change).toHaveProperty(
          'newLineNumber',
          externalChange.new_line_number,
        );

        // These props will be tested in a different test case below.
        expect(change).toHaveProperty('lineNumber');
        expect(change).toHaveProperty('isDelete');
        expect(change).toHaveProperty('isInsert');
        expect(change).toHaveProperty('isNormal');
      });
    });

    it('creates "delete" changes', () => {
      const type = 'delete';
      const oldLineNumber = 123;
      const version = createVersionWithChange({
        // eslint-disable-next-line @typescript-eslint/camelcase
        old_line_number: oldLineNumber,
        // eslint-disable-next-line @typescript-eslint/camelcase
        new_line_number: oldLineNumber + 1,
        type,
      });

      const diff = _createInternalDiffs({ version })[0];
      const change = diff.hunks[0].changes[0];

      expect(change).toHaveProperty('type', type);
      expect(change).toHaveProperty('isDelete', true);
      expect(change).toHaveProperty('isInsert', false);
      expect(change).toHaveProperty('isNormal', false);
      expect(change).toHaveProperty('lineNumber', oldLineNumber);
    });

    it('creates "insert" changes', () => {
      const type = 'insert';
      const newLineNumber = 123;
      const version = createVersionWithChange({
        // eslint-disable-next-line @typescript-eslint/camelcase
        old_line_number: newLineNumber - 1,
        // eslint-disable-next-line @typescript-eslint/camelcase
        new_line_number: newLineNumber,
        type,
      });

      const diff = _createInternalDiffs({ version })[0];
      const change = diff.hunks[0].changes[0];

      expect(change).toHaveProperty('type', type);
      expect(change).toHaveProperty('isDelete', false);
      expect(change).toHaveProperty('isInsert', true);
      expect(change).toHaveProperty('isNormal', false);
      expect(change).toHaveProperty('lineNumber', newLineNumber);
    });

    it('creates "normal" changes', () => {
      const type = 'normal';
      const oldLineNumber = 123;
      const version = createVersionWithChange({
        // eslint-disable-next-line @typescript-eslint/camelcase
        old_line_number: oldLineNumber,
        // eslint-disable-next-line @typescript-eslint/camelcase
        new_line_number: oldLineNumber + 1,
        type,
      });

      const diff = _createInternalDiffs({ version })[0];
      const change = diff.hunks[0].changes[0];

      expect(change).toHaveProperty('type', type);
      expect(change).toHaveProperty('isDelete', false);
      expect(change).toHaveProperty('isInsert', false);
      expect(change).toHaveProperty('isNormal', true);
      expect(change).toHaveProperty('lineNumber', oldLineNumber);
    });
  });

  describe('fetchDiff', () => {
    const _fetchDiff = ({
      addonId = 1,
      baseVersionId = 2,
      headVersionId = 3,
      version = fakeVersionWithDiff,
      _getDiff = jest.fn().mockReturnValue(Promise.resolve(version)),
      path = undefined as string | undefined,
    } = {}) => {
      return thunkTester({
        createThunk: () =>
          fetchDiff({
            _getDiff,
            addonId,
            baseVersionId,
            headVersionId,
            path,
          }),
      });
    };

    it('dispatches beginFetchDiff()', async () => {
      const { dispatch, thunk } = _fetchDiff();
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.beginFetchDiff());
    });

    it('calls getDiff()', async () => {
      const version = fakeVersionWithDiff;
      const _getDiff = jest.fn().mockReturnValue(Promise.resolve(version));

      const addonId = 123;
      const baseVersionId = version.id - 1;
      const headVersionId = version.id;

      const { store, thunk } = _fetchDiff({
        _getDiff,
        addonId,
        baseVersionId,
        headVersionId,
      });
      await thunk();

      expect(_getDiff).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        baseVersionId,
        headVersionId,
      });
    });

    it('dispatches loadVersionInfo() when API response is successful', async () => {
      const version = fakeVersionWithDiff;

      const { dispatch, thunk } = _fetchDiff({ version });
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadVersionInfo({ version }),
      );
    });

    it('dispatches loadDiff() when API response is successful', async () => {
      const version = { ...fakeVersionWithDiff, id: 3 };
      const addonId = 1;
      const baseVersionId = 2;
      const headVersionId = version.id;

      const { dispatch, thunk } = _fetchDiff({ version });
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadDiff({
          addonId,
          baseVersionId,
          headVersionId,
          version,
        }),
      );
    });

    it('dispatches abortFetchDiff() when API call has failed', async () => {
      const _getDiff = jest.fn().mockReturnValue(
        Promise.resolve({
          error: new Error('Bad Request'),
        }),
      );

      const { dispatch, thunk } = _fetchDiff({ _getDiff });
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.abortFetchDiff());
    });
  });

  describe('beginFetchVersionFile', () => {
    it('sets a loading flag for the file', () => {
      const path = 'scripts/background.js';
      const versionId = 98765;

      const state = reducer(
        undefined,
        actions.beginFetchVersionFile({ path, versionId }),
      );

      expect(state.versionFilesLoading[versionId][path]).toEqual(true);
    });

    it('preserves other loading flags', () => {
      const path1 = 'scripts/background.js';
      const path2 = 'scripts/content.js';
      const versionId = 98765;

      let state;
      state = reducer(
        state,
        actions.beginFetchVersionFile({ path: path1, versionId }),
      );
      state = reducer(
        state,
        actions.beginFetchVersionFile({ path: path2, versionId }),
      );

      expect(state.versionFilesLoading[versionId][path1]).toEqual(true);
      expect(state.versionFilesLoading[versionId][path2]).toEqual(true);
    });
  });

  describe('abortFetchVersionFile', () => {
    it('resets a loading flag for the file', () => {
      const path = 'scripts/background.js';
      const versionId = 98765;

      let state;
      state = reducer(
        state,
        actions.beginFetchVersionFile({ path, versionId }),
      );
      state = reducer(
        state,
        actions.abortFetchVersionFile({ path, versionId }),
      );

      expect(state.versionFilesLoading[versionId][path]).toEqual(false);
    });

    it('preserves other loading flags', () => {
      const path1 = 'scripts/background.js';
      const path2 = 'scripts/content.js';
      const versionId = 98765;

      let state;
      state = reducer(
        state,
        actions.beginFetchVersionFile({ path: path1, versionId }),
      );
      state = reducer(
        state,
        actions.abortFetchVersionFile({ path: path2, versionId }),
      );

      expect(state.versionFilesLoading[versionId][path1]).toEqual(true);
      expect(state.versionFilesLoading[versionId][path2]).toEqual(false);
    });

    it('sets the file to `null`', () => {
      const path = 'scripts/background.js';
      const versionId = 98765;

      let state;
      state = reducer(
        state,
        actions.beginFetchVersionFile({ path, versionId }),
      );
      state = reducer(
        state,
        actions.abortFetchVersionFile({ path, versionId }),
      );

      expect(state.versionFiles[versionId][path]).toEqual(null);
    });

    it('preserves other version files', () => {
      const version = fakeVersion;
      const pathToBackgroundJs = 'scripts/background.js';
      const pathToManifestJson = 'manifest.json';

      let state = reducer(
        undefined,
        actions.loadVersionFile({ path: pathToBackgroundJs, version }),
      );
      state = reducer(
        state,
        actions.abortFetchVersionFile({
          path: pathToManifestJson,
          versionId: version.id,
        }),
      );

      expect(state.versionFiles[version.id][pathToBackgroundJs]).toEqual(
        expect.any(Object),
      );
      expect(state.versionFiles[version.id][pathToManifestJson]).toEqual(null);
    });
  });

  describe('isFileLoading', () => {
    it('returns true when file is loading', () => {
      const path = 'scripts/background.js';
      const versionId = 54598;

      const state = reducer(
        undefined,
        actions.beginFetchVersionFile({
          path,
          versionId,
        }),
      );

      expect(isFileLoading(state, versionId, path)).toEqual(true);
    });

    it('returns false when file is not loading', () => {
      const path = 'scripts/background.js';
      const versionId = 54598;

      const state = reducer(
        undefined,
        actions.abortFetchVersionFile({
          path,
          versionId,
        }),
      );

      expect(isFileLoading(state, versionId, path)).toEqual(false);
    });

    it('returns false when no files have ever loaded', () => {
      const path = 'scripts/background.js';
      const versionId = 54598;

      expect(isFileLoading(initialState, versionId, path)).toEqual(false);
    });

    it('returns false when this specific file has never loaded', () => {
      const path = 'scripts/background.js';
      const versionId = 54598;

      // Begin loading an unrelated path.
      const state = reducer(
        undefined,
        actions.beginFetchVersionFile({
          versionId,
          path: 'manifest.json',
        }),
      );

      expect(isFileLoading(state, versionId, path)).toEqual(false);
    });
  });

  describe('viewVersionFile', () => {
    const selectedPath = 'some-path';
    const versionId = fakeVersion.id;
    const pathname = '/some/path/to/a/page';

    it('dispatches updateSelectedPath and pushes a new URL', async () => {
      const location = createFakeLocation({ pathname });
      const history = createFakeHistory({ location });

      const { dispatch, thunk } = thunkTester({
        createThunk: () => viewVersionFile({ selectedPath, versionId }),
        store: configureStore({ history }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.updateSelectedPath({
          selectedPath,
          versionId,
        }),
      );
      expect(dispatch).toHaveBeenCalledWith(
        push({
          ...location,
          search: `?path=${selectedPath}`,
          hash: undefined,
        }),
      );
    });

    it('preserves the existing query parameters', async () => {
      const search = '?a=1&b=2';
      const location = createFakeLocation({ pathname, search });
      const history = createFakeHistory({ location });

      const { dispatch, thunk } = thunkTester({
        createThunk: () => viewVersionFile({ selectedPath, versionId }),
        store: configureStore({ history }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        push({
          ...location,
          search: `${search}&path=${selectedPath}`,
          hash: undefined,
        }),
      );
    });

    it('does not preserve the location hash by default', async () => {
      const hash = '#some-hash';
      const location = createFakeLocation({ pathname, hash });
      const history = createFakeHistory({ location });

      const { dispatch, thunk } = thunkTester({
        createThunk: () => viewVersionFile({ selectedPath, versionId }),
        store: configureStore({ history }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        push({
          ...location,
          search: `?path=${selectedPath}`,
          hash: undefined,
        }),
      );
    });

    it('preserves the location hash when `preserveHash` is `true', async () => {
      const hash = '#some-hash';
      const location = createFakeLocation({ pathname, hash });
      const history = createFakeHistory({ location });

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          viewVersionFile({ selectedPath, versionId, preserveHash: true }),
        store: configureStore({ history }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        push({
          ...location,
          search: `?path=${selectedPath}`,
          hash,
        }),
      );
    });
  });

  describe('abortFetchVersion', () => {
    it('sets the version info to `null` on abortFetchVersion()', () => {
      const versionId = 123;
      const state = reducer(
        undefined,
        actions.abortFetchVersion({ versionId }),
      );

      expect(state.versionInfo[versionId]).toEqual(null);
    });

    it('preserves other version info', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const abortFetchVersionId = version.id + 123;
      state = reducer(
        state,
        actions.abortFetchVersion({ versionId: abortFetchVersionId }),
      );

      expect(state.versionInfo[version.id]).toEqual(expect.any(Object));
      expect(state.versionInfo[abortFetchVersionId]).toEqual(null);
    });

    it('preserves other loading states', () => {
      const beginFetchVersionId = 123;
      const abortFetchVersionId = 456;

      let state = reducer(
        undefined,
        actions.beginFetchVersion({ versionId: beginFetchVersionId }),
      );
      state = reducer(
        state,
        actions.abortFetchVersion({ versionId: abortFetchVersionId }),
      );

      expect(state.versionInfo[beginFetchVersionId]).toEqual(undefined);
      expect(state.versionInfo[abortFetchVersionId]).toEqual(null);
    });
  });

  describe('beginFetchVersion', () => {
    it('resets the version info on beginFetchVersion()', () => {
      const versionId = 123;
      let versionsState = reducer(
        undefined,
        actions.abortFetchVersion({ versionId }),
      );
      versionsState = reducer(
        versionsState,
        actions.beginFetchVersion({ versionId }),
      );

      expect(versionsState.versionInfo[versionId]).toEqual(undefined);
    });

    it('preserves other version info', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const beginFetchVersionId = version.id + 123;
      state = reducer(
        state,
        actions.beginFetchVersion({ versionId: beginFetchVersionId }),
      );

      expect(state.versionInfo[version.id]).toEqual(expect.any(Object));
      expect(state.versionInfo[beginFetchVersionId]).toEqual(undefined);
    });

    it('preservers other loading states', () => {
      const beginFetchVersionId = 123;
      const abortFetchVersionId = 456;

      let state = reducer(
        undefined,
        actions.abortFetchVersion({ versionId: abortFetchVersionId }),
      );
      state = reducer(
        state,
        actions.beginFetchVersion({ versionId: beginFetchVersionId }),
      );

      expect(state.versionInfo[abortFetchVersionId]).toEqual(null);
      expect(state.versionInfo[beginFetchVersionId]).toEqual(undefined);
    });
  });
});
