import * as React from 'react';

import {
  createFakeHistory,
  fakeVersion,
  shallowUntilTarget,
} from '../../test-helpers';
import * as api from '../../api';
import configureStore from '../../configureStore';
import {
  actions as versionActions,
  createInternalVersion,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';

import Browse, { BrowseBase } from '.';

describe(__filename, () => {
  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = {
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

  const render = async ({
    versionId = '123',
    store = configureStore(),
  } = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { versionId } }),
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
    const version = {
      ...fakeVersion,
      id: 999,
    };

    const mockApi = jest.spyOn(api, 'getVersionFile');
    mockApi.mockReturnValue(Promise.resolve(version));

    const store = configureStore();
    const dispatch = jest.spyOn(store, 'dispatch');

    await render({ store, versionId: String(version.id) });

    expect(mockApi).toHaveBeenCalledWith({
      apiState: store.getState().api,
      versionId: version.id,
    });
    expect(dispatch).toHaveBeenCalledWith(
      versionActions.loadVersionInfo({ version }),
    );
  });
});
