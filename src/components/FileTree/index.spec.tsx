import { Entry, buildTreebeardData } from '.';

describe(__filename, () => {
  describe('buildTreebeardData', () => {
    it('creates a root node', () => {
      const name = 'some-name';
      const entries: Entry[] = [];

      const data = buildTreebeardData(name, entries);

      expect(data).toEqual({
        name,
        toggled: true,
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

      const data = buildTreebeardData(name, entries);

      expect(data.children).toEqual([
        {
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

      const data = buildTreebeardData(name, entries);

      expect(data.children).toEqual([
        {
          name: directory,
          toggled: true,
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

      const data = buildTreebeardData(name, entries);

      expect(data.children).toEqual([
        {
          name: directory,
          toggled: true,
          children: [
            {
              name: file,
            },
          ],
        },
      ]);
    });
  });
});
