/* eslint @typescript-eslint/camelcase: 0 */
import * as React from 'react';
import { shallow } from 'enzyme';
import Treefold from 'react-treefold';
import { ListGroup } from 'react-bootstrap';

import configureStore from '../../configureStore';
import {
  Version,
  actions as versionActions,
  createInternalVersion,
  createInternalVersionEntry,
  getVersionInfo,
} from '../../reducers/versions';
import {
  createFakeLogger,
  fakeVersion,
  fakeVersionEntry,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import { getLocalizedString } from '../../utils';
import { getTreefoldRenderProps } from '../FileTreeNode/index.spec';
import FileTreeNode from '../FileTreeNode';

import FileTree, { DirectoryNode, FileTreeBase, buildFileTree } from '.';

describe(__filename, () => {
  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const versionId = '1234';
      const entries: Version['entries'] = [];

      const tree = buildFileTree(versionId, entries);

      expect(tree).toEqual({
        id: `root-${versionId}`,
        name: versionId,
        children: [],
      });
    });

    it('converts a non-directory entry to a file node', () => {
      const versionId = '1234';

      const filename = 'some-filename';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          mime_category: 'text',
          filename,
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const versionId = '1234';

      const filename = 'some-directory';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          mime_category: 'directory',
          filename,
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
          children: [],
        },
      ]);
    });

    it('finds the appropriate node to add a new entry to it', () => {
      const versionId = '1234';

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

      const tree = buildFileTree(versionId, entries);

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

    it('traverses multiple levels to find the right directory', () => {
      const versionId = 'some-name';

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

    it('sorts the nodes so that directories come first', () => {
      const versionId = '1234';
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

      const tree = buildFileTree(versionId, entries);

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
      const versionId = '1234';
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

      const tree = buildFileTree(versionId, entries);

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
      const versionId = '1234';
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

      const tree = buildFileTree(versionId, entries);

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
      const versionId = '1234';
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

      const tree = buildFileTree(versionId, entries);
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
      const versionId = '1234';
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

      const tree = buildFileTree(versionId, entries);
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

  describe('FileTree', () => {
    const getVersion = ({
      store = configureStore(),
      version = fakeVersion,
    }) => {
      store.dispatch(versionActions.loadVersionInfo({ version }));

      return getVersionInfo(store.getState().versions, version.id);
    };

    const render = ({
      _log = createFakeLogger(),
      onSelect = jest.fn(),
      store = configureStore(),
      version = getVersion({ store }),
    } = {}) => {
      return shallowUntilTarget(
        <FileTree _log={_log} versionId={version.id} onSelect={onSelect} />,
        FileTreeBase,
        {
          shallowOptions: { context: { store } },
        },
      );
    };

    it('renders a ListGroup component with a Treefold', () => {
      const store = configureStore();
      const version = getVersion({ store });

      const root = render({ store, version });

      expect(root.find(ListGroup)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveProp('nodes', [
        buildFileTree(getLocalizedString(version.addon.name), version.entries),
      ]);
    });

    it('passes the onSelect prop to FileTreeNode', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const onSelect = jest.fn();

      const root = render({ onSelect, store, version });

      const node = (root.instance() as FileTreeBase).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(FileTreeNode)).toHaveProp(
        'onSelect',
        onSelect,
      );
    });

    it('passes the version prop to FileTreeNode', () => {
      const store = configureStore();
      const version = getVersion({ store });

      const root = render({ store, version });

      const node = (root.instance() as FileTreeBase).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(FileTreeNode)).toHaveProp(
        'version',
        version,
      );
    });

    it('dispatches toggleExpandedPath when onToggleExpand is called', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };

      const dispatch = spyOn(store, 'dispatch');

      const root = render({ store, version });

      const treeFold = root.find(Treefold);
      expect(treeFold).toHaveProp('onToggleExpand');

      const onToggleExpand = treeFold.prop('onToggleExpand');
      onToggleExpand(node);

      expect(dispatch).toHaveBeenCalledWith(
        versionActions.toggleExpandedPath({
          path: node.id,
          versionId: version.id,
        }),
      );
    });

    it('recognizes a node as expanded when it has been added to expandedPaths', () => {
      const store = configureStore();
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      let version = getVersion({ store });

      store.dispatch(
        versionActions.toggleExpandedPath({
          path: node.id,
          versionId: version.id,
        }),
      );

      version = getVersionInfo(store.getState().versions, version.id);

      const root = render({ store, version });

      const treeFold = root.find(Treefold);
      expect(treeFold).toHaveProp('isNodeExpanded');

      const isNodeExpanded = treeFold.prop('isNodeExpanded');
      expect(isNodeExpanded(node)).toBeTruthy();
    });

    it('recognizes a node as not expanded when it has not been added to expandedPaths', () => {
      const store = configureStore();
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      const version = getVersion({ store });

      const root = render({ store, version });

      const treeFold = root.find(Treefold);
      expect(treeFold).toHaveProp('isNodeExpanded');

      const isNodeExpanded = treeFold.prop('isNodeExpanded');
      expect(isNodeExpanded(node)).toBeFalsy();
    });

    it('logs a warning message when no version is loaded', () => {
      const _log = createFakeLogger();

      render({
        _log,
        version: createInternalVersion({ ...fakeVersion, id: 0 }),
      });

      expect(_log.warn).toHaveBeenCalled();
    });
  });
});
