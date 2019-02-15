import * as React from 'react';
import { Store } from 'redux';

import {
  createFakeHistory,
  fakeVersion,
  getFakeLogger,
  shallowUntilTarget,
} from '../../test-helpers';
import * as api from '../../api';
import configureStore from '../../configureStore';
import {
  actions as versionActions,
  createInternalVersion,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';

import Browse, { BrowseBase, DefaultProps } from '.';

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
    _log?: DefaultProps['_log'];
    addonId?: string;
    versionId?: string;
    store?: Store;
  };

  const render = async ({
    _log,
    addonId = '999',
    versionId = '123',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { addonId, versionId } }),
      _log,
    };

    return shallowUntilTarget(<Browse {...props} />, BrowseBase, {
      shallowOptions: {
        context: { store },
      },
    });
  };

  it('renders a page', async () => {
    const versionId = '123456';

    const root = await render({ versionId });

    expect(root).toIncludeText(`Version ID: ${versionId}`);
  });

  it('renders a FileTree component', async () => {
    const version = fakeVersion;

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version }));

    const root = await render({ store, versionId: String(version.id) });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp(
      'version',
      createInternalVersion(version),
    );
  });

  it('calls the API to load the version info on mount', async () => {
    const addonId = 12345;
    const version = {
      ...fakeVersion,
      id: 999,
    };

    const mockApi = jest.spyOn(api, 'getVersion');
    mockApi.mockReturnValue(Promise.resolve(version));

    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

    await render({
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    expect(mockApi).toHaveBeenCalledWith({
      apiState: store.getState().api,
      addonId,
      versionId: version.id,
    });
    expect(dispatch).toHaveBeenCalledWith(
      versionActions.loadVersionInfo({ version }),
    );
  });

  it('logs an error when the API request to retrieve the current user profile has failed', async () => {
    const _log = getFakeLogger();
    const error = new Error('server error');

    const mockApi = jest.spyOn(api, 'getVersion');
    mockApi.mockReturnValue(Promise.resolve({ error }));

    await render({ _log });

    expect(_log.error).toHaveBeenCalled();
  });
});
