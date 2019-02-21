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
    _log?: PublicProps['_log'];
    addonId?: string;
    versionId?: string;
    store?: Store;
  };

  const render = ({
    _fetchVersion,
    _log,
    addonId = '999',
    versionId = '123',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { addonId, versionId } }),
      _fetchVersion,
      _log,
    };

    return shallowUntilTarget(<Browse {...props} />, BrowseBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  it('renders a page', () => {
    const versionId = '123456';

    const root = render({ versionId });

    expect(root).toIncludeText(`Version ID: ${versionId}`);
  });

  it('renders a FileTree component', () => {
    const version = fakeVersion;

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version }));

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp(
      'version',
      createInternalVersion(version),
    );
  });

  it('dispatches fetchVersion() on mount', () => {
    const version = fakeVersion;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();

    render({
      _fetchVersion: fakeThunk.createThunk,
      store,
      versionId: String(version.id),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
  });
});
