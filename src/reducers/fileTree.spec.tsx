/* eslint @typescript-eslint/camelcase: 0 */
import reducer, {
  DirectoryNode,
  actions,
  buildFileTree,
  buildFileTreeNodes,
  buildTreePathList,
  getRelativePath,
  getRootPath,
  getTree,
  initialState,
} from './fileTree';
import { createInternalVersion, createInternalVersionEntry } from './versions';
import {
  createFakeLogger,
  createVersionWithEntries,
  fakeVersion,
  fakeVersionEntry,
} from '../test-helpers';
import { getLocalizedString } from '../utils';

describe(__filename, () => {
  describe('reducer', () => {
    it('builds and loads a tree', () => {
      const version = createInternalVersion(fakeVersion);
      const state = reducer(undefined, actions.buildTree({ version }));

      expect(state).toEqual({
        ...initialState,
        forVersionId: version.id,
        tree: buildFileTree(version),
      });
    });
  });

  describe('getTree', () => {
    it('returns a tree', () => {
      const version = createInternalVersion(fakeVersion);
      const state = reducer(undefined, actions.buildTree({ version }));

      expect(getTree(state, version.id)).toEqual(buildFileTree(version));
    });

    it('returns undefined if there is no tree loaded', () => {
      const version = createInternalVersion(fakeVersion);
      const state = initialState;

      expect(getTree(state, version.id)).toEqual(undefined);
    });

    it('returns undefined if a version is requested that has not been loaded', () => {
      const version1 = createInternalVersion({ ...fakeVersion, id: 1 });
      const version2 = createInternalVersion({ ...fakeVersion, id: 2 });
      const state = reducer(
        undefined,
        actions.buildTree({ version: version2 }),
      );

      expect(getTree(state, version1.id)).toEqual(undefined);
    });
  });

  describe('getRootPath', () => {
    const version = createInternalVersion(fakeVersion);
    const addonName = getLocalizedString(version.addon.name);

    expect(getRootPath(version)).toEqual(`root-${addonName}`);
  });

  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const version = createVersionWithEntries([]);
      const addonName = getLocalizedString(version.addon.name);

      const tree = buildFileTreeNodes(version);

      expect(tree).toEqual({
        id: `root-${addonName}`,
        name: addonName,
        children: [],
      });
    });

    it('converts a non-directory entry to a file node', () => {
      const filename = 'some-filename';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          mime_category: 'text',
          filename,
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const filename = 'some-directory';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          mime_category: 'directory',
          filename,
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
          children: [],
        },
      ]);
    });

    it('finds the appropriate node to add a new entry to it', () => {
      const directory = 'parent';
      const file = 'child';

      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: directory,
          mime_category: 'directory',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: file,
          mime_category: 'text',
          path: `${directory}/${file}`,
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
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

    it('throws an error when it cannot find the appropriate node to add a new entry to', () => {
      const directory = 'parent';
      const file = 'child';
      const badDirectoryName = 'incorrect-directory-name';

      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: directory,
          mime_category: 'directory',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: file,
          mime_category: 'text',
          path: `${badDirectoryName}/${file}`,
        }),
      ];
      const version = createVersionWithEntries(entries);

      expect(() => {
        buildFileTreeNodes(version);
      }).toThrow(`Could not find parent of entry: ${badDirectoryName}/${file}`);
    });

    it('traverses multiple levels to find the right directory', () => {
      const directoryName = 'same-file';
      const fileName = 'same-nfile';

      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: directoryName,
          mime_category: 'directory',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: directoryName,
          mime_category: 'directory',
          path: `${directoryName}/${directoryName}`,
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 2,
          filename: fileName,
          mime_category: 'text',
          path: `${directoryName}/${directoryName}/${fileName}`,
        }),
      ];
      const version = createVersionWithEntries(entries);

      const data = buildFileTreeNodes(version);

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

    it('sorts the nodes so that directories come first', () => {
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'B',
          mime_category: 'directory',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'A',
          mime_category: 'text',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'C',
          mime_category: 'directory',
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: 'B',
          children: [],
        },
        {
          id: entries[2].path,
          name: 'C',
          children: [],
        },
        {
          id: entries[1].path,
          name: 'A',
        },
      ]);
    });

    it('sorts files alphabetically', () => {
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'C',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'B',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'A',
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
        {
          id: entries[2].path,
          name: 'A',
        },
        {
          id: entries[1].path,
          name: 'B',
        },
        {
          id: entries[0].path,
          name: 'C',
        },
      ]);
    });

    it('sorts directories alphabetically', () => {
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'B',
          mime_category: 'directory',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'A',
          mime_category: 'directory',
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);

      expect(tree.children).toEqual([
        {
          id: entries[1].path,
          name: 'A',
          children: [],
        },
        {
          id: entries[0].path,
          name: 'B',
          children: [],
        },
      ]);
    });

    it('sorts the nodes recursively', () => {
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'parent',
          mime_category: 'directory',
          path: 'parent',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'B',
          path: 'parent/B',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'A',
          path: 'parent/A',
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);
      const firstNode = tree.children[0] as DirectoryNode;

      expect(firstNode.children).toEqual([
        {
          id: entries[2].path,
          name: 'A',
        },
        {
          id: entries[1].path,
          name: 'B',
        },
      ]);
    });

    it('puts directories first in a child node', () => {
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'parent',
          mime_category: 'directory',
          path: 'parent',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'B',
          mime_category: 'directory',
          path: 'parent/B',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'A',
          path: 'parent/A',
        }),
      ];
      const version = createVersionWithEntries(entries);

      const tree = buildFileTreeNodes(version);
      const firstNode = tree.children[0] as DirectoryNode;

      expect(firstNode.children).toEqual([
        {
          id: entries[1].path,
          name: 'B',
          children: [],
        },
        {
          id: entries[2].path,
          name: 'A',
        },
      ]);
    });
  });

  describe('buildTreePathList', () => {
    it('builds a treePathList from a tree', () => {
      const file1 = 'file1.js';
      const file2 = 'file2.js';
      const folder1 = 'folder1';
      const folder2 = 'folder2';

      const tree: DirectoryNode = {
        id: 'root',
        name: 'addon name',
        children: [
          {
            id: folder1,
            name: folder1,
            children: [
              {
                id: folder2,
                name: folder2,
                children: [
                  { id: `${folder1}/${folder2}/${file1}`, name: file1 },
                  { id: `${folder1}/${folder2}/${file2}`, name: file2 },
                ],
              },
              { id: `${folder1}/${file1}`, name: file1 },
              { id: `${folder1}/${file2}`, name: file2 },
            ],
          },
          { id: file1, name: file1 },
        ],
      };

      expect(buildTreePathList(tree)).toEqual([
        `${folder1}/${folder2}/${file1}`,
        `${folder1}/${folder2}/${file2}`,
        `${folder1}/${file1}`,
        `${folder1}/${file2}`,
        file1,
      ]);
    });
  });

  describe('getRelativePath', () => {
    const file1 = 'file1.js';
    const file2 = 'file2.js';
    const file3 = 'file3.js';
    const pathList = [file1, file2, file3];

    it('returns the next file in the list', () => {
      expect(
        getRelativePath({ currentPath: file2, pathList, position: 'next' }),
      ).toEqual(file3);
    });

    it('returns the previous file in the list', () => {
      expect(
        getRelativePath({ currentPath: file2, pathList, position: 'previous' }),
      ).toEqual(file1);
    });

    it('wraps around to the first file in the list', () => {
      expect(
        getRelativePath({ currentPath: file3, pathList, position: 'next' }),
      ).toEqual(file1);
    });

    it('wraps around to the last file in the list', () => {
      expect(
        getRelativePath({ currentPath: file1, pathList, position: 'previous' }),
      ).toEqual(file3);
    });

    it('returns undefined if the currentPath is not found', () => {
      expect(
        getRelativePath({
          currentPath: 'bad-file-name',
          pathList,
          position: 'previous',
        }),
      ).toEqual(undefined);
    });

    it('logs a debug message if the currentPath is not found', () => {
      const _log = createFakeLogger();
      getRelativePath({
        _log,
        currentPath: 'bad-file-name',
        pathList,
        position: 'previous',
      });
      expect(_log.debug).toHaveBeenCalled();
    });
  });
});
