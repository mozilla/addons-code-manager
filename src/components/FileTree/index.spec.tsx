/* eslint @typescript-eslint/camelcase: 0 */
import { shallow } from 'enzyme';
import * as React from 'react';
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
  dispatchLoadVersionInfo,
  fakeVersionWithContent,
  getInstance,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import { getTreefoldRenderProps } from '../FileTreeNode/index.spec';
import FileTreeNode from '../FileTreeNode';
import Loading from '../Loading';

import FileTree, { DefaultProps, FileTreeBase, PublicProps } from '.';

describe(__filename, () => {
  describe('FileTree', () => {
    const getVersion = ({
      store = configureStore(),
      version = fakeVersionWithContent,
    }): Version => {
      dispatchLoadVersionInfo({ store, version });

      return getVersionInfo(store.getState().versions, version.id) as Version;
    };

    type RenderParams = {
      comparedToVersionId?: number | null;
      store?: Store;
      versionId?: number;
    } & Partial<PublicProps & DefaultProps>;

    const render = ({
      comparedToVersionId = null,
      store = configureStore(),
      versionId = 1234,
      ...moreProps
    }: RenderParams = {}) => {
      const props = {
        _log: createFakeLogger(),
        comparedToVersionId,
        onSelect: jest.fn(),
        versionId,
        ...moreProps,
      };

      return shallowUntilTarget(<FileTree {...props} />, FileTreeBase, {
        shallowOptions: { context: { store } },
      });
    };

    const _buildTree = (store: Store, version: Version) => {
      store.dispatch(
        fileTreeActions.buildTree({ comparedToVersionId: null, version }),
      );
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
      const comparedToVersionId = null;

      const dispatch = spyOn(store, 'dispatch');

      render({ comparedToVersionId, store, versionId: version.id });

      expect(dispatch).toHaveBeenCalledWith(
        fileTreeActions.buildTree({
          comparedToVersionId,
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

    it('renders a Treefold component', () => {
      const store = configureStore();
      const version = getVersion({ store });
      _buildTree(store, version);

      const root = render({ store, versionId: version.id });

      expect(root.find(Treefold)).toHaveLength(1);
      expect(root.find(Treefold)).toHaveProp(
        'nodes',
        buildFileTree(version).nodes.children,
      );
    });

    it('passes the onSelect prop to FileTreeNode', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const onSelect = jest.fn();

      const root = render({ onSelect, store, versionId: version.id });

      const node = getInstance<FileTreeBase>(root).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(FileTreeNode)).toHaveProp(
        'onSelect',
        onSelect,
      );
    });

    it('configures FileTreeNode', () => {
      const store = configureStore();
      const version = getVersion({ store });
      const comparedToVersionId = 4;

      const root = render({
        store,
        versionId: version.id,
        comparedToVersionId,
      });

      const node = getInstance<FileTreeBase>(root).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(FileTreeNode)).toHaveProp({
        versionId: version.id,
        comparedToVersionId,
      });
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

      const onToggleExpand = treeFold.prop('onToggleExpand') as Function;
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

      const isNodeExpanded = treeFold.prop('isNodeExpanded') as Function;
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

      const isNodeExpanded = treeFold.prop('isNodeExpanded') as Function;
      expect(isNodeExpanded(node)).toBeFalsy();
    });

    it('renders a Loading component when no version is loaded', () => {
      const root = render();

      expect(root.find(Loading)).toHaveLength(1);
    });

    it('returns a Loading component from renderNode when no version is loaded', () => {
      const root = render();

      const node = getInstance<FileTreeBase>(root).renderNode(
        getTreefoldRenderProps(),
      );

      expect(shallow(<div>{node}</div>).find(Loading)).toHaveLength(1);
    });

    it('throws an error when isNodeExpanded is called without expandedPaths set', () => {
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      const root = render();

      const { isNodeExpanded } = getInstance<FileTreeBase>(root);

      expect(() => {
        isNodeExpanded(node);
      }).toThrow('Cannot check if node is expanded without expandedPaths set');
    });

    it('throws an error when onToggleExpand is called without a version', () => {
      const node = {
        id: 'some/path',
        name: 'some name',
        children: [],
      };
      const root = render();

      const { onToggleExpand } = getInstance<FileTreeBase>(root);

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
