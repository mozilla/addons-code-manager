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
    store?: Store;
  };

  const render = ({
    _fetchVersion,
    addonId = '999',
    baseVersionId = '1',
    headVersionId = '2',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({
        params: { addonId, baseVersionId, headVersionId },
      }),
      _fetchVersion,
    };

    return shallowUntilTarget(<Compare {...props} />, CompareBase, {
      shallowOptions: {
        context: { store },
      },
    });
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
      addonId: String(addonId),
      baseVersionId: String(baseVersion.id),
      headVersionId: String(headVersion.id),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: baseVersion.id,
    });
  });
});
