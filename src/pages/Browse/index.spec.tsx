import * as React from 'react';
import { Store } from 'redux';
import queryString from 'query-string';
import { History } from 'history';

import {
  createFakeEntry,
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  externallyLocalizedString,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  actions as versionsActions,
  createInternalVersion,
} from '../../reducers/versions';
import { actions as fileTreeActions } from '../../reducers/fileTree';
import Loading from '../../components/Loading';
import CodeOverview from '../../components/CodeOverview';
import CodeView from '../../components/CodeView';
import VersionFileViewer from '../../components/VersionFileViewer';
import { makeReviewersURL } from '../../utils';
import styles from './styles.module.scss';

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
    _viewVersionFile?: BrowseProps['_viewVersionFile'];
    addonId?: string;
    history?: History;
    store?: Store;
    versionId?: string;
  };

  const render = ({
    _fetchVersion,
    _fetchVersionFile,
    _log,
    _viewVersionFile,
    addonId = '999',
    history = createFakeHistory(),
    store = configureStore(),
    versionId = '123',
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({
        history,
        params: { addonId, versionId },
      }),
      _fetchVersion,
      _fetchVersionFile,
      _log,
      _viewVersionFile,
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
    setCurrentVersionId = true,
    loadVersionFile = true,
  }) => {
    store.dispatch(versionsActions.loadVersionInfo({ version }));
    if (loadVersionFile) {
      store.dispatch(
        versionsActions.loadVersionFile({
          path: version.file.selected_file,
          version,
        }),
      );
    }
    if (setCurrentVersionId) {
      store.dispatch(
        versionsActions.setCurrentVersionId({ versionId: version.id }),
      );
    }
  };

  const setUpVersionFileUpdate = ({
    addonId = 9876,
    extraFileEntries = {},
    initialPath = 'manifest.json',
    loadVersionAndFile = true,
    loadVersionFile = true,
    versionId = 1234,
  } = {}) => {
    const version = {
      ...fakeVersion,
      id: versionId,
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
      _loadVersionAndFile({ loadVersionFile, store, version });
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

  it('dispatches setCurrentVersionId on mount if the currentVersionId is unset', () => {
    const version = fakeVersion;
    const store = configureStore();
    _loadVersionAndFile({ store, version, setCurrentVersionId: false });
    const dispatch = spyOn(store, 'dispatch');

    render({ store });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentVersionId({ versionId: version.id }),
    );
  });

  it('dispatches setCurrentVersionId when switching versions', () => {
    const newVersionId = 789;
    const oldVersionId = 987;
    const version = { ...fakeVersion, id: newVersionId };
    const store = configureStore();
    store.dispatch(
      versionsActions.setCurrentVersionId({ versionId: oldVersionId }),
    );
    _loadVersionAndFile({ store, version, setCurrentVersionId: false });
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(newVersionId) });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentVersionId({ versionId: newVersionId }),
    );
  });

  it('renders a VersionFileViewer', () => {
    const version = {
      ...fakeVersion,
      id: 87652,
      file: {
        ...fakeVersion.file,
        id: 991234,
      },
    };

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveLength(1);
    expect(viewer).toHaveProp('version', createInternalVersion(version));
    expect(viewer).toHaveProp(
      'file',
      expect.objectContaining({
        id: version.file.id,
      }),
    );
  });

  it('renders an image file', () => {
    const path = 'image.png';
    const entry = createFakeEntry('image', path);
    const downloadUrl = '/some/download/url/';
    const version = {
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: { [path]: entry },
        /* eslint-disable @typescript-eslint/camelcase */
        download_url: downloadUrl,
        selected_file: path,
        /* eslint-enable @typescript-eslint/camelcase */
      },
    };

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    const image = root.find(`.${styles.Image}`).find('img');
    expect(image).toHaveLength(1);
    expect(image).toHaveProp('src', makeReviewersURL({ url: downloadUrl }));
  });

  it('renders a loading message when we do not have the content of a file yet', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    // The user clicks a different file to view.
    store.dispatch(
      versionsActions.updateSelectedPath({
        selectedPath: 'some/file.js',
      }),
    );

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(CodeView)).toHaveLength(0);
    expect(root.find(CodeOverview)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading content...');
  });

  it('dispatches viewVersionFile without preserving the URL hash when a file is selected', () => {
    const addonId = 123456;
    const version = { ...fakeVersion, id: 98765 };
    const path = 'some-path';

    const store = configureStore();
    _loadVersionAndFile({ store, version });
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _viewVersionFile = fakeThunk.createThunk;

    const root = render({
      _viewVersionFile,
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveProp('onSelectFile');

    const onSelectFile = viewer.prop('onSelectFile');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_viewVersionFile).toHaveBeenCalledWith({
      selectedPath: path,
      versionId: version.id,
      preserveHash: false,
    });
  });

  it('only dispatches fetchVersion on update when no version has loaded yet', () => {
    const { renderAndUpdate } = setUpVersionFileUpdate({
      loadVersionAndFile: false,
    });
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;

    const { dispatchSpy } = renderAndUpdate({ _fetchVersion });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch anything on update when nothing has changed', () => {
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
      versionsActions.updateSelectedPath({
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
      versionsActions.updateSelectedPath({
        selectedPath,
      }),
    );
    store.dispatch(
      versionsActions.beginFetchVersionFile({
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
      versionsActions.loadVersionFile({
        path: selectedPath,
        version,
      }),
    );
    // Switch back to this file.
    store.dispatch(
      versionsActions.updateSelectedPath({
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
      versionsActions.updateSelectedPath({
        selectedPath,
      }),
    );
    store.dispatch(
      versionsActions.beginFetchVersionFile({
        versionId: version.id,
        path: selectedPath,
      }),
    );
    // Simulate an API error.
    store.dispatch(
      versionsActions.abortFetchVersionFile({
        versionId: version.id,
        path: selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch anything on mount if a version is already loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(version.id) });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch anything on mount when an API error has occured', () => {
    const versionId = 4321;
    const store = configureStore();
    store.dispatch(versionsActions.beginFetchVersion({ versionId }));
    // Simulate an API error.
    store.dispatch(versionsActions.abortFetchVersion({ versionId }));
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(versionId) });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch anything on update when an API error has occured', () => {
    const version = fakeVersion;
    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    const dispatch = spyOn(store, 'dispatch');
    // An API error will lead to `version` being set to `null`.
    root.setProps({ version: null });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('passes the path contained in the URL to fetchVersion()', () => {
    const addonId = 9876;
    const versionId = 4321;
    const path = 'background.js';
    const history = createFakeHistory({
      location: createFakeLocation({ search: queryString.stringify({ path }) }),
    });

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;

    render({
      _fetchVersion,
      addonId: String(addonId),
      history,
      store,
      versionId: String(versionId),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({ addonId, versionId, path });
  });

  it('sets a temporary page title without a version', () => {
    const root = render();

    expect(root.find('title')).toHaveText('Browse add-on version');
  });

  it('sets a page title from a version', () => {
    const name = 'AdBlockPlus';
    const versionString = '1.0-beta';
    const version = {
      ...fakeVersion,
      id: fakeVersion.id + 1,
      addon: {
        ...fakeVersion.addon,
        name: externallyLocalizedString(name),
      },
      version: versionString,
    };
    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find('title')).toHaveText(`Browse ${name}: ${versionString}`);
  });

  describe('preloading', () => {
    const setUpFilesAndRender = ({
      addonId = 987,
      beginFetchNextFile = false,
      buildTree = true,
      currentPath = 'currentPath.js',
      loadNextFile = false,
      loadVersionFile = true,
      nextPath = 'nextPath.js',
      versionId = 777,
    } = {}) => {
      const extraFileEntries = {
        [currentPath]: { ...fakeVersionEntry, path: currentPath },
        [nextPath]: { ...fakeVersionEntry, path: nextPath },
      };
      const {
        _fetchVersionFile,
        fakeThunk,
        store,
        version,
      } = setUpVersionFileUpdate({
        addonId,
        extraFileEntries,
        initialPath: currentPath,
        loadVersionFile,
        versionId,
      });
      if (buildTree) {
        store.dispatch(
          fileTreeActions.buildTree({
            version: createInternalVersion(version),
          }),
        );
      }
      if (beginFetchNextFile) {
        store.dispatch(
          versionsActions.beginFetchVersionFile({
            path: nextPath,
            versionId,
          }),
        );
      }
      if (loadNextFile) {
        store.dispatch(
          versionsActions.loadVersionFile({ path: nextPath, version }),
        );
      }
      const dispatchSpy = spyOn(store, 'dispatch');

      render({
        _fetchVersionFile,
        addonId: String(addonId),
        store,
        versionId: String(versionId),
      });

      return {
        _fetchVersionFile,
        addonId,
        dispatchSpy,
        fakeThunk,
        store,
        version,
      };
    };

    it('dispatches fetchVersionFile for the next file', () => {
      const addonId = 5;
      const nextPath = 'next.js';
      const versionId = 1;
      const { _fetchVersionFile, fakeThunk, dispatchSpy } = setUpFilesAndRender(
        { addonId, nextPath, versionId },
      );

      expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionFile).toHaveBeenCalledWith({
        addonId,
        path: nextPath,
        versionId,
      });
    });

    it('does not dispatch fetchVersionFile for the next file if the current version file is not loaded', () => {
      const currentPath = 'current.js';
      const nextPath = 'next.js';
      const { _fetchVersionFile } = setUpFilesAndRender({
        currentPath,
        loadVersionFile: false,
        nextPath,
      });

      expect(_fetchVersionFile).not.toHaveBeenCalledWith(
        expect.objectContaining({ path: nextPath }),
      );
    });

    it('does not dispatch fetchVersionFile when fileTree is not built', () => {
      const { _fetchVersionFile, dispatchSpy, fakeThunk } = setUpFilesAndRender(
        {
          buildTree: false,
        },
      );

      expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionFile).not.toHaveBeenCalled();
    });

    it('does not dispatch fetchVersionFile when the next file is loading', () => {
      const { _fetchVersionFile, dispatchSpy, fakeThunk } = setUpFilesAndRender(
        { beginFetchNextFile: true },
      );

      expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionFile).not.toHaveBeenCalled();
    });

    it('does not dispatch fetchVersionFile when the next file is already loaded', () => {
      const { _fetchVersionFile, dispatchSpy, fakeThunk } = setUpFilesAndRender(
        {
          loadNextFile: true,
        },
      );

      expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionFile).not.toHaveBeenCalled();
    });
  });
});
