import { Version, VersionEntryType } from '../../reducers/versions';

import { buildFileTree } from '.';

describe(__filename, () => {
  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const versionId = '1234';
      const entries: Version['entries'] = [];

      const data = buildFileTree(versionId, entries);

      expect(data).toEqual({
        id: `root-${versionId}`,
        name: versionId,
        children: [],
      });
    });

    it('converts a non-directory entry to a file node', () => {
      const versionId = 'some-name';

      const filename = 'some-filename';
      const entries = [
        {
          depth: 0,
          type: VersionEntryType.text,
          filename,
          path: filename,
          modified: '2019-01-01',
        },
      ];

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const versionId = 'some-name';

      const directory = 'some-directory';
      const entries = [
        {
          depth: 0,
          type: VersionEntryType.directory,
          filename: directory,
          path: directory,
          modified: '2019-01-01',
        },
      ];

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: directory,
          children: [],
        },
      ]);
    });

    it('finds the appropriate node to add a new entry to it', () => {
      const versionId = 'some-name';

      const directory = 'parent';
      const file = 'child';

      const entries = [
        {
          depth: 0,
          type: VersionEntryType.directory,
          filename: directory,
          path: directory,
          modified: '2019-01-01',
        },
        {
          depth: 1,
          type: VersionEntryType.text,
          filename: file,
          path: `${directory}/${file}`,
          modified: '2019-01-01',
        },
      ];

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: directory,
          children: [
            {
              id: entries[1].path,
              name: file,
            },
          ],
        },
      ]);
    });

    it('traverses multiple levels to find the right directory', () => {
      const versionId = 'some-name';

      const directoryName = 'same-file';
      const fileName = 'same-nfile';

      const entries = [
        {
          depth: 0,
          type: VersionEntryType.directory,
          filename: directoryName,
          path: directoryName,
          modified: '2019-01-01',
        },
        {
          depth: 1,
          type: VersionEntryType.directory,
          filename: directoryName,
          path: `${directoryName}/${directoryName}`,
          modified: '2019-01-01',
        },
        {
          depth: 2,
          type: VersionEntryType.text,
          filename: fileName,
          path: `${directoryName}/${directoryName}/${fileName}`,
          modified: '2019-01-01',
        },
      ];

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: directoryName,
          children: [
            {
              id: entries[1].path,
              name: directoryName,
              children: [
                {
                  id: entries[2].path,
                  name: fileName,
                },
              ],
            },
          ],
        },
      ]);
    });
  });
});
