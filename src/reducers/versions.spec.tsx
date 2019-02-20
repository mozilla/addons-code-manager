import reducer, {
  VersionEntryType,
  actions,
  createInternalVersion,
  createInternalVersionEntry,
  createInternalVersionFile,
  getVersionEntryType,
  getVersionFile,
  getVersionFiles,
  getVersionInfo,
  initialState,
} from './versions';
import {
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
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
  });

  describe('createInternalVersionEntry', () => {
    it('creates a VersionEntry', () => {
      const entry = { ...fakeVersionEntry, filename: 'entry' };

      expect(createInternalVersionEntry(entry)).toEqual({
        depth: entry.depth,
        filename: entry.filename,
        modified: entry.modified,
        path: entry.path,
        type: getVersionEntryType(entry),
      });
    });
  });

  describe('createInternalVersion', () => {
    it('creates a Version', () => {
      const version = fakeVersion;
      const entry = version.file.entries[Object.keys(version.file.entries)[0]];

      expect(createInternalVersion(version)).toEqual({
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

  describe('getVersionEntryType', () => {
    it('returns the correct type for a directory', () => {
      const entry = {
        ...fakeVersionEntry,
        directory: true,
      };
      expect(getVersionEntryType(entry)).toEqual(VersionEntryType.directory);
    });

    it('returns the correct type for an image', () => {
      const entry = {
        ...fakeVersionEntry,
        binary: 'image',
        directory: false,
      };
      expect(getVersionEntryType(entry)).toEqual(VersionEntryType.image);
    });

    it('returns the correct type for a binary file', () => {
      const entry = {
        ...fakeVersionEntry,
        binary: true,
        directory: false,
      };
      expect(getVersionEntryType(entry)).toEqual(VersionEntryType.binary);
    });

    it('returns the correct type for a text file', () => {
      const entry = {
        ...fakeVersionEntry,
        binary: false,
        directory: false,
      };
      expect(getVersionEntryType(entry)).toEqual(VersionEntryType.text);
    });
  });

  describe('getVersionFile', () => {
    it('returns a version file', () => {
      const path = 'test.js';
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionFile({ path, version }),
      );

      expect(getVersionFile(path, state, version.id)).toEqual(
        createInternalVersionFile(version.file),
      );
    });

    it('returns undefined if there is no version file found', () => {
      const state = initialState;

      expect(getVersionFile('some-file-name.js', state, 1)).toEqual(undefined);
    });
  });

  describe('getVersionFiles', () => {
    it('returns all the files for a given version', () => {
      const path = 'test.js';
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionFile({ path, version }),
      );

      expect(getVersionFiles(state, version.id)).toEqual({
        [path]: createInternalVersionFile(version.file),
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
});
