/* eslint @typescript-eslint/camelcase: 0 */
import * as React from 'react';
import { shallow } from 'enzyme';
import Treefold, { TreefoldRenderProps } from 'react-treefold';
import { ListGroup } from 'react-bootstrap';

import configureStore from '../../configureStore';
import {
  Version,
  actions as versionActions,
  createInternalVersionEntry,
  getVersion,
} from '../../reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../../test-helpers';
import { getLocalizedString } from '../../utils';

import FileTree, { buildFileTree, TreeNode, DirectoryNode } from '.';

describe(__filename, () => {
  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const versionId = '1234';
      const entries: Version['entries'] = {};

      const tree = buildFileTree(versionId, entries);

      expect(tree).toEqual({
        id: `root-${versionId}`,
        name: versionId,
        children: [],
      });
    });

    it('converts a non-directory entry to a file node', () => {
      const path = 'path1.js';
      const versionId = '1234';

      const filename = 'some-filename';
      const entries = {
        [path]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename,
          mime_category: 'text',
          path,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: path,
          name: filename,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const path = 'path1.js';
      const versionId = '1234';

      const filename = 'some-directory';
      const entries = {
        [path]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename,
          mime_category: 'directory',
          path,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: path,
          name: filename,
          children: [],
        },
      ]);
    });

    it('finds the appropriate node to add a new entry to it', () => {
      const versionId = '1234';

      const directory = 'parent';
      const file = 'child';
      const filePath = `${directory}/${file}`;

      const entries = {
        [directory]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: directory,
          mime_category: 'directory',
          path: directory,
        }),
        [filePath]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: file,
          mime_category: 'text',
          path: filePath,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: directory,
          name: directory,
          children: [
            {
              id: filePath,
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
      const middlePath = `${directoryName}/${directoryName}`;
      const filePath = `${directoryName}/${directoryName}/${fileName}`;

      const entries = {
        [directoryName]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: directoryName,
          mime_category: 'directory',
          path: directoryName,
        }),
        [middlePath]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: directoryName,
          mime_category: 'directory',
          path: middlePath,
        }),
        [filePath]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 2,
          filename: fileName,
          mime_category: 'text',
          path: filePath,
        }),
      };

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: directoryName,
          name: directoryName,
          children: [
            {
              id: middlePath,
              name: directoryName,
              children: [
                {
                  id: filePath,
                  name: fileName,
                },
              ],
            },
          ],
        },
      ]);
    });

    it('sorts the nodes so that directories come first', () => {
      const pathA = 'A';
      const pathB = 'B';
      const pathC = 'C';
      const versionId = '1234';
      const entries = {
        [pathB]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathB,
          mime_category: 'directory',
          path: pathB,
        }),
        [pathA]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathA,
          mime_category: 'text',
          path: pathA,
        }),
        [pathC]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathC,
          mime_category: 'directory',
          path: pathC,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: pathB,
          name: pathB,
          children: [],
        },
        {
          id: pathC,
          name: pathC,
          children: [],
        },
        {
          id: pathA,
          name: pathA,
        },
      ]);
    });

    it('sorts files alphabetically', () => {
      const pathA = 'A';
      const pathB = 'B';
      const pathC = 'C';
      const versionId = '1234';
      const entries = {
        [pathC]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathC,
          path: pathC,
        }),
        [pathB]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathB,
          path: pathB,
        }),
        [pathA]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathA,
          path: pathA,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: pathA,
          name: pathA,
        },
        {
          id: pathB,
          name: pathB,
        },
        {
          id: pathC,
          name: pathC,
        },
      ]);
    });

    it('sorts directories alphabetically', () => {
      const pathA = 'A';
      const pathB = 'B';
      const versionId = '1234';
      const entries = {
        [pathB]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathB,
          mime_category: 'directory',
          path: pathB,
        }),
        [pathA]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: pathA,
          mime_category: 'directory',
          path: pathA,
        }),
      };

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: pathA,
          name: pathA,
          children: [],
        },
        {
          id: pathB,
          name: pathB,
          children: [],
        },
      ]);
    });

    it('sorts the nodes recursively', () => {
      const pathParent = 'parent';
      const pathA = 'parent/A';
      const pathB = 'parent/B';
      const versionId = '1234';
      const entries = {
        [pathParent]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'parent',
          mime_category: 'directory',
          path: pathParent,
        }),
        [pathB]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'B',
          path: pathB,
        }),
        [pathA]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'A',
          path: pathA,
        }),
      };

      const tree = buildFileTree(versionId, entries);
      const firstNode = tree.children[0] as DirectoryNode;

      expect(firstNode.children).toEqual([
        {
          id: pathA,
          name: 'A',
        },
        {
          id: pathB,
          name: 'B',
        },
      ]);
    });

    it('puts directories first in a child node', () => {
      const pathParent = 'parent';
      const pathA = 'parent/A';
      const pathB = 'parent/B';
      const versionId = '1234';
      const entries = {
        [pathParent]: createInternalVersionEntry({
          ...fakeVersionEntry,
          filename: 'parent',
          mime_category: 'directory',
          path: pathParent,
        }),
        [pathB]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'B',
          mime_category: 'directory',
          path: pathB,
        }),
        [pathA]: createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          filename: 'A',
          path: pathA,
        }),
      };

      const tree = buildFileTree(versionId, entries);
      const firstNode = tree.children[0] as DirectoryNode;

      expect(firstNode.children).toEqual([
        {
          id: pathB,
          name: 'B',
          children: [],
        },
        {
          id: pathA,
          name: 'A',
        },
      ]);
    });
  });

  describe('FileTree', () => {
    const getVersionFromStore = (version = fakeVersion) => {
      const store = configureStore();
      store.dispatch(versionActions.loadVersionInfo({ version }));

      return getVersion(store.getState().versions, version.id);
    };

    const render = ({
      onSelect = jest.fn(),
      version = getVersionFromStore(fakeVersion),
    } = {}) => {
      return shallow(<FileTree version={version} onSelect={onSelect} />);
    };

    it('renders a ListGroup component with a Treefold', () => {
      const version = getVersionFromStore({ ...fakeVersion, id: 777 });

      const root = render({ version });

      expect(root.find(ListGroup)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveProp('nodes', [
        buildFileTree(getLocalizedString(version.addon.name), version.entries),
      ]);
    });

    it('passes the onSelect prop to FileTreeNode', () => {
      const version = getVersionFromStore({ ...fakeVersion, id: 777 });
      const onSelect = jest.fn();

      const root = render({ version, onSelect });

      const node = (root.instance() as FileTree).renderNode(
        // It does not really matter which props are given here.
        // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
        {} as TreefoldRenderProps<TreeNode>,
      );

      expect(node.props.onSelect).toEqual(onSelect);
    });
  });
});
