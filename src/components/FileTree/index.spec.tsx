/* eslint @typescript-eslint/camelcase: 0 */
import { shallow } from 'enzyme';
import * as React from 'react';
import { ListGroup } from 'react-bootstrap';
import Treefold from 'react-treefold';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import {
  actions as fileTreeActions,
  buildFileTree,
} from '../../reducers/fileTree';
import {
  Version,
  actions as versionActions,
  getVersionInfo,
} from '../../reducers/versions';
import {
  createFakeLogger,
  fakeVersion,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import { getTreefoldRenderProps } from '../FileTreeNode/index.spec';
import FileTreeNode from '../FileTreeNode';
import KeyboardShortcuts from '../KeyboardShortcuts';
import Loading from '../Loading';

import FileTree, { DefaultProps, FileTreeBase, PublicProps } from '.';

describe(__filename, () => {
  describe('FileTree', () => {
    const getVersion = ({
      store = configureStore(),
      version = fakeVersion,
    }): Version => {
      store.dispatch(versionActions.loadVersionInfo({ version }));

      return getVersionInfo(store.getState().versions, version.id) as Version;
    };

    type RenderParams = {
      store?: Store;
      versionId?: number;
    } & Partial<PublicProps & DefaultProps>;

    const render = ({
      store = configureStore(),
      versionId = 1234,
      ...moreProps
    }: RenderParams = {}) => {
      const props = {
        _log: createFakeLogger(),
        onSelect: jest.fn(),
        versionId,
        ...moreProps,
      };

      return shallowUntilTarget(<FileTree {...props} />, FileTreeBase, {
        shallowOptions: { context: { store } },
      });
    };

    const _buildTree = (store: Store, version: Version) => {
      store.dispatch(fileTreeActions.buildTree({ version }));
    };

    it('calls loadData on construction', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const _loadData = jest.fn();

      render({ _loadData, store, versionId: version.id });

      expect(_loadData).toHaveBeenCalled();
    });

    it('calls loadData on update', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const _loadData = jest.fn();

      const root = render({ _loadData, store, versionId: version.id });

      // Simulate an update.
      root.setProps({ versionId: version.id + 1 });

      expect(_loadData).toHaveBeenCalledWith();
    });

    it('does not dispatch buildTree when version is undefined', () => {
      const store = configureStore();

      const dispatch = spyOn(store, 'dispatch');

      render({ store });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches buildTree when tree is undefined', () => {
      const store = configureStore();
      const version = getVersion({ store });

      const dispatch = spyOn(store, 'dispatch');

      render({ store, versionId: version.id });

      expect(dispatch).toHaveBeenCalledWith(
        fileTreeActions.buildTree({
          version,
        }),
      );
    });

    it('does not dispatch buildTree when tree is defined', () => {
      const store = configureStore();
      const version = getVersion({ store });
      _buildTree(store, version);

      const dispatch = spyOn(store, 'dispatch');

      render({ store, versionId: version.id });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('renders a ListGroup component with a Treefold', () => {
      const store = configureStore();
      const version = getVersion({ store });
      _buildTree(store, version);

      const root = render({ store, versionId: version.id });

      expect(root.find(ListGroup)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveProp('nodes', [
        buildFileTree(version).nodes,
      ]);
    });

    it('renders a KeyboardShortcuts component', () => {
      const store = configureStore();
      const version = getVersion({ store });
      _buildTree(store, version);

      const root = render({ store, versionId: version.id });

      const keyboardShortcuts = root.find(KeyboardShortcuts);

      expect(keyboardShortcuts).toHaveLength(1);
      expect(keyboardShortcuts).toHaveProp('currentPath', version.selectedPath);
      expect(keyboardShortcuts).toHaveProp(
        'pathList',
        buildFileTree(version).pathList,
      );
      expect(keyboardShortcuts).toHaveProp('versionId', version.id);
    });

    it('does not render a KeyboardShortcuts component without a tree', () => {
      const store = configureStore();
      const version = getVersion({ store });

      const root = render({ store, versionId: version.id });

      expect(root.find(KeyboardShortcuts)).toHaveLength(0);
    });

    it('passes the onSelect prop to FileTreeNode', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const onSelect = jest.fn();

      const root = render({ onSelect, store, versionId: version.id });

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

      const root = render({ store, versionId: version.id });

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

      _buildTree(store, version);

      const dispatch = spyOn(store, 'dispatch');

      const root = render({ store, versionId: version.id });

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

      _buildTree(store, version);

      store.dispatch(
        versionActions.toggleExpandedPath({
          path: node.id,
          versionId: version.id,
        }),
      );

      version = getVersionInfo(
        store.getState().versions,
        version.id,
      ) as Version;

      const root = render({ store, versionId: version.id });

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

      _buildTree(store, version);

      const root = render({ store, versionId: version.id });

      const treeFold = root.find(Treefold);
      expect(treeFold).toHaveProp('isNodeExpanded');

      const isNodeExpanded = treeFold.prop('isNodeExpanded');
      expect(isNodeExpanded(node)).toBeFalsy();
    });

    it('renders a Loading component when no version is loaded', () => {
      const root = render();

      expect(root.find(Loading)).toHaveLength(1);
    });

    it('returns a Loading component from renderNode when no version is loaded', () => {
      const root = render();

      const node = (root.instance() as FileTreeBase).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(Loading)).toHaveLength(1);
    });

    it('throws an error when isNodeExpanded is called without a version', () => {
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      const root = render();

      const { isNodeExpanded } = root.instance() as FileTreeBase;

      expect(() => {
        isNodeExpanded(node);
      }).toThrow('Cannot check if node is expanded without a version');
    });

    it('throws an error when onToggleExpand is called without a version', () => {
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      const root = render();

      const { onToggleExpand } = root.instance() as FileTreeBase;

      expect(() => {
        onToggleExpand(node);
      }).toThrow('Cannot toggle expanded path without a version');
    });

    it('dispatches expandTree when the Expand All button is clicked', () => {
      const store = configureStore();
      const version = getVersion({ store });

      _buildTree(store, version);

      const dispatch = spyOn(store, 'dispatch');

      const root = render({ store, versionId: version.id });

      root.find('#openAll').simulate('click');

      expect(dispatch).toHaveBeenCalledWith(
        versionActions.expandTree({
          versionId: version.id,
        }),
      );
    });

    it('dispatches collapseTree when the Collapse All button is clicked', () => {
      const store = configureStore();
      const version = getVersion({ store });

      _buildTree(store, version);

      const dispatch = spyOn(store, 'dispatch');

      const root = render({ store, versionId: version.id });

      root.find('#closeAll').simulate('click');

      expect(dispatch).toHaveBeenCalledWith(
        versionActions.collapseTree({
          versionId: version.id,
        }),
      );
    });
  });
});
