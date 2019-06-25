import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';
import queryString from 'query-string';

import {
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  createStoreWithVersion,
  externallyLocalizedString,
  fakeVersion,
  fakeVersionWithDiff,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  ExternalVersionWithDiff,
  actions as versionsActions,
  createInternalDiff,
  createInternalVersion,
  getCompareInfo,
} from '../../reducers/versions';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionFileViewer from '../../components/VersionFileViewer';
import styles from './styles.module.scss';
import { ForwardComparisonMap } from './utils';

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
    _fetchDiff?: PublicProps['_fetchDiff'];
    _fetchVersionFile?: PublicProps['_fetchVersionFile'];
    _viewVersionFile?: PublicProps['_viewVersionFile'];
    addonId?: string;
    baseVersionId?: string;
    headVersionId?: string;
    history?: History;
    lang?: string;
    store?: Store;
  };

  const render = ({
    _fetchDiff,
    _fetchVersionFile,
    _viewVersionFile,
    addonId = '999',
    baseVersionId = '1',
    headVersionId = '2',
    history = createFakeHistory(),
    lang = 'fr',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({
        history,
        params: { lang, addonId, baseVersionId, headVersionId },
      }),
      _fetchDiff,
      _fetchVersionFile,
      _viewVersionFile,
    };

    return shallowUntilTarget(<Compare {...props} />, CompareBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  const _loadDiff = ({
    addonId = 1,
    baseVersionId = 2,
    headVersionId = 3,
    store = configureStore(),
    version = fakeVersionWithDiff,
  }) => {
    store.dispatch(
      versionsActions.loadVersionInfo({
        version,
        comparedToVersionId: baseVersionId,
      }),
    );
    store.dispatch(
      versionsActions.loadVersionFile({
        path: version.file.selected_file,
        // Make a version with file content out of the given version
        // diff response.
        version: {
          ...fakeVersion,
          id: version.id,
          file: {
            ...fakeVersion.file,
            ...version.file,
          },
        },
      }),
    );
    store.dispatch(
      versionsActions.loadDiff({
        addonId,
        baseVersionId,
        headVersionId,
        version,
      }),
    );
  };

  const loadDiffAndRender = ({
    history = createFakeHistory(),
    // eslint-disable-next-line @typescript-eslint/camelcase
    selected_file = fakeVersionWithDiff.file.selected_file,
    store = configureStore(),
    addonId = 1,
    baseVersionId = 2,
    headVersionId = 3,
    version = {
      ...fakeVersionWithDiff,
      id: headVersionId,
      file: {
        ...fakeVersionWithDiff.file,
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file,
      },
    },
  }: {
    history?: History;
    store?: Store;
    addonId?: number;
    baseVersionId?: number;
    headVersionId?: number;
    selected_file?: string;
    version?: ExternalVersionWithDiff;
  } = {}) => {
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const _fetchVersionFile = fakeThunk.createThunk;
    const _viewVersionFile = fakeThunk.createThunk;

    _loadDiff({ addonId, baseVersionId, headVersionId, store, version });

    const dispatchSpy = spyOn(store, 'dispatch');

    const root = render({
      _fetchDiff,
      _fetchVersionFile,
      _viewVersionFile,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      history,
      store,
    });

    return {
      _fetchDiff,
      _fetchVersionFile,
      _viewVersionFile,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      params: getRouteParams({ addonId, baseVersionId, headVersionId }),
      root,
      store,
      version,
    };
  };

  it('renders a loading message when no diff has been loaded', () => {
    const version = fakeVersionWithDiff;
    const store = createStoreWithVersion(version);

    const root = render({ headVersionId: String(version.id), store });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading diff...');
  });

  it('renders a VersionFileViewer', () => {
    const {
      addonId,
      baseVersionId,
      headVersionId,
      root,
      store,
      version,
    } = loadDiffAndRender();

    const compareInfo = getCompareInfo(
      store.getState().versions,
      addonId,
      baseVersionId,
      headVersionId,
    );

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveLength(1);
    expect(viewer).toHaveProp('compareInfo', compareInfo);
    expect(viewer).toHaveProp(
      'version',
      createInternalVersion(version, { comparedToVersionId: baseVersionId }),
    );
  });

  it('renders a DiffView', () => {
    const addonId = 999;
    const baseVersionId = 1;
    const path = 'manifest.json';
    const mimeType = 'mime/type';

    const version = {
      ...fakeVersionWithDiff,
      id: baseVersionId + 1,
      file: {
        ...fakeVersionWithDiff.file,
        entries: {
          ...fakeVersionWithDiff.file.entries,
          [path]: {
            ...fakeVersionWithDiff.file.entries[path],
            mimetype: mimeType,
          },
        },
        // eslint-disable-next-line @typescript-eslint/camelcase
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
      baseVersionId: String(baseVersionId),
      headVersionId: String(version.id),
    });

    const diffView = root.find(DiffView);
    expect(diffView).toHaveLength(1);
    expect(diffView).toHaveProp(
      'diff',
      createInternalDiff({
        baseVersionId,
        headVersionId: version.id,
        version,
      }),
    );
    expect(diffView).toHaveProp('mimeType', mimeType);
    expect(diffView).toHaveProp(
      'version',
      createInternalVersion(version, { comparedToVersionId: baseVersionId }),
    );
  });

  it('renders an error when fetching a diff has failed', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    store.dispatch(
      versionsActions.beginFetchDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );
    store.dispatch(
      versionsActions.abortFetchDiff({
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

    expect(root.find(`.${styles.error}`)).toHaveLength(1);
  });

  it('dispatches fetchDiff() on mount', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchDiff,
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      headVersionId,
    });
  });

  it('dispatches fetchVersionFile() on mount', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;
    const version = { ...fakeVersionWithDiff, id: headVersionId };
    const store = configureStore();

    store.dispatch(
      versionsActions.loadVersionInfo({
        version,
        comparedToVersionId: baseVersionId,
      }),
    );

    store.dispatch(
      versionsActions.loadDiff({
        addonId,
        baseVersionId,
        headVersionId,
        version,
      }),
    );

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionFile = fakeThunk.createThunk;

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchVersionFile,
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionFile).toHaveBeenCalledWith({
      addonId,
      versionId: version.id,
      path: version.file.selected_file,
    });
  });

  it('does not dispatch fetchVersionFile() when a file is loading', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;
    const version = { ...fakeVersionWithDiff, id: headVersionId };
    const store = configureStore();

    store.dispatch(
      versionsActions.loadVersionInfo({
        version,
        comparedToVersionId: baseVersionId,
      }),
    );

    store.dispatch(
      versionsActions.loadDiff({
        addonId,
        baseVersionId,
        headVersionId,
        version,
      }),
    );

    store.dispatch(
      versionsActions.beginFetchVersionFile({
        path: version.file.selected_file,
        versionId: version.id,
      }),
    );

    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchVersionFile() when the file is already loaded', () => {
    const addonId = 999;
    const baseVersionId = 1;
    const version = { ...fakeVersionWithDiff, id: baseVersionId + 1 };
    const headVersionId = version.id;

    const store = configureStore();
    _loadDiff({ addonId, baseVersionId, headVersionId, store, version });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      store,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('redirects to a new compare url when the "old" version is newer than the "new" version', () => {
    const addonId = 123456;
    const baseVersionId = 2;
    const headVersionId = baseVersionId - 1;
    const lang = 'es';

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const history = createFakeHistory();
    const push = spyOn(history, 'push');

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchDiff,
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
    const { dispatchSpy, root } = loadDiffAndRender();

    root.setProps({});

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('dispatches fetchDiff() on update when baseVersionId changes', () => {
    const {
      _fetchDiff,
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
    expect(_fetchDiff).toHaveBeenCalledWith(
      expect.objectContaining({ baseVersionId: newBaseVersionId }),
    );
  });

  it('dispatches fetchDiff() on update when headVersionId changes', () => {
    const {
      _fetchDiff,
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
    expect(_fetchDiff).toHaveBeenCalledWith(
      expect.objectContaining({ headVersionId: newHeadVersionId }),
    );
  });

  it('dispatches fetchDiff() on update when addonId changes', () => {
    const {
      _fetchDiff,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      root,
      store,
    } = loadDiffAndRender();

    const newAddonId = addonId + 1;
    const routerProps = {
      ...createFakeRouteComponentProps({
        params: getRouteParams({
          addonId: newAddonId,
          baseVersionId,
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
    expect(_fetchDiff).toHaveBeenCalledWith(
      expect.objectContaining({ addonId: newAddonId }),
    );
  });

  it('dispatches fetchDiff() on update when path changes', () => {
    const {
      _fetchDiff,
      addonId,
      baseVersionId,
      dispatchSpy,
      fakeThunk,
      headVersionId,
      root,
      store,
    } = loadDiffAndRender();

    const path = 'some-new-path';
    const history = createFakeHistory({
      location: createFakeLocation({
        search: queryString.stringify({ path }),
      }),
    });
    const routerProps = {
      ...createFakeRouteComponentProps({
        history,
        params: getRouteParams({
          addonId,
          baseVersionId,
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
    expect(_fetchDiff).toHaveBeenCalledWith(expect.objectContaining({ path }));
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

  it('dispatches fetchDiff() when switching between base versions', () => {
    const addonId = 2;
    const headVersionId = 10;
    const firstBaseVersion = 9;
    const secondBaseVersion = 8;
    const version = { ...fakeVersionWithDiff, id: headVersionId };

    const store = configureStore();

    _loadDiff({
      addonId,
      baseVersionId: firstBaseVersion,
      headVersionId,
      store,
      version,
    });

    // Load a comparison for the same head version but a different base
    // version
    _loadDiff({
      addonId,
      baseVersionId: secondBaseVersion,
      headVersionId,
      store,
      version,
    });

    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;

    render({
      _fetchDiff,
      addonId: String(addonId),
      // "Go back" to the first comparison view. This will cause the
      // previously stored comparison to load but should force the
      // version to get reloaded since it will be out of date.
      baseVersionId: String(firstBaseVersion),
      headVersionId: String(headVersionId),
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('does not dispatch fetchDiff() when the diff is already loaded', () => {
    const { dispatchSpy } = loadDiffAndRender();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchDiff() when path remains the same on update', () => {
    const path = 'manifest.json';
    const { dispatchSpy, root } = loadDiffAndRender({
      // eslint-disable-next-line @typescript-eslint/camelcase
      selected_file: path,
    });

    // We set `path` to the same value again.
    root.setProps({ path });

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchDiff() when path is the default file on update', () => {
    const { dispatchSpy, root, version } = loadDiffAndRender();

    // Once the default file is loaded (without `path` defined), there is an
    // update with `path` being set to the default file.
    root.setProps({ path: version.file.selected_file });

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('dispatches fetchDiff() with the path specified in the URL on mount', () => {
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
    const _fetchDiff = fakeThunk.createThunk;

    render({
      ...getRouteParams({ addonId, baseVersionId, headVersionId }),
      _fetchDiff,
      history,
      store,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      headVersionId,
      path,
    });
  });

  it('does not dispatch anything on mount when an API error has occured', () => {
    const addonId = 9999;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    store.dispatch(
      versionsActions.beginFetchDiff({
        addonId,
        baseVersionId,
        headVersionId,
      }),
    );
    // Simulate an API error.
    store.dispatch(
      versionsActions.abortFetchDiff({
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

  it('configures VersionFileViewer to show CodeOverview', () => {
    const baseVersionId = 1;
    const version = { ...fakeVersionWithDiff, id: baseVersionId + 1 };
    const headVersionId = version.id;

    const { root } = loadDiffAndRender({
      baseVersionId,
      headVersionId,
      version,
    });

    const viewer = root.find(VersionFileViewer);
    expect(viewer).toHaveProp('getCodeLineAnchor');
    expect(viewer).toHaveProp(
      'file',
      expect.objectContaining({
        id: version.file.id,
        size: version.file.size,
      }),
    );

    const diff = createInternalDiff({ baseVersionId, headVersionId, version });
    if (!diff) {
      throw new Error('diff was unexpectedly empty');
    }
    const map = new ForwardComparisonMap(diff);

    const getCodeLineAnchor = viewer.prop('getCodeLineAnchor');
    if (!getCodeLineAnchor) {
      throw new Error('getCodeLineAnchor was unexpectedly empty');
    }

    // As a sanity check, call the configured getter to see if we get
    // the same result as one returned by a simulated getter.
    expect(getCodeLineAnchor(1)).toEqual(map.getCodeLineAnchor(1));
  });

  it('does not configure VersionFileViewer with a file for empty diffs', () => {
    const headVersionId = 2;
    const { root } = loadDiffAndRender({
      baseVersionId: headVersionId - 1,
      headVersionId,
      version: {
        ...fakeVersionWithDiff,
        id: headVersionId,
        file: {
          ...fakeVersionWithDiff.file,
          diff: null,
        },
      },
    });

    expect(root.find(VersionFileViewer)).toHaveProp('file', null);
  });

  it('sets a temporary page title without a version', () => {
    const root = render();

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
});
