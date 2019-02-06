import reducer, {
  VersionEntryType,
  actions,
  createInternalVersion,
  createInternalVersionFile,
  getVersionEntryType,
  getVersionFile,
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
      const filename = 'test.js';
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionFile({ filename, version }),
      );

      expect(state).toEqual({
        ...initialState,
        versionFiles: {
          [version.id]: {
            [filename]: createInternalVersionFile(version.file),
          },
        },
      });
    });

    it('preserves existing files', () => {
      const filename1 = 'test1.js';
      const filename2 = 'test2.js';
      const version = fakeVersion;

      let state = reducer(
        undefined,
        actions.loadVersionFile({ filename: filename1, version }),
      );
      state = reducer(
        state,
        actions.loadVersionFile({ filename: filename2, version }),
      );

      expect(state).toEqual({
        ...initialState,
        versionFiles: {
          [version.id]: {
            [filename1]: createInternalVersionFile(version.file),
            [filename2]: createInternalVersionFile(version.file),
          },
        },
      });
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
  });

  describe('createInternalVersion', () => {
    it('creates a Version', () => {
      const version = fakeVersion;
      const entry = version.file.entries[Object.keys(version.file.entries)[0]];

      expect(createInternalVersion(version)).toEqual({
        entries: [
          {
            depth: entry.depth,
            filename: entry.filename,
            modified: entry.modified,
            path: entry.path,
            type: getVersionEntryType(entry),
          },
        ],
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
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
          {
            depth: entry1.depth,
            filename: entry1.filename,
            modified: entry1.modified,
            path: entry1.path,
            type: getVersionEntryType(entry1),
          },
          {
            depth: entry2.depth,
            filename: entry2.filename,
            modified: entry2.modified,
            path: entry2.path,
            type: getVersionEntryType(entry2),
          },
        ],
        id: version.id,
        reviewed: version.reviewed,
        version: version.version,
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
      const filename = 'test.js';
      const version = fakeVersion;
      const state = reducer(
        undefined,
        actions.loadVersionFile({ filename, version }),
      );

      expect(getVersionFile(filename, state, version.id)).toEqual(
        createInternalVersionFile(version.file),
      );
    });

    it('returns undefined if there is no version file found', () => {
      const state = initialState;

      expect(getVersionFile('some-file-name.js', state, 1)).toEqual(undefined);
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
