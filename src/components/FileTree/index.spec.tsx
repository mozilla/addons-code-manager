import { Entry, buildFileTree } from '.';

describe(__filename, () => {
  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const versionId = '1234';
      const entries: Entry[] = [];

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
          directory: false,
          filename,
          path: filename,
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
          directory: true,
          filename: directory,
          path: directory,
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
          directory: true,
          filename: directory,
          path: directory,
        },
        {
          depth: 1,
          directory: false,
          filename: file,
          path: `${directory}/${file}`,
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
          directory: true,
          filename: directoryName,
          path: directoryName,
        },
        {
          depth: 1,
          directory: true,
          filename: directoryName,
          path: `${directoryName}/${directoryName}`,
        },
        {
          depth: 2,
          directory: false,
          filename: fileName,
          path: `${directoryName}/${directoryName}/${fileName}`,
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
