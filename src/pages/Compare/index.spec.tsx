import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';

import {
  createFakeHistory,
  createFakeThunk,
  fakeVersionWithDiff,
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

import Compare, { CompareBase, PublicProps } from '.';

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
    addonId?: string;
    baseVersionId?: string;
    headVersionId?: string;
    history?: History;
    lang?: string;
    store?: Store;
  };

  const render = ({
    _fetchDiff,
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

  it('renders loading messages when no version has been loaded', () => {
    const addonId = 123;
    const root = render({ addonId: String(addonId) });

    expect(root.find(Loading)).toHaveLength(2);
    expect(root.find(Loading).at(0)).toHaveProp(
      'message',
      'Loading file tree...',
    );
    expect(root.find(Loading).at(1)).toHaveProp('message', 'Loading diff...');
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
    const addonId = 9999;
    const baseVersionId = 1;
    const version = { ...fakeVersionWithDiff, id: baseVersionId + 1 };

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

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp('versionId', version.id);
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
    const store = configureStore();
    store.dispatch(versionsActions.abortFetchDiff());

    const root = render({ store });

    expect(root.find(`.${styles.error}`)).toHaveLength(2);
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

  it('does not dispatch fetchDiff() on update if no parameter has changed', () => {
    const addonId = 123456;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;
    const params = getRouteParams({ addonId, baseVersionId, headVersionId });

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      ...params,
      _fetchDiff: fakeThunk.createThunk,
      store,
    });

    dispatch.mockClear();
    root.setProps({ match: { params } });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches fetchDiff() on update if base version is different', () => {
    const addonId = 123456;
    const baseVersionId = 10;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      ...getRouteParams({
        addonId,
        baseVersionId: baseVersionId - 1,
        headVersionId,
      }),
      _fetchDiff,
      store,
    });

    dispatch.mockClear();
    _fetchDiff.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({ addonId, baseVersionId, headVersionId }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      headVersionId,
    });
  });

  it('dispatches fetchDiff() on update if head version is different', () => {
    const addonId = 123456;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      ...getRouteParams({
        addonId,
        baseVersionId,
        headVersionId: headVersionId + 1,
      }),
      _fetchDiff,
      store,
    });

    dispatch.mockClear();
    _fetchDiff.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({ addonId, baseVersionId, headVersionId }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      headVersionId,
    });
  });

  it('dispatches fetchDiff() on update if addon ID is different', () => {
    const addonId = 123456;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchDiff = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchDiff,
      ...getRouteParams({
        addonId: addonId + 10,
        baseVersionId,
        headVersionId,
      }),
      store,
    });

    dispatch.mockClear();
    _fetchDiff.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({ addonId, baseVersionId, headVersionId }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchDiff).toHaveBeenCalledWith({
      addonId,
      baseVersionId,
      headVersionId,
    });
  });

  it('dispatches updateSelectedPath() when a file is selected', () => {
    const version = fakeVersionWithDiff;
    const headVersionId = version.id;
    const path = 'new-path.js';

    const store = configureStore();
    _loadDiff({ headVersionId, store, version });

    const dispatch = spyOn(store, 'dispatch');

    const root = render({ ...getRouteParams({ headVersionId }), store });

    dispatch.mockClear();

    const onSelectFile = root.find(FileTree).prop('onSelect');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.updateSelectedPath({
        selectedPath: path,
        versionId: headVersionId,
      }),
    );
  });

  it('does not dispatch fetchDiff() when path remains the same', () => {
    const addonId = 123456;
    const baseVersionId = 1;
    const path = 'manifest.json';
    const version = {
      ...fakeVersionWithDiff,
      file: {
        ...fakeVersionWithDiff.file,
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file: path,
      },
    };
    const headVersionId = version.id;

    const store = configureStore();
    _loadDiff({ addonId, baseVersionId, headVersionId, store, version });

    const fakeThunk = createFakeThunk();
    const dispatch = spyOn(store, 'dispatch');
    const params = getRouteParams({ addonId, baseVersionId, headVersionId });

    // The version is already loaded, hence `path` is defined already.
    const root = render({
      ...params,
      _fetchDiff: fakeThunk.createThunk,
      store,
    });
    // We set `path` to the same value again.
    root.setProps({ path });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch fetchDiff() twice for the default file', () => {
    const addonId = 123456;
    const baseVersionId = 1;
    const headVersionId = baseVersionId + 1;
    const params = getRouteParams({ addonId, baseVersionId, headVersionId });

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      ...params,
      _fetchDiff: fakeThunk.createThunk,
      store,
    });
    // Once the default file is loaded (without `path` defined), there is an
    // update with `path` being set to the default file.
    root.setProps({ path: fakeVersionWithDiff.file.selected_file });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
