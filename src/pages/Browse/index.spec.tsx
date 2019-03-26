import * as React from 'react';
import { Store } from 'redux';

import {
  createFakeHistory,
  createFakeThunk,
  fakeVersion,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  actions as versionActions,
  createInternalVersion,
  getVersionFile,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import FileMetadata from '../../components/FileMetadata';

import Browse, { BrowseBase, PublicProps } from '.';

describe(__filename, () => {
  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = {
      addonId: '999',
      versionId: '123',
    },
  } = {}) => {
    return {
      history,
      location: history.location,
      match: {
        params,
        isExact: true,
        path: '/some-path',
        url: '/some-url',
      },
    };
  };

  type RenderParams = {
    _fetchVersion?: PublicProps['_fetchVersion'];
    _fetchVersionFile?: PublicProps['_fetchVersionFile'];
    _log?: PublicProps['_log'];
    addonId?: string;
    versionId?: string;
    store?: Store;
  };

  const render = ({
    _fetchVersion,
    _fetchVersionFile,
    _log,
    addonId = '999',
    versionId = '123',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { addonId, versionId } }),
      _fetchVersion,
      _fetchVersionFile,
      _log,
    };

    return shallowUntilTarget(<Browse {...props} />, BrowseBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  const _loadVersionAndFile = ({
    store = configureStore(),
    version = fakeVersion,
  }) => {
    store.dispatch(versionActions.loadVersionInfo({ version }));
    store.dispatch(
      versionActions.loadVersionFile({
        path: version.file.selected_file,
        version,
      }),
    );
  };

  it('renders a page with a loading message', () => {
    const versionId = '123456';

    const root = render({ versionId });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading version...');
  });

  it('renders a FileTree component when a version has been loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp(
      'version',
      createInternalVersion(version),
    );
  });

  it('renders a FileMetadata component when a version file has loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileMetadata)).toHaveLength(1);
    expect(root.find(FileMetadata)).toHaveProp(
      'file',
      getVersionFile(
        store.getState().versions,
        version.id,
        version.file.selected_file,
      ),
    );
  });

  it('renders the content of the default file when a version has been loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(CodeView)).toHaveLength(1);
  });

  it('renders a loading message when we do not have the content of a file yet', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    // The user clicks a different file to view.
    store.dispatch(
      versionActions.updateSelectedPath({
        selectedPath: 'some/file.js',
        versionId: version.id,
      }),
    );

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(CodeView)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading content...');
  });

  it('dispatches fetchVersionFile() when a file is selected', () => {
    const addonId = 123456;
    const version = fakeVersion;
    const path = 'some-path';

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionFile = fakeThunk.createThunk;

    const root = render({
      _fetchVersionFile,
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    const fileTree = root.find(FileTree);
    expect(fileTree).toHaveProp('onSelect');

    const onSelectFile = fileTree.prop('onSelect');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionFile).toHaveBeenCalledWith({
      addonId,
      versionId: version.id,
      path,
    });
  });
});
