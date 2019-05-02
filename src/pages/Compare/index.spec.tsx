import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';
import queryString from 'query-string';

import {
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  fakeVersionWithDiff,
  getContentShellPanel,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  actions as versionsActions,
  createInternalDiffs,
  createInternalVersion,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
import styles from './styles.module.scss';

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
    store.dispatch(versionsActions.loadVersionInfo({ version }));
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
  } = {}) => {
    const addonId = 1;
    const baseVersionId = 2;
    const headVersionId = 3;
    const version = {
      ...fakeVersionWithDiff,
      id: headVersionId,
      file: {
        ...fakeVersionWithDiff.file,
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file,
      },
    };
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const _viewVersionFile = fakeThunk.createThunk;

    _loadDiff({ addonId, baseVersionId, headVersionId, store, version });

    const dispatchSpy = spyOn(store, 'dispatch');

    const root = render({
      _fetchDiff,
      _viewVersionFile,
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
      history,
      store,
    });

    return {
      _fetchDiff,
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

  it('renders loading messages when no version has been loaded', () => {
    const addonId = 123;
    const root = render({ addonId: String(addonId) });

    expect(
      getContentShellPanel(root, 'mainSidePanel').find(Loading),
    ).toHaveProp('message', 'Loading file tree...');
    expect(root.find(Loading)).toHaveProp('message', 'Loading diff...');

    // This component is always displayed.
    expect(root.find(VersionChooser)).toHaveLength(1);
    expect(root.find(VersionChooser)).toHaveProp('addonId', addonId);
  });

  it('renders a loading message when no diff has been loaded', () => {
    const version = fakeVersionWithDiff;
    const store = configureStore();
    store.dispatch(versionsActions.loadVersionInfo({ version }));

    const root = render({ headVersionId: String(version.id), store });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading diff...');
  });

  it('renders a FileTree component when a diff has been loaded', () => {
    const { root, version } = loadDiffAndRender();

    const tree = getContentShellPanel(root, 'mainSidePanel').find(FileTree);
    expect(tree).toHaveLength(1);
    expect(tree).toHaveProp('versionId', version.id);
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
      'diffs',
      createInternalDiffs({
        baseVersionId,
        headVersionId: version.id,
        version,
      }),
    );
    expect(diffView).toHaveProp('mimeType', mimeType);
    expect(diffView).toHaveProp('version', createInternalVersion(version));
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

    expect(
      getContentShellPanel(root, 'mainSidePanel').find(`.${styles.error}`),
    ).toHaveLength(1);
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

    const onSelectFile = getContentShellPanel(root, 'mainSidePanel')
      .find(FileTree)
      .prop('onSelect');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_viewVersionFile).toHaveBeenCalledWith({
      selectedPath: path,
      versionId: headVersionId,
      preserveHash: false,
    });
  });

  it('does not dispatch anything when diff is loaded on mount', () => {
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
});
