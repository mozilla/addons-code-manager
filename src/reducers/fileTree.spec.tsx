/* eslint @typescript-eslint/camelcase: 0 */
import reducer, {
  ROOT_PATH,
  DirectoryNode,
  GetRelativeMessageParams,
  RelativePathPosition,
  actions,
  buildFileTree,
  buildFileTreeNodes,
  buildTreePathList,
  findRelativePathWithDiff,
  getRelativeMessage,
  getRelativePath,
  getTree,
  goToRelativeFile,
  initialState,
} from './fileTree';
import {
  ExternalVersionEntry,
  createInternalVersion,
  createInternalVersionEntry,
} from './versions';
import { getMessageMap } from './linter';
import {
  createFakeExternalLinterResult,
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

  describe('getRelativeMessage', () => {
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

    const _getRelativeMessage = ({
      currentMessageUid = 'uid1',
      currentPath = file1,
      messageMap = getMessageMap(
        createFakeExternalLinterResult({ messages: [] }),
      ),
      pathList = [file1],
      position = RelativePathPosition.next,
    }: Partial<GetRelativeMessageParams>) => {
      return getRelativeMessage({
        currentMessageUid,
        currentPath,
        messageMap,
        pathList,
        position,
      });
    };

    it('returns null if there are no messages in the map', () => {
      expect(
        _getRelativeMessage({
          currentMessageUid: '',
          messageMap: getMessageMap(
            createFakeExternalLinterResult({ messages: [] }),
          ),
        }),
      ).toEqual(null);
    });

    it('throws an error if there is a current message, but no messages for the current path', () => {
      const currentPath = 'currentPath.js';
      const messagePath = 'notTheCurrentPath.js';

      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [{ file: messagePath, line: line1, uid: 'line1' }],
        }),
      );

      expect(() => {
        _getRelativeMessage({
          currentMessageUid: 'some-uid',
          currentPath,
          messageMap,
        });
      }).toThrow(`No messages found for current path: ${currentPath}`);
    });

    it('throws an error with an empty pathList', () => {
      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [
            { file: file1, line: null, uid: global1 },
            { file: file1, line: line1, uid: line1FirstUid },
            { file: file3, line: null, uid: global2 },
          ],
        }),
      );

      expect(() => {
        _getRelativeMessage({
          currentMessageUid: global2,
          currentPath: file3,
          messageMap,
          pathList: [],
          position: RelativePathPosition.next,
        });
      }).toThrow(
        `findRelativeMessage was unable to find a message using currentPath: ${file3}`,
      );
    });

    it('returns the first global message if no currentMessageUid exists', () => {
      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [
            { file: file1, line: null, uid: global1 },
            { file: file1, line: line1, uid: line1FirstUid },
          ],
        }),
      );

      expect(
        _getRelativeMessage({
          currentMessageUid: '',
          messageMap,
        }),
      ).toEqual({ path: file1, uid: global1 });
    });

    it('returns the first global message from a path with messages if no currentMessageUid exists', () => {
      const pathList = [file1, file2];

      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [
            { file: file2, line: null, uid: global1 },
            { file: file2, line: line1, uid: line1FirstUid },
          ],
        }),
      );

      expect(
        _getRelativeMessage({
          currentMessageUid: '',
          currentPath: file2,
          messageMap,
          pathList,
        }),
      ).toEqual({ path: file2, uid: global1 });
    });

    it('returns the first byLine message if no currentMessageUid exists and no global messages exist', () => {
      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [{ file: file1, line: line1, uid: line1FirstUid }],
        }),
      );

      expect(
        _getRelativeMessage({
          currentMessageUid: '',
          messageMap,
        }),
      ).toEqual({ path: file1, uid: line1FirstUid });
    });

    describe('messages within a file', () => {
      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [
            { file: file1, line: null, uid: global1 },
            { file: file1, line: null, uid: global2 },
            { file: file1, line: line1, uid: line1FirstUid },
            { file: file1, line: line1, uid: line1SecondUid },
            { file: file1, line: line2, uid: line2Uid },
            { file: file1, line: line3, uid: line3Uid },
          ],
        }),
      );

      it('returns the next global message in the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: global1,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: global2 });
      });

      it('returns the previous global message in the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: global2,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: global1 });
      });

      it('returns the first byLine message when at the last global message for the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: global2,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: line1FirstUid });
      });

      it('returns the last global message when at the first byLine message for the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line1FirstUid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: global2 });
      });

      it('returns the next byLine message for the line', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line1FirstUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: line1SecondUid });
      });

      it('returns the previous byLine message for the line', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: line1FirstUid });
      });

      it('returns the next byLine message for the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: line2Uid });
      });

      it('returns the previous byLine message for the file', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line2Uid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: line1SecondUid });
      });

      it('returns the next byLine message for the file when no more messages for a line', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line1SecondUid,
            messageMap,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: line2Uid });
      });

      it('returns the previous byLine message for the file when no more messages for the line', () => {
        expect(
          _getRelativeMessage({
            currentMessageUid: line2Uid,
            messageMap,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: line1SecondUid });
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
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file3, line: null, uid: global12 },
              { file: file3, line: line1, uid: line1Uid2 },
            ],
          }),
        );
        expect(
          _getRelativeMessage({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file3, uid: global12 });
      });

      it('returns the first byLine message in the next file', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file3, line: line1, uid: line1Uid2 },
            ],
          }),
        );

        expect(
          _getRelativeMessage({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file3, uid: line1Uid2 });
      });

      it('skips files with empty messages', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file3, line: line1, uid: line1Uid2 },
            ],
          }),
        );

        // Map a file without any messages. This file should be skipped.
        messageMap[file2] = { global: [], byLine: [] };

        expect(
          _getRelativeMessage({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file3, uid: line1Uid2 });
      });

      it('returns the last byLine message in the previous file', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file1, line: line1, uid: line1Uid1 },
              { file: file1, line: line2, uid: line2Uid1 },
              { file: file3, line: null, uid: global12 },
            ],
          }),
        );

        expect(
          _getRelativeMessage({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: line2Uid1 });
      });

      it('returns the last global message in the previous file', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file1, line: null, uid: global21 },
              { file: file3, line: null, uid: global12 },
            ],
          }),
        );

        expect(
          _getRelativeMessage({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file1, uid: global21 });
      });

      it('wraps around from the last message in the last file to the first message in the first file', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file1, line: null, uid: global21 },
              { file: file3, line: null, uid: global12 },
            ],
          }),
        );

        expect(
          _getRelativeMessage({
            currentMessageUid: global12,
            currentPath: file3,
            messageMap,
            pathList,
            position: RelativePathPosition.next,
          }),
        ).toEqual({ path: file1, uid: global11 });
      });

      it('wraps around from the first message in the first file to the last message in the last file', () => {
        const messageMap = getMessageMap(
          createFakeExternalLinterResult({
            messages: [
              { file: file1, line: null, uid: global11 },
              { file: file1, line: null, uid: global21 },
              { file: file3, line: null, uid: global12 },
            ],
          }),
        );

        expect(
          _getRelativeMessage({
            currentMessageUid: global11,
            currentPath: file1,
            messageMap,
            pathList,
            position: RelativePathPosition.previous,
          }),
        ).toEqual({ path: file3, uid: global12 });
      });
    });
  });

  describe('findRelativePathWithDiff', () => {
    const file1 = 'file1.js';
    const file2 = 'file2.js';
    const file3 = 'file3.js';
    const file4 = 'file4.js';

    // const entries = [
    //   createInternalVersionEntry({
    //     ...fakeVersionEntry,
    //     filename: file1,
    //     mime_category: 'text',
    //     path: file1,
    //     status: 'M',
    //   }),
    //   // Note that file2 does not contain any changes.
    //   createInternalVersionEntry({
    //     ...fakeVersionEntry,
    //     filename: file2,
    //     mime_category: 'text',
    //     path: file2,
    //     status: '',
    //   }),
    //   createInternalVersionEntry({
    //     ...fakeVersionEntry,
    //     filename: file3,
    //     mime_category: 'text',
    //     path: file3,
    //     status: 'M',
    //   }),
    //   createInternalVersionEntry({
    //     ...fakeVersionEntry,
    //     filename: file4,
    //     mime_category: 'text',
    //     path: file4,
    //     status: 'M',
    //   }),
    // ];

    const getFakeVersionAndPathList = (
      entries: ({ path: string } & Partial<ExternalVersionEntry>)[],
    ) => {
      const pathList = entries.map((e) => e.path);

      const version = createVersionWithEntries(
        entries.map((params) =>
          createInternalVersionEntry({
            ...fakeVersionEntry,
            mime_category: 'text',
            status: 'M',
            ...params,
            filename: params.path,
          }),
        ),
      );

      return { pathList, version };
    };

    it('gets the next path which has a diff', () => {
      const { pathList, version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
        { path: file2, status: '' },
        { path: file3, status: 'M' },
        { path: file4, status: 'M' },
      ]);

      expect(
        findRelativePathWithDiff({
          currentPath: file1,
          pathList,
          position: RelativePathPosition.next,
          version,
        }),
      ).toEqual(file3);
    });

    it('gets the previous path which has a diff', () => {
      const { pathList, version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
        { path: file2, status: '' },
        { path: file3, status: 'M' },
        { path: file4, status: 'M' },
      ]);

      expect(
        findRelativePathWithDiff({
          currentPath: file3,
          pathList,
          position: RelativePathPosition.previous,
          version,
        }),
      ).toEqual(file1);
    });

    it('wraps around to the first path on next', () => {
      const { pathList, version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
        { path: file2, status: '' },
        { path: file3, status: 'M' },
        { path: file4, status: 'M' },
      ]);

      expect(
        findRelativePathWithDiff({
          currentPath: file4,
          pathList,
          position: RelativePathPosition.next,
          version,
        }),
      ).toEqual(file1);
    });

    it('wraps around to the last path on previous', () => {
      const { pathList, version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
        { path: file2, status: '' },
        { path: file3, status: 'M' },
        { path: file4, status: 'M' },
      ]);

      expect(
        findRelativePathWithDiff({
          currentPath: file1,
          pathList,
          position: RelativePathPosition.previous,
          version,
        }),
      ).toEqual(file4);
    });

    it('returns the current path if there are no other paths with changes', () => {
      const { pathList, version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
        { path: file2, status: '' },
      ]);

      expect(
        findRelativePathWithDiff({
          currentPath: file1,
          pathList,
          position: RelativePathPosition.next,
          version,
        }),
      ).toEqual(file1);
    });

    it('throws an error if no entry is found for the next path', () => {
      const { version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
      ]);

      expect(() => {
        findRelativePathWithDiff({
          currentPath: file1,
          pathList: [file1, file2],
          position: RelativePathPosition.next,
          version,
        });
      }).toThrow(`Entry missing for path: ${file2}, versionId: ${version.id}`);
    });

    it('throws an error if no paths with diffs were found at all', () => {
      const { version } = getFakeVersionAndPathList([
        { path: file1, status: 'M' },
      ]);

      expect(() => {
        findRelativePathWithDiff({
          currentPath: file1,
          pathList: [],
          position: RelativePathPosition.next,
          version,
        });
      }).toThrow(
        `findRelativePathWithDiff was unable to find a path with a diff using currentPath: ${file1}`,
      );
    });
  });
});
