import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';

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
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';

import Compare, { CompareBase, PublicProps } from '.';

describe(__filename, () => {
  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = {
      addonId: '999',
      baseVersionId: '1',
      headVersionId: '2',
      lang: 'fr',
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
    addonId?: string;
    baseVersionId?: string;
    headVersionId?: string;
    history?: History;
    lang?: string;
    store?: Store;
  };

  const render = ({
    _fetchVersion,
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
      _fetchVersion,
    };

    return shallowUntilTarget(<Compare {...props} />, CompareBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  type GetRouteParamsParams = {
    addonId: number;
    baseVersionId: number;
    headVersionId: number;
  };

  const getRouteParams = ({
    addonId,
    baseVersionId,
    headVersionId,
  }: GetRouteParamsParams) => {
    return {
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
    };
  };

  it('renders a page with a loading message', () => {
    const root = render();

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading version...');
  });

  it('renders a FileTree component when a version has been loaded', () => {
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version: baseVersion }));
    store.dispatch(versionActions.loadVersionInfo({ version: headVersion }));

    const root = render({
      store,
      baseVersionId: String(baseVersion.id),
      headVersionId: String(headVersion.id),
    });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp(
      'version',
      createInternalVersion(baseVersion),
    );
  });

  it('renders a DiffView', () => {
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version: baseVersion }));
    store.dispatch(versionActions.loadVersionInfo({ version: headVersion }));

    const root = render({
      store,
      baseVersionId: String(baseVersion.id),
      headVersionId: String(headVersion.id),
    });

    expect(root.find(DiffView)).toHaveLength(1);
  });

  it('dispatches fetchVersion() on mount', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;

    render({
      _fetchVersion,
      store,
      ...getRouteParams({
        addonId,
        baseVersionId: baseVersion.id,
        headVersionId: headVersion.id,
      }),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: baseVersion.id,
    });
  });

  it('redirects to a new compare url when the "old" version is newer than the "new" version', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id - 1 };
    const lang = 'es';

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const history = createFakeHistory();
    const push = spyOn(history, 'push');

    render({
      _fetchVersion,
      store,
      ...getRouteParams({
        addonId,
        baseVersionId: baseVersion.id,
        headVersionId: headVersion.id,
      }),
      history,
      lang,
    });

    expect(push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${headVersion.id}...${
        baseVersion.id
      }/`,
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchVersion() on update if no parameter has changed', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchVersion: fakeThunk.createThunk,
      addonId: String(addonId),
      baseVersionId: String(baseVersion.id),
      headVersionId: String(headVersion.id),
      store,
    });

    dispatch.mockClear();
    root.setProps({
      match: {
        params: {
          addonId: String(addonId),
          baseVersionId: String(baseVersion.id),
          headVersionId: String(headVersion.id),
        },
      },
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches fetchVersion() on update if base version is different', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchVersion,
      ...getRouteParams({
        addonId,
        baseVersionId: baseVersion.id - 10,
        headVersionId: headVersion.id,
      }),
      store,
    });

    dispatch.mockClear();
    _fetchVersion.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({
          addonId,
          baseVersionId: baseVersion.id,
          headVersionId: headVersion.id,
        }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: baseVersion.id,
    });
  });

  it('dispatches fetchVersion() on update if head version is different', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchVersion,
      ...getRouteParams({
        addonId,
        baseVersionId: baseVersion.id,
        headVersionId: headVersion.id + 10,
      }),
      store,
    });

    dispatch.mockClear();
    _fetchVersion.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({
          addonId,
          baseVersionId: baseVersion.id,
          headVersionId: headVersion.id,
        }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: baseVersion.id,
    });
  });

  it('dispatches fetchVersion() on update if addon ID is different', () => {
    const addonId = 123456;
    const baseVersion = fakeVersion;
    const headVersion = { ...fakeVersion, id: baseVersion.id + 1 };

    const store = configureStore();
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchVersion,
      ...getRouteParams({
        addonId: addonId + 10,
        baseVersionId: baseVersion.id,
        headVersionId: headVersion.id,
      }),
      store,
    });

    dispatch.mockClear();
    _fetchVersion.mockClear();
    root.setProps({
      match: {
        params: getRouteParams({
          addonId,
          baseVersionId: baseVersion.id,
          headVersionId: headVersion.id,
        }),
      },
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: baseVersion.id,
    });
  });
});
