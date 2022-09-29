import * as React from 'react';
import { Store } from 'redux';
import { History, Location } from 'history';
import queryString from 'query-string';

import {
  createExternalVersionWithEntries,
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  createStoreWithVersion,
  dispatchLoadVersionInfo,
  externallyLocalizedString,
  fakeVersionAddon,
  fakeVersionWithContent,
  fakeVersionWithDiff,
  shallowUntilTarget,
  spyOn,
  nextUniqueId,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import { actions as fileTreeActions } from '../../reducers/fileTree';
import {
  ExternalVersionWithDiff,
  VersionEntryStatus,
  actions as versionsActions,
  createEntryStatusMap,
  createInternalDiff,
  createInternalVersion,
  createInternalVersionFile,
  getVersionDiff,
  MISSING_ADDON_NAME_TEXT,
} from '../../reducers/versions';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionFileViewer from '../../components/VersionFileViewer';
import { createCodeLineAnchorGetter } from '../../utils';

import Compare, { CompareBase, PublicProps, mapStateToProps } from '.';

describe(__filename, () => {
  type GetRouteParamsParams = {
    addonId?: number;
    baseVersionId?: number;
    headVersionId?: number;
    lang?: string;
  };

  const getRouteParams = ({
    addonId = 9999,
    baseVersionId = 1,
    headVersionId = 1000,
    lang = 'fr',
  }: GetRouteParamsParams = {}) => {
    return {
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      lang,
    };
  };

  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = getRouteParams(),
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
    _fetchVersionWithDiff?: PublicProps['_fetchVersionWithDiff'];
    _fetchDiffFile?: PublicProps['_fetchDiffFile'];
    _viewVersionFile?: PublicProps['_viewVersionFile'];
    addonId?: string;
    baseVersionId?: string;
    headVersionId?: string;
    history?: History;
    lang?: string;
    store?: Store;
  };

  const render = ({
    _fetchVersionWithDiff,
    _fetchDiffFile,
    _viewVersionFile,
    addonId = '999',
    baseVersionId = '1',
    headVersionId = '2',
    history = createFakeHistory(),
    lang = 'fr',
    shouldMockDispatch = false,
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({
        history,
        params: { lang, addonId, baseVersionId, headVersionId },
      }),
      _fetchVersionWithDiff,
      _fetchDiffFile,
      _viewVersionFile,
    };

    // Sometimes we need to mock `dispatch` to prevent it from dispatching
    // actions which would result in an unhandled promise rejection.
    if (shouldMockDispatch) {
      spyOn(store, 'dispatch');
    }

    return shallowUntilTarget(<Compare {...props} />, CompareBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  const _loadDiff = ({
    addonId = nextUniqueId(),
    baseVersionId = nextUniqueId(),
    headVersionId = baseVersionId + 1,
    store = configureStore(),
    version = {
      ...fakeVersionWithDiff,
      addon: { ...fakeVersionAddon, id: addonId },
      id: headVersionId,
    },
    setCurrentVersionId = true,
    loadDiff = true,
    loadEntryStatusMap = true,
  }: {
    addonId?: number;
    baseVersionId?: number;
    headVersionId?: number;
    loadDiff?: boolean;
    loadEntryStatusMap?: boolean;
    setCurrentVersionId?: boolean;
    store?: Store;
    version?: typeof fakeVersionWithDiff;
  }) => {
    dispatchLoadVersionInfo({
      store,
      version,
    });
    if (loadEntryStatusMap) {
      store.dispatch(
        versionsActions.loadEntryStatusMap({
          version,
          comparedToVersionId: baseVersionId,
        }),
      );
    }
    if (loadDiff) {
      store.dispatch(
        versionsActions.loadDiffFileFromVersion({
          baseVersionId,
          headVersionId,
          path: version.file.selected_file,
          version,
        }),
      );
    }
    if (setCurrentVersionId) {
      store.dispatch(
        versionsActions.setCurrentVersionId({ versionId: headVersionId }),
      );
    }

    return {
      addonId,
      baseVersionId,
      headVersionId,
      store,
      version,
    };
  };

  const loadDiffAndRender = ({
    history = createFakeHistory(),
    selected_file = fakeVersionWithDiff.file.selected_file,
    store = configureStore(),
    addonId = nextUniqueId(),
    baseVersionId = nextUniqueId(),
    buildTree = false,
    headVersionId = baseVersionId + 1,
    lastSelectedPath,
    loadDiff = true,
    version = {
      ...fakeVersionWithDiff,
      addon: { ...fakeVersionAddon, id: addonId },
      file: {
        ...fakeVersionWithDiff.file,
        selected_file,
      },
      id: headVersionId,
    },
  }: {
    history?: History;
    store?: Store;
    addonId?: number;
    baseVersionId?: number;
    buildTree?: boolean;
    headVersionId?: number;
    lastSelectedPath?: string;
    loadDiff?: boolean;
    selected_file?: string;
    version?: ExternalVersionWithDiff;
  } = {}) => {
    const fakeThunk = createFakeThunk();
    const _fetchVersionWithDiff = createFakeThunk().createThunk;
    const _fetchDiffFile = createFakeThunk().createThunk;
    const _viewVersionFile = createFakeThunk().createThunk;

    _loadDiff({
      addonId,
      baseVersionId,
      headVersionId,
      loadDiff,
      store,
      version,
    });

    if (buildTree) {
      store.dispatch(
        fileTreeActions.buildTree({
          comparedToVersionId: baseVersionId,
          version: createInternalVersion(version),
        }),
      );
    }

    if (lastSelectedPath) {
      store.dispatch(
        versionsActions.updateSelectedPath({
          selectedPath: lastSelectedPath,
          versionId: version.id,
        }),
      );
    }

    const dispatchSpy = spyOn(store, 'dispatch');

    const root = render({
      _fetchVersionWithDiff,
      _fetchDiffFile,
      _viewVersionFile,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      history,
      store,
    });

    return {
      _fetchVersionWithDiff,
      _fetchDiffFile,
      _viewVersionFile,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      params: getRouteParams({ addonId, baseVersionId, headVersionId }),
      path: version.file.selected_file,
      root,
      store,
      version,
    };
  };

  it('renders a loading message when no diff has been loaded', () => {
    const version = fakeVersionWithDiff;
    const store = createStoreWithVersion({ version });

    const root = render({
      headVersionId: String(version.id),
      shouldMockDispatch: true,
      store,
    });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading diff...');
  });

  it('renders a VersionFileViewer', () => {
    const {
      addonId,
      baseVersionId,
      headVersionId,
      path,
      root,
      store,
      version,
    } = loadDiffAndRender();

    const versionDiff = getVersionDiff({
      addonId,
      baseVersionId,
      headVersionId,
      path,
      versions: store.getState().versions,
    });

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveLength(1);
    expect(viewer).toHaveProp('file', versionDiff);
    expect(viewer).toHaveProp('comparedToVersionId', baseVersionId);
    expect(viewer).toHaveProp('version', createInternalVersion(version));
  });

  it('renders a DiffView', () => {
    const addonId = nextUniqueId();
    const baseVersionId = 1;
    const path = 'manifest.json';
    const mimeType = 'mime/type';

    const version = {
      ...fakeVersionWithDiff,
      addon: {
        ...fakeVersionAddon,
        id: addonId,
      },
      id: baseVersionId + 1,
      file: {
        ...fakeVersionWithDiff.file,
        mimetype: mimeType,
        selected_file: path,
      },
    };

    const store = configureStore();
    _loadDiff({
      addonId,
      baseVersionId,
      headVersionId: version.id,
      store,
      version,
    });

    const root = render({
      store,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(version.id),
    });

    const diffView = root.find(DiffView);
    expect(diffView).toHaveLength(1);
    expect(diffView).toHaveProp('diff', createInternalDiff(version.file.diff));
    expect(diffView).toHaveProp('mimeType', mimeType);
    expect(diffView).toHaveProp('version', createInternalVersion(version));
  });

  it('renders an error when fetching a diff has failed', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();

    store.dispatch(
      versionsActions.beginFetchVersionWithDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );
    store.dispatch(
      versionsActions.abortFetchVersionWithDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );

    const root = render({
      ...getRouteParams({
        addonId,
        baseVersionId,
        headVersionId,
      }),
      store,
    });

    expect(root.find(VersionFileViewer).children().text()).toEqual(
      'Oops, an error has occurred.',
    );
  });

  it('dispatches fetchVersionWithDiff() on mount', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionWithDiff = fakeThunk.createThunk;

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchVersionWithDiff,
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionWithDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      forceReloadVersion: false,
      headVersionId,
    });
  });

  it('dispatches an action to set current version id if currentVersionId is unset', () => {
    const { addonId, baseVersionId, headVersionId, store } = _loadDiff({
      setCurrentVersionId: false,
    });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentVersionId({ versionId: headVersionId }),
    );
  });

  it('dispatches an action to set current version id when switching head versions', () => {
    const baseVersionId = nextUniqueId();
    const newHeadVersionId = baseVersionId + 1;
    const oldHeadVersionId = baseVersionId + 2;
    const store = configureStore();
    store.dispatch(
      versionsActions.setCurrentVersionId({ versionId: oldHeadVersionId }),
    );
    const { addonId } = _loadDiff({
      baseVersionId,
      headVersionId: newHeadVersionId,
      store,
      setCurrentVersionId: false,
    });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({
        addonId,
        baseVersionId,
        headVersionId: newHeadVersionId,
      }),
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentVersionId({ versionId: newHeadVersionId }),
    );
  });

  it('dispatches setCurrentBaseVersionId() when unset', () => {
    const { store, addonId, baseVersionId, headVersionId } = _loadDiff({
      setCurrentVersionId: false,
    });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersionId }),
    );
  });

  it('dispatches setCurrentBaseVersionId() when baseVersionId differs', () => {
    const store = configureStore();
    const oldBaseVersionId = nextUniqueId();
    store.dispatch(
      versionsActions.setCurrentBaseVersionId({ versionId: oldBaseVersionId }),
    );

    const baseVersionId = oldBaseVersionId + 1;
    const headVersionId = baseVersionId + 1;

    const { addonId } = _loadDiff({ baseVersionId, headVersionId, store });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersionId }),
    );
  });

  it('dispatches setCurrentBaseVersionId() even before the head version has loaded', () => {
    const store = configureStore();
    const oldBaseVersionId = nextUniqueId();
    store.dispatch(
      versionsActions.setCurrentBaseVersionId({ versionId: oldBaseVersionId }),
    );

    const baseVersionId = oldBaseVersionId + 1;
    const headVersionId = baseVersionId + 1;

    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ baseVersionId, headVersionId }),
      store,
    });

    // It's important to set the base version ID in this case so that
    // the NavBar shows a loading indicator.
    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersionId }),
    );
  });

  it('does not dispatch setCurrentBaseVersionId() when already set', () => {
    const store = configureStore();
    const baseVersionId = nextUniqueId();
    const headVersionId = baseVersionId + 1;

    store.dispatch(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersionId }),
    );

    const { addonId } = _loadDiff({ baseVersionId, headVersionId, store });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).not.toHaveBeenCalledWith(
      versionsActions.setCurrentBaseVersionId({ versionId: baseVersionId }),
    );
  });

  it('redirects to a new compare url when the "old" version is newer than the "new" version', () => {
    const addonId = 123456;
    const baseVersionId = 2;
    const headVersionId = baseVersionId - 1;
    const lang = 'es';

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionWithDiff = fakeThunk.createThunk;
    const history = createFakeHistory();
    const push = spyOn(history, 'push');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchVersionWithDiff,
      history,
      lang,
      store,
    });

    expect(push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${headVersionId}...${baseVersionId}/`,
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch anything on update if nothing has changed', () => {
    const { dispatchSpy, fakeThunk, root } = loadDiffAndRender();

    root.setProps({});

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches fetchVersionWithDiff() on update when baseVersionId changes', () => {
    const {
      _fetchVersionWithDiff,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      root,
      store,
    } = loadDiffAndRender();

    const newBaseVersionId = baseVersionId + 1;
    const routerProps = {
      ...createFakeRouteComponentProps({
        params: getRouteParams({
          addonId,
          baseVersionId: newBaseVersionId,
          headVersionId,
        }),
      }),
    };

    root.setProps({
      ...routerProps,
      ...mapStateToProps(store.getState(), {
        ...root.instance().props,
        ...routerProps,
      }),
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionWithDiff).toHaveBeenCalledWith(
      expect.objectContaining({ baseVersionId: newBaseVersionId }),
    );
  });

  it('dispatches fetchVersionWithDiff() on update when headVersionId changes', () => {
    const {
      _fetchVersionWithDiff,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      root,
      store,
    } = loadDiffAndRender();

    const newHeadVersionId = headVersionId + 1;
    const routerProps = {
      ...createFakeRouteComponentProps({
        params: getRouteParams({
          addonId,
          baseVersionId,
          headVersionId: newHeadVersionId,
        }),
      }),
    };

    root.setProps({
      ...routerProps,
      ...mapStateToProps(store.getState(), {
        ...root.instance().props,
        ...routerProps,
      }),
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionWithDiff).toHaveBeenCalledWith(
      expect.objectContaining({ headVersionId: newHeadVersionId }),
    );
  });

  it('dispatches fetchVersionWithDiff() when entryStatusMap has not been loaded', () => {
    const addonId = 10;
    const headVersionId = 222;
    const baseVersionId = 31;
    const version = { ...fakeVersionWithDiff, id: headVersionId };
    const store = configureStore();
    _loadDiff({
      addonId,
      baseVersionId,
      headVersionId,
      store,
      version,
      loadEntryStatusMap: false,
    });
    const fakeThunk = createFakeThunk();
    const _fetchVersionWithDiff = fakeThunk.createThunk;

    const dispatchSpy = spyOn(store, 'dispatch');

    render({
      _fetchVersionWithDiff,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      store,
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches viewVersionFile() when a file is selected', () => {
    const version = fakeVersionWithDiff;
    const headVersionId = version.id;
    const path = 'new-path.js';

    const store = configureStore();
    _loadDiff({ headVersionId, store, version });
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _viewVersionFile = fakeThunk.createThunk;

    const root = render({
      _viewVersionFile,
      ...getRouteParams({ headVersionId }),
      store,
    });

    dispatch.mockClear();

    const onSelectFile = root.find(VersionFileViewer).prop('onSelectFile');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_viewVersionFile).toHaveBeenCalledWith({
      selectedPath: path,
      versionId: headVersionId,
      preserveHash: false,
    });
  });

  it('does not dispatch fetchVersionWithDiff() when the diff is already loaded', () => {
    const { dispatchSpy, fakeThunk } = loadDiffAndRender();

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches fetchDiffFile() when the version, but not the specific diff is already loaded', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = baseVersionId + 1;
    const path = 'a/different/file.js';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: queryString.stringify({ path }),
      }),
    });
    const version = {
      ...fakeVersionWithDiff,
      id: headVersionId,
    };

    const fakeThunk = createFakeThunk();
    const _fetchDiffFile = createFakeThunk().createThunk;

    const store = configureStore();
    _loadDiff({ baseVersionId, headVersionId, store, version });

    const dispatchSpy = spyOn(store, 'dispatch');

    render({
      _fetchDiffFile,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      history,
      store,
    });

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiffFile).toHaveBeenCalledWith(
      expect.objectContaining({
        addonId,
        baseVersionId,
        headVersionId,
        path,
      }),
    );
  });

  it('does not dispatch fetchVersionWithDiff() when path remains the same on update', () => {
    const path = 'manifest.json';
    const { dispatchSpy, fakeThunk, root } = loadDiffAndRender({
      selected_file: path,
    });

    // We set `path` to the same value again.
    root.setProps({ path });

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchVersionWithDiff() when path is the default file on update', () => {
    const { dispatchSpy, fakeThunk, root, version } = loadDiffAndRender();

    // Once the default file is loaded (without `path` defined), there is an
    // update with `path` being set to the default file.
    root.setProps({ path: version.file.selected_file });

    expect(dispatchSpy).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches fetchVersionWithDiff() with the path specified in the URL on mount', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;
    const path = 'a/different/file.js';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: queryString.stringify({ path }),
      }),
    });

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionWithDiff = fakeThunk.createThunk;

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchVersionWithDiff,
      history,
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionWithDiff).toHaveBeenCalledWith(
      expect.objectContaining({
        addonId,
        baseVersionId,
        headVersionId,
        path,
      }),
    );
  });

  it('does not throw an error when the selected path is not in version.entries', () => {
    const baseVersionId = nextUniqueId();
    const headVersionId = baseVersionId + 1;
    const version = createExternalVersionWithEntries([{ path: 'path1' }], {
      id: headVersionId,
      selected_file: 'a non-existant file',
    });
    const store = configureStore();

    dispatchLoadVersionInfo({ store, version });
    store.dispatch(
      versionsActions.loadEntryStatusMap({
        version,
        comparedToVersionId: baseVersionId,
      }),
    );
    store.dispatch(
      fileTreeActions.buildTree({
        comparedToVersionId: baseVersionId,
        version: createInternalVersion(version),
      }),
    );

    expect(() => {
      render({
        baseVersionId: String(baseVersionId),
        headVersionId: String(headVersionId),
        store,
      });
    }).not.toThrow();
  });

  describe('forceReloadVersion', () => {
    const setUpFileTreeAndRender = ({
      baseVersionId = nextUniqueId(),
      headVersionId = baseVersionId + 10,
      comparedToVersionId = baseVersionId,
      forVersionId = headVersionId,
    }: {
      baseVersionId?: number;
      headVersionId?: number;
      comparedToVersionId?: number;
      forVersionId?: number;
    } = {}) => {
      const addonId = nextUniqueId();
      const store = configureStore();
      store.dispatch(
        fileTreeActions.buildTree({
          version: createInternalVersion({
            ...fakeVersionWithContent,
            id: forVersionId,
          }),
          comparedToVersionId,
        }),
      );
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _fetchVersionWithDiff = fakeThunk.createThunk;

      render({
        ...getRouteParams({ addonId, baseVersionId, headVersionId }),
        _fetchVersionWithDiff,
        store,
      });
      return { dispatch, fakeThunk, store, _fetchVersionWithDiff };
    };

    it('dispatches fetchVersionWithDiff() with forceReloadVersion set when the file tree has obsolete forVersionId', () => {
      const baseVersionId = nextUniqueId();
      const headVersionId = baseVersionId + 10;
      const { dispatch, fakeThunk, _fetchVersionWithDiff } =
        setUpFileTreeAndRender({
          baseVersionId,
          forVersionId: headVersionId + 1,
          headVersionId,
        });

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionWithDiff).toHaveBeenCalledWith(
        expect.objectContaining({
          forceReloadVersion: true,
        }),
      );
    });

    it('dispatches fetchVersionWithDiff() with forceReloadVersion set when the file tree has obsolete comparedToVersionId', () => {
      const baseVersionId = nextUniqueId();
      const headVersionId = baseVersionId + 10;
      const { dispatch, fakeThunk, _fetchVersionWithDiff } =
        setUpFileTreeAndRender({
          baseVersionId,
          comparedToVersionId: baseVersionId + 1,
          headVersionId,
        });

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchVersionWithDiff).toHaveBeenCalledWith(
        expect.objectContaining({
          forceReloadVersion: true,
        }),
      );
    });
  });

  it('does not dispatch anything on mount when an API error has occured', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    store.dispatch(
      versionsActions.beginFetchVersionWithDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );
    // Simulate an API error.
    store.dispatch(
      versionsActions.abortFetchVersionWithDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  describe('preload', () => {
    const setUpForPreloadAndRender = ({
      buildTree = true,
      currentFile = 'currentFile.json',
      currentFileStatus = 'M',
      headVersionId = nextUniqueId(),
      nextModifiedFile = 'modifiedFile.json',
      nextModifiedFileStatus = 'M',
      ...params
    }: {
      buildTree?: boolean;
      currentFile?: string;
      currentFileStatus?: VersionEntryStatus;
      headVersionId?: number;
      nextModifiedFile?: string;
      nextModifiedFileStatus?: VersionEntryStatus;
    } & Parameters<typeof loadDiffAndRender>[0] = {}) => {
      const version = createExternalVersionWithEntries(
        [
          { path: currentFile, status: currentFileStatus },
          { path: 'fileWithoutChange', status: '' },
          { path: nextModifiedFile, status: nextModifiedFileStatus },
        ],
        { id: headVersionId, selected_file: currentFile },
      );
      const { _fetchVersionWithDiff, _fetchDiffFile, dispatchSpy, fakeThunk } =
        loadDiffAndRender({
          buildTree,
          headVersionId,
          version,
          ...params,
        });
      return {
        _fetchVersionWithDiff,
        _fetchDiffFile,
        dispatchSpy,
        fakeThunk,
      };
    };

    it('dispatches fetchDiffFile for the next file with diff', () => {
      const addonId = 10;
      const baseVersionId = 44;
      const headVersionId = 55;
      const currentFile = 'current.json';
      const nextModifiedFile = 'modified.json';
      const { _fetchDiffFile, dispatchSpy, fakeThunk } =
        setUpForPreloadAndRender({
          addonId,
          baseVersionId,
          currentFile,
          headVersionId,
          nextModifiedFile,
        });

      expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchDiffFile).toHaveBeenCalledWith({
        addonId,
        baseVersionId,
        headVersionId,
        path: nextModifiedFile,
      });
    });

    it('dispatches fetchDiffFile for the next file when the current file was deleted', () => {
      const addonId = nextUniqueId();
      const baseVersionId = nextUniqueId();
      const headVersionId = baseVersionId + 1;
      const currentFile = 'current.json';
      const nextModifiedFile = 'modified.json';
      const { _fetchDiffFile, dispatchSpy, fakeThunk } =
        setUpForPreloadAndRender({
          addonId,
          baseVersionId,
          currentFile,
          currentFileStatus: 'D',
          headVersionId,
          nextModifiedFile,
          nextModifiedFileStatus: 'M',
        });

      expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_fetchDiffFile).toHaveBeenCalledWith({
        addonId,
        baseVersionId,
        headVersionId,
        path: nextModifiedFile,
      });
    });

    it.each([['buildTree'], ['loadDiff']])(
      'does not dispatch fetchDiffFile for the next file before %s is dispatched',
      (action) => {
        const currentFile = 'current.json';
        const nextModifiedFile = 'next.json';
        const { _fetchDiffFile } = setUpForPreloadAndRender({
          currentFile,
          nextModifiedFile,
          [action]: false,
        });

        expect(_fetchDiffFile).not.toHaveBeenCalledWith(
          expect.objectContaining({
            path: nextModifiedFile,
          }),
        );
      },
    );

    it('does not dispatch fetchDiffFile for the next diff when it is already loaded', () => {
      const addonId = 2;
      const headVersionId = 2222;
      const baseVersionId = 11;
      const currentFile = 'current.json';
      const nextModifiedFile = 'next.json';
      const store = configureStore();
      store.dispatch(
        versionsActions.loadDiffFile({
          addonId,
          baseVersionId,
          headVersionId,
          version: fakeVersionWithDiff,
          path: nextModifiedFile,
        }),
      );

      const { _fetchDiffFile } = setUpForPreloadAndRender({
        addonId,
        baseVersionId,
        currentFile,
        headVersionId,
        nextModifiedFile,
        store,
      });

      expect(_fetchDiffFile).not.toHaveBeenCalled();
    });
  });

  it('configures VersionFileViewer with a file', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const version = {
      ...fakeVersionWithDiff,
      addon: { ...fakeVersionAddon, id: addonId },
      id: baseVersionId + 1,
    };
    const entryStatusMap = createEntryStatusMap(version);
    const headVersionId = version.id;

    const { root } = loadDiffAndRender({
      addonId,
      baseVersionId,
      headVersionId,
      version,
    });

    const expectedFile = createInternalVersionFile(version.file);

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveProp('getCodeLineAnchor');
    expect(viewer).toHaveProp(
      'file',
      // expect.objectContaining({
      //   id: version.file.id,
      //   size: version.file.size,
      // }),
      expectedFile,
    );
    expect(viewer).toHaveProp('entryStatusMap', entryStatusMap);

    const getterFromFactory = createCodeLineAnchorGetter(expectedFile);

    const getCodeLineAnchor = viewer.prop('getCodeLineAnchor');
    if (!getCodeLineAnchor) {
      throw new Error('getCodeLineAnchor was unexpectedly empty');
    }

    // As a sanity check, call the configured getter to see if we get
    // the same result as one returned by a simulated getter.
    expect(getCodeLineAnchor(1)).toEqual(getterFromFactory(1));
  });

  it('configures VersionFileViewer with a file even for empty diffs', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const fileId = fakeVersionWithDiff.file.id + 1;
    const headVersionId = baseVersionId + 1;
    const { root } = loadDiffAndRender({
      addonId,
      baseVersionId,
      headVersionId,
      version: {
        ...fakeVersionWithDiff,
        addon: { ...fakeVersionAddon, id: addonId },
        id: headVersionId,
        file: {
          ...fakeVersionWithDiff.file,
          id: fileId,
          diff: null,
        },
      },
    });

    expect(root.find(VersionFileViewer)).toHaveProp(
      'file',
      expect.objectContaining({
        id: fileId,
      }),
    );
  });

  it('sets a temporary page title without a version', () => {
    const root = render({ shouldMockDispatch: true });

    expect(root.find('title')).toHaveText('Compare add-on versions');
  });

  it('sets a page title from versions', () => {
    const baseVersionId = fakeVersionWithDiff.id + 1;
    const headVersionId = baseVersionId + 1;

    const name = 'AdBlockPlus';
    const version = {
      ...fakeVersionWithDiff,
      id: headVersionId,
      addon: {
        ...fakeVersionWithDiff.addon,
        name: externallyLocalizedString(name),
      },
    };

    const store = configureStore();
    _loadDiff({ baseVersionId, headVersionId, store, version });

    const root = render({
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      store,
    });

    expect(root.find('title')).toHaveText(
      `Compare ${name}: ${baseVersionId}...${headVersionId}`,
    );
  });

  it('handles a missing add-on name', () => {
    const baseVersionId = fakeVersionWithDiff.id + 1;
    const headVersionId = baseVersionId + 1;

    const version = {
      ...fakeVersionWithDiff,
      id: headVersionId,
      addon: {
        ...fakeVersionWithDiff.addon,
        name: null,
      },
    };

    const store = configureStore();
    _loadDiff({ baseVersionId, headVersionId, store, version });

    const root = render({
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      store,
    });

    expect(root.find('title')).toHaveText(
      `Compare ${MISSING_ADDON_NAME_TEXT}: ${baseVersionId}...${headVersionId}`,
    );
  });

  describe('updateSelectedPath', () => {
    const setUpForPathUpdateAndRender = ({
      headVersionId,
      initialPath,
      lastSelectedPath,
      location,
      pathList,
    }: {
      headVersionId: number;
      initialPath: string;
      lastSelectedPath: string;
      location: Location;
      pathList: string[];
    }) => {
      const addonId = nextUniqueId();
      const baseVersionId = headVersionId - 1;
      const history = createFakeHistory({ location });
      const version = createExternalVersionWithEntries(
        pathList.map((path) => ({ path })),
        { addonId, id: headVersionId, selected_file: initialPath },
      );

      return loadDiffAndRender({
        addonId,
        baseVersionId,
        headVersionId,
        history,
        lastSelectedPath,
        version,
      });
    };

    it('updates the selected path if it is different from the path in the URL', () => {
      const headVersionId = nextUniqueId();
      const path1 = 'a/path';
      const path2 = 'b/path';
      const location = createFakeLocation({
        search: queryString.stringify({ path: path2 }),
      });

      const { dispatchSpy } = setUpForPathUpdateAndRender({
        headVersionId,
        initialPath: path1,
        lastSelectedPath: path1,
        location,
        pathList: [path1, path2],
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        versionsActions.updateSelectedPath({
          selectedPath: path2,
          versionId: headVersionId,
        }),
      );
    });

    it('updates the selected path to the initial value if the path is undefined in the URL', () => {
      const headVersionId = nextUniqueId();
      const initialPath = 'a/path';
      const lastSelectedPath = 'b/path';

      const { dispatchSpy } = setUpForPathUpdateAndRender({
        headVersionId,
        initialPath,
        lastSelectedPath,
        location: createFakeLocation({ search: '' }),
        pathList: [initialPath, lastSelectedPath],
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        versionsActions.updateSelectedPath({
          selectedPath: initialPath,
          versionId: headVersionId,
        }),
      );
    });

    it('does not update the selected path if it is the same as the path in the URL', () => {
      const headVersionId = nextUniqueId();
      const path = 'a/path';
      const location = createFakeLocation({
        search: queryString.stringify({ path }),
      });

      const { dispatchSpy } = setUpForPathUpdateAndRender({
        headVersionId,
        initialPath: path,
        lastSelectedPath: path,
        location,
        pathList: [path],
      });

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        versionsActions.updateSelectedPath(
          expect.objectContaining({
            versionId: headVersionId,
          }),
        ),
      );
    });

    it('does not update the selected path if it has the initial value and the path in URL is undefined', () => {
      const headVersionId = nextUniqueId();
      const path = 'a/path';
      const location = createFakeLocation({ search: '' });

      const { dispatchSpy } = setUpForPathUpdateAndRender({
        headVersionId,
        initialPath: path,
        lastSelectedPath: path,
        location,
        pathList: [path],
      });

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        versionsActions.updateSelectedPath(
          expect.objectContaining({
            versionId: headVersionId,
          }),
        ),
      );
    });
  });
});
