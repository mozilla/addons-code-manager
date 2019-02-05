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
      const name = 'some-name';

      const filename = 'some-filename';
      const entries = [
        {
          depth: 0,
          directory: false,
          filename,
          path: filename,
        },
      ];

      const data = buildFileTree(name, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const name = 'some-name';

      const directory = 'some-directory';
      const entries = [
        {
          depth: 0,
          directory: true,
          filename: directory,
          path: directory,
        },
      ];

      const data = buildFileTree(name, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: directory,
          children: [],
        },
      ]);
    });

    it('finds the appropriate node to add a new entry to it', () => {
      const name = 'some-name';

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
          path: `${directory}/${file},`,
        },
      ];

      const data = buildFileTree(name, entries);

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
  });
});
