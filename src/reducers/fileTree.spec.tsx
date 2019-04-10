/* eslint @typescript-eslint/camelcase: 0 */
import reducer, {
  ROOT_PATH,
  DirectoryNode,
  GetRelativeMessageUidParams,
  RelativePathPosition,
  actions,
  buildFileTree,
  buildFileTreeNodes,
  buildTreePathList,
  getRelativeMessageUid,
  getRelativePath,
  getTree,
  goToRelativeFile,
  initialState,
} from './fileTree';
import { createInternalVersion, createInternalVersionEntry } from './versions';
import { ExternalLinterMessage, LinterMessageMap } from './linter';
import {
  createFakeLinterMessagesByPath,
  createFakeThunk,
  createVersionWithEntries,
  fakeVersion,
  fakeVersionEntry,
  thunkTester,
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

  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const version = createVersionWithEntries([]);
      const addonName = getLocalizedString(version.addon.name);

      const tree = buildFileTreeNodes(version);

      expect(tree).toEqual({
        id: ROOT_PATH,
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
        getRelativePath({
          currentPath: file2,
          pathList,
          position: RelativePathPosition.next,
        }),
      ).toEqual(file3);
    });

    it('returns the previous file in the list', () => {
      expect(
        getRelativePath({
          currentPath: file2,
          pathList,
          position: RelativePathPosition.previous,
        }),
      ).toEqual(file1);
    });

    it('wraps around to the first file in the list', () => {
      expect(
        getRelativePath({
          currentPath: file3,
          pathList,
          position: RelativePathPosition.next,
        }),
      ).toEqual(file1);
    });

    it('wraps around to the last file in the list', () => {
      expect(
        getRelativePath({
          currentPath: file1,
          pathList,
          position: RelativePathPosition.previous,
        }),
      ).toEqual(file3);
    });

    it('throws an exception if the currentPath is not found', () => {
      const badFilename = 'bad-file-name.js';
      expect(() => {
        getRelativePath({
          currentPath: badFilename,
          pathList,
          position: RelativePathPosition.previous,
        });
      }).toThrow(`Cannot find ${badFilename} in pathList: ${pathList}`);
    });
  });

  describe('goToRelativeFile', () => {
    const _goToRelativeFile = ({
      _getRelativePath = jest.fn(),
      _viewVersionFile = jest.fn(),
      currentPath = 'file1.js',
      pathList = ['file1.js'],
      position = RelativePathPosition.next,
      versionId = 1,
    } = {}) => {
      return goToRelativeFile({
        _getRelativePath,
        _viewVersionFile,
        currentPath,
        pathList,
        position,
        versionId,
      });
    };

    it('calls getRelativePath', async () => {
      const _getRelativePath = jest.fn();
      const currentPath = 'file1.js';
      const pathList = [currentPath];
      const position = RelativePathPosition.next;

      const { thunk } = thunkTester({
        createThunk: () =>
          _goToRelativeFile({
            _getRelativePath,
            currentPath,
            pathList,
            position,
          }),
      });

      await thunk();

      expect(_getRelativePath).toHaveBeenCalledWith({
        currentPath,
        pathList,
        position,
      });
    });

    it('dispatches viewVersionFile()', async () => {
      const nextPath = 'file2.js';
      const _getRelativePath = jest.fn().mockReturnValue(nextPath);
      const versionId = 123;

      const fakeThunk = createFakeThunk();
      const _viewVersionFile = fakeThunk.createThunk;

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _goToRelativeFile({
            _getRelativePath,
            _viewVersionFile,
            versionId,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_viewVersionFile).toHaveBeenCalledWith({
        selectedPath: nextPath,
        versionId,
      });
    });
  });

  describe('getRelativeMessageUid', () => {
    const file1 = 'file1.js';
    const file2 = 'file2.js';
    const file3 = 'file3.js';
    const line1 = 1;
    const line2 = 2;
    const line3 = 3;
    const line1FirstUid = 'line1-uid-1';
    const line1SecondUid = 'line1-uid-2';
    const line2Uid = 'line2-uid';
    const line3Uid = 'line3-uid';
    const global1 = 'global-uid-1';
    const global2 = 'global-uid-2';

    const createMessageMap = (
      messagesByPath: {
        path: string;
        messages: Partial<ExternalLinterMessage>[];
      }[],
    ) => {
      const messageMap: LinterMessageMap = {};
      for (const { messages, path } of messagesByPath) {
        messageMap[path] = createFakeLinterMessagesByPath({
          messages,
          path,
        });
      }
      return messageMap;
    };

    const _getRelativeMessageUid = ({
      currentMessageUid = 'uid1',
      currentPath = file1,
      messageMap = createMessageMap([{ path: file1, messages: [] }]),
      pathList = [file1],
      position = RelativePathPosition.next,
    }: Partial<GetRelativeMessageUidParams>) => {
      return getRelativeMessageUid({
        currentMessageUid,
        currentPath,
        messageMap,
        pathList,
        position,
      });
    };

    it('returns null if there are no messages in the map', () => {
      expect(
        _getRelativeMessageUid({
          currentMessageUid: '',
          messageMap: createMessageMap([]),
        }),
      ).toEqual(null);
    });

    it('throws an error if there is a current message, but no messages for the current path', () => {
      const currentPath = 'currentPath.js';
      const messagePath = 'notTheCurrentPath.js';

      const messageMap = createMessageMap([
        { path: messagePath, messages: [{ line: line1, uid: 'line1' }] },
      ]);

      expect(() => {
        _getRelativeMessageUid({
          currentMessageUid: 'some-uid',
          currentPath,
          messageMap,
        });
      }).toThrow(`No messages found for current path: ${currentPath}`);
    });

    it('returns the first global message if no currentMessageUid exists', () => {
      const externalMessages = [
        { line: null, uid: global1 },
        { line: line1, uid: line1FirstUid },
      ];

      const messageMap = createMessageMap([
        { path: file1, messages: externalMessages },
      ]);

      expect(
        _getRelativeMessageUid({
          currentMessageUid: '',
          messageMap,
        }),
      ).toEqual(global1);
    });

    it('returns the first byLine message if no currentMessageUid exists and no global messages exist', () => {
      const externalMessages = [{ line: line1, uid: line1FirstUid }];

      const messageMap = createMessageMap([
        { path: file1, messages: externalMessages },
      ]);

      expect(
        _getRelativeMessageUid({
          currentMessageUid: '',
          messageMap,
        }),
      ).toEqual(line1FirstUid);
    });

    describe('messages within a file', () => {
      const externalMessages = [
        { line: null, uid: global1 },
        { line: null, uid: global2 },
        { line: line1, uid: line1FirstUid },
        { line: line1, uid: line1SecondUid },
        { line: line2, uid: line2Uid },
        { line: line3, uid: line3Uid },
      ];

      const messageMap = createMessageMap([
        { path: file1, messages: externalMessages },
      ]);

      it('returns the next global message in the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: global1,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual(global2);
      });

      it('returns the previous global message in the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: global2,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(global1);
      });

      it('returns the first byLine message when at the last global message for the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: global2,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual(line1FirstUid);
      });

      it('returns the last global message when at the first byLine message for the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line1FirstUid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(global2);
      });

      it('returns the next byLine message for the line', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line1FirstUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual(line1SecondUid);
      });

      it('returns the previous byLine message for the line', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(line1FirstUid);
      });

      it('returns the next byLine message for the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual(line2Uid);
      });

      it('returns the previous byLine message for the file', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line2Uid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(line1SecondUid);
      });

      it('returns the next byLine message for the file when no more messages for a line', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual(line2Uid);
      });

      it('returns the previous byLine message for the file when no more messages for the line', () => {
        expect(
          _getRelativeMessageUid({
            currentMessageUid: line2Uid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(line1SecondUid);
      });
    });

    describe('messages for multiple files', () => {
      const line1Uid1 = 'line1-uid-1';
      const line2Uid1 = 'line2-uid-1';
      const global11 = 'global-uid-1-1';
      const global21 = 'global-uid-2-1';
      const line1Uid2 = 'line1-uid-2';
      const global12 = 'global-uid-1-2';

      const pathList = [file1, file2, file3];

      it('returns the first global message in the next file', () => {
        const externalMessages1 = [{ line: null, uid: global11 }];
        const externalMessages2 = [
          { line: null, uid: global12 },
          { line: line1, uid: line1Uid2 },
        ];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);
        expect(
          _getRelativeMessageUid({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual(global12);
      });

      it('returns the first byLine message in the next file', () => {
        const externalMessages1 = [{ line: null, uid: global11 }];
        const externalMessages2 = [{ line: line1, uid: line1Uid2 }];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);

        expect(
          _getRelativeMessageUid({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual(line1Uid2);
      });

      it('returns the last byLine message in the previous file', () => {
        const externalMessages1 = [
          { line: null, uid: global11 },
          { line: line1, uid: line1Uid1 },
          { line: line2, uid: line2Uid1 },
        ];
        const externalMessages2 = [{ line: null, uid: global12 }];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);

        expect(
          _getRelativeMessageUid({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(line2Uid1);
      });

      it('returns the last global message in the previous file', () => {
        const externalMessages1 = [
          { line: null, uid: global11 },
          { line: null, uid: global21 },
        ];
        const externalMessages2 = [{ line: null, uid: global12 }];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);

        expect(
          _getRelativeMessageUid({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(global21);
      });

      it('wraps around from the last message in the last file to the first message in the first file', () => {
        const externalMessages1 = [
          { line: null, uid: global11 },
          { line: null, uid: global21 },
        ];
        const externalMessages2 = [{ line: null, uid: global12 }];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);

        expect(
          _getRelativeMessageUid({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual(global11);
      });

      it('wraps around from the first message in the first file to the last message in the last file', () => {
        const externalMessages1 = [
          { line: null, uid: global11 },
          { line: null, uid: global21 },
        ];
        const externalMessages2 = [{ line: null, uid: global12 }];

        const messageMap = createMessageMap([
          { path: file1, messages: externalMessages1 },
          { path: file3, messages: externalMessages2 },
        ]);

        expect(
          _getRelativeMessageUid({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual(global12);
      });
    });
  });
});
