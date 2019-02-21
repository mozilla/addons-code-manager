import { getType } from 'typesafe-actions';

import reducer, {
  actions,
  createInternalVersion,
  createInternalVersionAddon,
  createInternalVersionEntries,
  createInternalVersionEntry,
  createInternalVersionFile,
  fetchVersion,
  fetchVersionFile,
  getVersion,
  initialState,
} from './versions';
import {
  createFakeVersionWithPaths,
  fakeVersion,
  fakeVersionAddon,
  fakeVersionEntry,
  fakeVersionFile,
  getFakeLogger,
  thunkTester,
} from '../test-helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('loads version info and the default file', () => {
      const version = fakeVersion;
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state).toEqual({
        ...initialState,
        versions: {
          [version.id]: createInternalVersion(version),
        },
      });
    });

    it('loads only the default file', () => {
      const path1 = 'test1.js';
      const path2 = 'test2.js';
      const version = createFakeVersionWithPaths([path1, path2]);
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state.versions[version.id].entries[path1].file).toHaveProperty(
        'content',
        fakeVersionFile.content,
      );
      expect(state.versions[version.id].entries[path2]).toHaveProperty(
        'file',
        null,
      );
    });

    it('loads a version file', () => {
      const path1 = 'test1.js';
      const path2 = 'test2.js';
      const otherContent = 'some other content';
      const version = createFakeVersionWithPaths([path1, path2]);
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      const versionWithDifferentFile = {
        ...fakeVersion,
        file: {
          ...fakeVersionFile,
          content: otherContent,
          entries: {
            [path2]: {
              ...fakeVersionEntry,
              path: path2,
            },
          },
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: path2,
        },
      };

      state = reducer(
        state,
        actions.loadVersionFile({
          path: path2,
          version: versionWithDifferentFile,
        }),
      );

      expect(state.versions[version.id].entries[path2].file).toHaveProperty(
        'content',
        otherContent,
      );
    });

    it('updates a selected path for a given version', () => {
      const version = fakeVersion;
      let state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(state).toHaveProperty(
        `versions.${version.id}.selectedPath`,
        version.file.selected_file,
      );

      const selectedPath = 'new/selected/path';
      state = reducer(
        state,
        actions.updateSelectedPath({ selectedPath, versionId: version.id }),
      );

      expect(state).toHaveProperty(
        `versions.${version.id}.selectedPath`,
        selectedPath,
      );
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
    it('creates a VersionEntry with file info for a matching file', () => {
      const path = 'test1.js';
      const entry = { ...fakeVersionEntry, path };
      // eslint-disable-next-line @typescript-eslint/camelcase
      const file = { ...fakeVersionFile, selected_file: path };

      expect(createInternalVersionEntry(entry, file)).toEqual({
        depth: entry.depth,
        file: createInternalVersionFile(file),
        filename: entry.filename,
        mimeType: entry.mimetype,
        modified: entry.modified,
        path: entry.path,
        type: entry.mime_category,
      });
    });

    it('creates a VersionEntry without file info for a non-matching file', () => {
      const path = 'test1.js';
      const entry = { ...fakeVersionEntry, path };
      // eslint-disable-next-line @typescript-eslint/camelcase
      const file = { ...fakeVersionFile, selected_file: `${path}-1` };

      expect(createInternalVersionEntry(entry, file)).toEqual({
        depth: entry.depth,
        file: null,
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
        entries: createInternalVersionEntries({
          ...fakeVersionFile,
          entries: { [entry.path]: entry },
        }),
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
        entries: createInternalVersionEntries({
          ...fakeVersionFile,
          entries: {
            [entry1.path]: entry1,
            [entry2.path]: entry2,
          },
        }),
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
        selectedPath: version.file.selected_file,
      });
    });
  });

  describe('getVersion', () => {
    it('returns version info', () => {
      const version = fakeVersion;
      const state = reducer(undefined, actions.loadVersionInfo({ version }));

      expect(getVersion(state, version.id)).toEqual(
        createInternalVersion(version),
      );
    });

    it('returns undefined if there is no version found', () => {
      const state = initialState;

      expect(getVersion(state, 1)).toEqual(undefined);
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
});
