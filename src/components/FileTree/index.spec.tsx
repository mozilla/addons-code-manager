import * as React from 'react';
import { shallow } from 'enzyme';
import Treefold from 'react-treefold';
import { ListGroup } from 'react-bootstrap';

import configureStore from '../../configureStore';
import {
  Version,
  actions as versionActions,
  createInternalVersionEntry,
  getVersionInfo,
} from '../../reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../../test-helpers';

import FileTree, { buildFileTree, DirectoryNode } from '.';

describe(__filename, () => {
  describe('buildFileTree', () => {
    it('creates a root node', () => {
      const versionId = '1234';
      const entries: Version['entries'] = [];

      const tree = buildFileTree(versionId, entries);

      expect(tree).toEqual({
        id: `root-${versionId}`,
        name: versionId,
        expanded: true,
        children: [],
      });
    });

    it('converts a non-directory entry to a file node', () => {
      const versionId = '1234';

      const filename = 'some-filename';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: false,
          filename,
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
          expanded: false,
        },
      ]);
    });

    it('converts a directory entry to a directory node', () => {
      const versionId = '1234';

      const filename = 'some-directory';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename,
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: filename,
          expanded: false,
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
          directory: true,
          filename: directory,
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: false,
          depth: 1,
          filename: file,
          path: `${directory}/${file}`,
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: directory,
          expanded: false,
          children: [
            {
              id: entries[1].path,
              name: file,
              expanded: false,
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
          directory: true,
          filename: directoryName,
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          depth: 1,
          filename: directoryName,
          path: `${directoryName}/${directoryName}`,
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: false,
          depth: 2,
          filename: fileName,
          path: `${directoryName}/${directoryName}/${fileName}`,
        }),
      ];

      const data = buildFileTree(versionId, entries);

      expect(data.children).toEqual([
        {
          id: entries[0].path,
          name: directoryName,
          expanded: false,
          children: [
            {
              id: entries[1].path,
              name: directoryName,
              expanded: false,
              children: [
                {
                  id: entries[2].path,
                  name: fileName,
                  expanded: false,
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
          directory: true,
          filename: 'B',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: false,
          filename: 'A',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename: 'C',
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[0].path,
          name: 'B',
          expanded: false,
          children: [],
        },
        {
          id: entries[2].path,
          name: 'C',
          expanded: false,
          children: [],
        },
        {
          id: entries[1].path,
          name: 'A',
          expanded: false,
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
          expanded: false,
        },
        {
          id: entries[1].path,
          name: 'B',
          expanded: false,
        },
        {
          id: entries[0].path,
          name: 'C',
          expanded: false,
        },
      ]);
    });

    it('sorts directories alphabetically', () => {
      const versionId = '1234';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename: 'B',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename: 'A',
        }),
      ];

      const tree = buildFileTree(versionId, entries);

      expect(tree.children).toEqual([
        {
          id: entries[1].path,
          name: 'A',
          expanded: false,
          children: [],
        },
        {
          id: entries[0].path,
          name: 'B',
          expanded: false,
          children: [],
        },
      ]);
    });

    it('sorts the nodes recursively', () => {
      const versionId = '1234';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename: 'parent',
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
          expanded: false,
        },
        {
          id: entries[1].path,
          name: 'B',
          expanded: false,
        },
      ]);
    });

    it('puts directories first in a child node', () => {
      const versionId = '1234';
      const entries = [
        createInternalVersionEntry({
          ...fakeVersionEntry,
          directory: true,
          filename: 'parent',
          path: 'parent',
        }),
        createInternalVersionEntry({
          ...fakeVersionEntry,
          depth: 1,
          directory: true,
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
          id: entries[1].path,
          name: 'B',
          expanded: false,
          children: [],
        },
        {
          id: entries[2].path,
          name: 'A',
          expanded: false,
        },
      ]);
    });
  });

  describe('FileTree', () => {
    const getVersion = (version = fakeVersion) => {
      const store = configureStore();
      store.dispatch(versionActions.loadVersionInfo({ version }));

      return getVersionInfo(store.getState().versions, version.id);
    };

    const render = ({ version = getVersion(fakeVersion) } = {}) => {
      return shallow(<FileTree version={version} />);
    };

    it('renders a ListGroup component with a Treefold', () => {
      const version = getVersion({ ...fakeVersion, id: 777 });

      const root = render({ version });

      expect(root.find(ListGroup)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveProp('nodes', [
        buildFileTree(String(version.id), version.entries),
      ]);
    });

    it('can collapse a node', () => {
      const version = getVersion({ ...fakeVersion, id: 777 });

      const root = render({ version });

      const tree = root.state('tree');
      // The root node is expanded by default.
      expect(tree).toHaveProperty('expanded', true);

      root.find(Treefold).prop('onToggleExpand')(tree);

      expect(root.state('tree')).toHaveProperty('expanded', false);
    });
  });
});
