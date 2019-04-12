import * as React from 'react';
import { Store } from 'redux';

import {
  createFakeHistory,
  createFakeThunk,
  fakeVersion,
  fakeVersionEntry,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  actions as versionActions,
  getVersionFile,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import FileMetadata from '../../components/FileMetadata';

import Browse, { BrowseBase, Props as BrowseProps } from '.';

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
    _fetchVersion?: BrowseProps['_fetchVersion'];
    _fetchVersionFile?: BrowseProps['_fetchVersionFile'];
    _log?: BrowseProps['_log'];
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

  const setUpVersionFileUpdate = ({
    extraFileEntries = {},
    initialPath = 'manifest.json',
    loadVersionAndFile = true,
  } = {}) => {
    const addonId = 9876;
    const version = {
      ...fakeVersion,
      id: 1234,
      file: {
        ...fakeVersion.file,
        entries: {
          ...fakeVersion.file.entries,
          ...extraFileEntries,
        },
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file: initialPath,
      },
    };
    const store = configureStore();

    if (loadVersionAndFile) {
      _loadVersionAndFile({ store, version });
    }

    const fakeThunk = createFakeThunk();
    const _fetchVersionFile = fakeThunk.createThunk;

    return {
      _fetchVersionFile,
      addonId,
      fakeThunk,
      store,
      renderAndUpdate: (props = {}) => {
        const dispatchSpy = spyOn(store, 'dispatch');
        const root = render({
          _fetchVersionFile,
          store,
          addonId: String(addonId),
          versionId: String(version.id),
        });

        dispatchSpy.mockClear();
        root.setProps(props);

        return { dispatchSpy };
      },
      version,
    };
  };

  it('renders a page with a loading message', () => {
    const versionId = '123456';

    const root = render({ versionId });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading version...');
  });

  it('dispatches fetchVersion on mount', () => {
    const addonId = 9876;
    const versionId = 4321;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;

    render({
      _fetchVersion,
      store,
      addonId: String(addonId),
      versionId: String(versionId),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({ addonId, versionId });
  });

  it('renders a FileTree component when a version has been loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp('versionId', version.id);
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

  it('dispatches updateSelectedPath() when a file is selected', () => {
    const addonId = 123456;
    const version = { ...fakeVersion, id: 98765 };
    const path = 'some-path';

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    const fileTree = root.find(FileTree);
    expect(fileTree).toHaveProp('onSelect');

    const onSelectFile = fileTree.prop('onSelect');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(
      versionActions.updateSelectedPath({
        versionId: version.id,
        selectedPath: path,
      }),
    );
  });

  it('does not dispatch fetchVersionFile on update before a version has loaded', () => {
    const { renderAndUpdate } = setUpVersionFileUpdate({
      loadVersionAndFile: false,
    });

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchVersionFile on update when nothing has changed', () => {
    const { renderAndUpdate } = setUpVersionFileUpdate();
    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('dispatches fetchVersionFile when path is updated', () => {
    const initialPath = 'scripts/content.js';
    const {
      _fetchVersionFile,
      addonId,
      fakeThunk,
      version,
      store,
      renderAndUpdate,
    } = setUpVersionFileUpdate({ initialPath });

    const selectedPath = 'scripts/background.js';
    store.dispatch(
      versionActions.updateSelectedPath({
        versionId: version.id,
        selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionFile).toHaveBeenCalledWith({
      addonId,
      versionId: version.id,
      path: selectedPath,
    });
  });

  it('does not dispatch fetchVersionFile on update if a file is loading', () => {
    const { version, store, renderAndUpdate } = setUpVersionFileUpdate({
      initialPath: 'scripts/content.js',
    });

    const selectedPath = 'scripts/background.js';
    store.dispatch(
      versionActions.updateSelectedPath({
        versionId: version.id,
        selectedPath,
      }),
    );
    store.dispatch(
      versionActions.beginFetchVersionFile({
        versionId: version.id,
        path: selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchVersionFile when switching paths to a loaded file', () => {
    const selectedPath = 'scripts/background.js';

    const { version, store, renderAndUpdate } = setUpVersionFileUpdate({
      extraFileEntries: {
        [selectedPath]: { ...fakeVersionEntry, path: selectedPath },
      },
      initialPath: 'scripts/content.js',
    });

    // Setup a file that was previously loaded.
    store.dispatch(
      versionActions.loadVersionFile({
        path: selectedPath,
        version,
      }),
    );
    // Switch back to this file.
    store.dispatch(
      versionActions.updateSelectedPath({
        versionId: version.id,
        selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchVersionFile when operation has been aborted', () => {
    const { version, store, renderAndUpdate } = setUpVersionFileUpdate({
      initialPath: 'scripts/content.js',
    });

    const selectedPath = 'scripts/background.js';
    store.dispatch(
      versionActions.updateSelectedPath({
        versionId: version.id,
        selectedPath,
      }),
    );
    // Simulate an API error.
    store.dispatch(
      versionActions.abortFetchVersionFile({
        versionId: version.id,
        path: selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
