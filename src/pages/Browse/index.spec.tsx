/* eslint @typescript-eslint/camelcase: 0 */
import * as React from 'react';
import { Store } from 'redux';
import queryString from 'query-string';
import { History } from 'history';

import {
  createExternalVersionWithEntries,
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  dispatchLoadVersionInfo,
  externallyLocalizedString,
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionFileWithContent,
  shallowUntilTarget,
  spyOn,
  nextUniqueId,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  actions as versionsActions,
  createInternalVersion,
  VersionEntryType,
} from '../../reducers/versions';
import { actions as fileTreeActions } from '../../reducers/fileTree';
import Loading from '../../components/Loading';
import CodeOverview from '../../components/CodeOverview';
import CodeView from '../../components/CodeView';
import VersionFileViewer from '../../components/VersionFileViewer';
import { makeReviewersURL } from '../../utils';
import styles from './styles.module.scss';

import Browse, { BrowseBase, DefaultProps, PublicProps } from '.';

describe(__filename, () => {
  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = {
      addonId: String(nextUniqueId()),
      versionId: String(nextUniqueId()),
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

  type RenderParams = Partial<PublicProps> &
    Partial<DefaultProps> & {
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
    addonId = String(nextUniqueId()),
    history = createFakeHistory(),
    store = configureStore(),
    versionId = String(nextUniqueId()),
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
    version = { ...fakeVersionWithContent, id: nextUniqueId() },
    setCurrentVersionId = true,
    loadVersionFile = true,
  }) => {
    dispatchLoadVersionInfo({ store, version });
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

    return { version };
  };

  const setUpVersionFileUpdate = ({
    addonId = nextUniqueId(),
    extraFileEntries = {},
    initialPath = 'manifest.json',
    loadVersionAndFile = true,
    loadVersionFile = true,
    versionId = nextUniqueId(),
  } = {}) => {
    const version = {
      ...fakeVersionWithContent,
      id: versionId,
      file: {
        ...fakeVersionWithContent.file,
        selected_file: initialPath,
      },
      file_entries: {
        ...fakeVersionWithContent.file_entries,
        ...extraFileEntries,
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

  it('dispatches unsetCurrentBaseVersionId()', () => {
    const store = configureStore();
    store.dispatch(
      versionsActions.setCurrentBaseVersionId({ versionId: nextUniqueId() }),
    );
    const { version } = _loadVersionAndFile({ store });
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(version.id) });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.unsetCurrentBaseVersionId(),
    );
  });

  it('does not dispatch unsetCurrentBaseVersionId() if already unset', () => {
    const store = configureStore();
    store.dispatch(versionsActions.unsetCurrentBaseVersionId());

    const { version } = _loadVersionAndFile({ store });
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(version.id) });

    expect(dispatch).not.toHaveBeenCalledWith(
      versionsActions.unsetCurrentBaseVersionId(),
    );
  });

  it('dispatches setCurrentVersionId on mount when unset', () => {
    const store = configureStore();
    const { version } = _loadVersionAndFile({
      store,
      setCurrentVersionId: false,
    });
    const dispatch = spyOn(store, 'dispatch');

    render({ store, versionId: String(version.id) });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentVersionId({ versionId: version.id }),
    );
  });

  it('dispatches setCurrentVersionId when switching versions', () => {
    const newVersionId = 789;
    const oldVersionId = 987;
    const version = { ...fakeVersionWithContent, id: newVersionId };
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
      ...fakeVersionWithContent,
      id: 87652,
      file: {
        ...fakeVersionWithContent.file,
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
    const downloadUrl = '/some/download/url/';
    const version = {
      ...fakeVersionWithContent,
      file: {
        ...fakeVersionFileWithContent,
        download_url: downloadUrl,
        mime_category: 'image' as VersionEntryType,
        selected_file: path,
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
    const version = fakeVersionWithContent;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    // The user clicks a different file to view.
    store.dispatch(
      versionsActions.updateSelectedPath({
        selectedPath: 'some/file.js',
        versionId: version.id,
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
    const version = { ...fakeVersionWithContent, id: 98765 };
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

  it('does not dispatch fetchVersion on update when nothing has changed', () => {
    const { fakeThunk, renderAndUpdate } = setUpVersionFileUpdate();
    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
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
    const {
      fakeThunk,
      version,
      store,
      renderAndUpdate,
    } = setUpVersionFileUpdate({
      initialPath: 'scripts/content.js',
    });

    const selectedPath = 'scripts/background.js';
    store.dispatch(
      versionsActions.updateSelectedPath({
        versionId: version.id,
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

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchVersionFile when switching paths to a loaded file', () => {
    const selectedPath = 'scripts/background.js';

    const {
      fakeThunk,
      version,
      store,
      renderAndUpdate,
    } = setUpVersionFileUpdate({
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
        versionId: version.id,
        selectedPath,
      }),
    );

    const { dispatchSpy } = renderAndUpdate();

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchVersionFile when operation has been aborted', () => {
    const {
      fakeThunk,
      version,
      store,
      renderAndUpdate,
    } = setUpVersionFileUpdate({
      initialPath: 'scripts/content.js',
    });

    const selectedPath = 'scripts/background.js';
    store.dispatch(
      versionsActions.updateSelectedPath({
        versionId: version.id,
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

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchVersion on mount if a version is already loaded', () => {
    const version = fakeVersionWithContent;

    const store = configureStore();
    _loadVersionAndFile({ store, version });
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();

    render({
      _fetchVersion: fakeThunk.createThunk,
      store,
      versionId: String(version.id),
    });

    expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchVersion on mount when an API error has occured', () => {
    const versionId = 4321;
    const store = configureStore();
    store.dispatch(versionsActions.beginFetchVersion({ versionId }));
    // Simulate an API error.
    store.dispatch(versionsActions.abortFetchVersion({ versionId }));
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();

    render({
      _fetchVersion: fakeThunk.createThunk,
      store,
      versionId: String(versionId),
    });

    expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch anything on update when an API error has occured', () => {
    const version = fakeVersionWithContent;
    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    const dispatch = spyOn(store, 'dispatch');
    // An API error will lead to `version` being set to `null`.
    root.setProps({ version: null });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not pass the path contained in the URL to fetchVersion()', () => {
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
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId,
      path: undefined,
    });
  });

  it('sets a temporary page title without a version', () => {
    const root = render();

    expect(root.find('title')).toHaveText('Browse add-on version');
  });

  it('sets a page title from a version', () => {
    const name = 'AdBlockPlus';
    const versionString = '1.0-beta';
    const version = {
      ...fakeVersionWithContent,
      id: fakeVersionWithContent.id + 1,
      addon: {
        ...fakeVersionWithContent.addon,
        name: externallyLocalizedString(name),
      },
      version: versionString,
    };
    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find('title')).toHaveText(`Browse ${name}: ${versionString}`);
  });

  it('updates the selected path if it is different from the path in the URL', () => {
    const versionId = nextUniqueId();
    const newPath = 'new/path';
    const initialPath = 'initial/path';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: queryString.stringify({ path: newPath }),
      }),
    });
    const { renderAndUpdate } = setUpVersionFileUpdate({
      initialPath,
      versionId,
    });

    const { dispatchSpy } = renderAndUpdate({ history });

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.updateSelectedPath({ selectedPath: newPath, versionId }),
    );
  });

  it('updates the selected path to the initial path if the path is undefined in the URL', () => {
    const versionId = nextUniqueId();
    const initialPath = 'initial/path';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: '',
      }),
    });
    const { renderAndUpdate, store } = setUpVersionFileUpdate({
      initialPath,
      versionId,
    });
    store.dispatch(
      versionsActions.updateSelectedPath({
        selectedPath: 'another-path',
        versionId,
      }),
    );

    const { dispatchSpy } = renderAndUpdate({ history });

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.updateSelectedPath({
        selectedPath: initialPath,
        versionId,
      }),
    );
  });

  it('does not dispatch updateSelectedPath if selectedPath has been updated', () => {
    const versionId = nextUniqueId();
    const initialPath = 'initial/path';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: queryString.stringify({ path: initialPath }),
      }),
    });
    const { renderAndUpdate } = setUpVersionFileUpdate({
      initialPath,
      versionId,
    });

    const { dispatchSpy } = renderAndUpdate({ history });

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      versionsActions.updateSelectedPath({
        selectedPath: initialPath,
        versionId,
      }),
    );
  });

  it('does not dispatch updateSelectedPath if selectedPath=initialPath and the path in URL is undefined', () => {
    const versionId = nextUniqueId();
    const initialPath = 'initial/path';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: '',
      }),
    });
    const { renderAndUpdate } = setUpVersionFileUpdate({
      initialPath,
      versionId,
    });

    const { dispatchSpy } = renderAndUpdate({ history });

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      versionsActions.updateSelectedPath({
        selectedPath: initialPath,
        versionId,
      }),
    );
  });

  it('reloads the version info if verisonId in the URL and fileTree.forVersionId are different', () => {
    const addonId = nextUniqueId();
    const versionId = nextUniqueId();
    const version = {
      ...fakeVersionWithContent,
      addon: { ...fakeVersionWithContent.addon, id: addonId },
      id: versionId,
    };
    const store = configureStore();

    dispatchLoadVersionInfo({
      store,
      version,
    });
    store.dispatch(
      fileTreeActions.buildTree({
        version: createInternalVersion({ ...version, id: nextUniqueId() }),
        comparedToVersionId: null,
      }),
    );

    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const dispatchSpy = spyOn(store, 'dispatch');

    render({
      _fetchVersion,
      store,
      addonId: String(addonId),
      versionId: String(versionId),
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        addonId,
        versionId,
      }),
    );
  });

  it('reloads the version info if fileTree.comparedToVersionId is not null', () => {
    const addonId = nextUniqueId();
    const versionId = nextUniqueId();
    const version = {
      ...fakeVersionWithContent,
      addon: { ...fakeVersionWithContent.addon, id: addonId },
      id: versionId,
    };
    const store = configureStore();

    dispatchLoadVersionInfo({
      store,
      version,
    });
    store.dispatch(
      fileTreeActions.buildTree({
        version: createInternalVersion(version),
        comparedToVersionId: nextUniqueId(),
      }),
    );

    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const dispatchSpy = spyOn(store, 'dispatch');

    render({
      _fetchVersion,
      store,
      addonId: String(addonId),
      versionId: String(versionId),
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        addonId,
        versionId,
      }),
    );
  });

  it('does not throw an error when the selected path does not exist in version.entries', () => {
    const version = createExternalVersionWithEntries([{ path: 'path1' }], {
      selected_file: 'a non-existant file',
    });
    const store = configureStore();

    dispatchLoadVersionInfo({ store, version });
    store.dispatch(
      fileTreeActions.buildTree({
        version: createInternalVersion(version),
        comparedToVersionId: null,
      }),
    );

    expect(() =>
      render({
        store,
        versionId: String(version.id),
      }),
    ).not.toThrow();
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
            comparedToVersionId: null,
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
      const {
        _fetchVersionFile,
        fakeThunk,
        dispatchSpy,
      } = setUpFilesAndRender({ addonId, nextPath, versionId });

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
      const {
        _fetchVersionFile,
        dispatchSpy,
        fakeThunk,
      } = setUpFilesAndRender({ beginFetchNextFile: true });

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
