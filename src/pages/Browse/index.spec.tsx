import * as React from 'react';
import { Store } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Highlight from 'react-highlight';

import {
  createFakeHistory,
  createFakeThunk,
  fakeVersion,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  VersionFile,
  actions as versionActions,
  createInternalVersion,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';

import Browse, { BrowseBase, PublicProps, Props } from '.';

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

  it('renders a page with a loading message', () => {
    const versionId = '123456';

    const root = render({ versionId });

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root).toIncludeText('Loading version');
  });

  it('renders a FileTree component when a version has been loaded', () => {
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

  it('renders the content of the default file when a version has been loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version }));

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(Highlight)).toHaveLength(1);
    expect(root.find(Highlight)).toHaveProp('className', 'auto');
    expect(root.find(Highlight)).toHaveProp(
      'children',
      ((root.instance().props as Props).file as VersionFile).content,
    );
  });

  it('renders a loading message when we do not have the content of a file yet', () => {
    const version = fakeVersion;

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version }));

    const root = render({ store, versionId: String(version.id) });
    // This is used to force `file` to be `null` and test the path where the
    // selected file has not been loaded. We cannot do anything else yet
    // because there is no logic to select another file from the tree.
    //
    // TODO: remove this when
    // https://github.com/mozilla/addons-code-manager/issues/108 lands.
    root.setProps({ file: null });

    expect(root.find(Highlight)).toHaveLength(0);
    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root).toIncludeText('Loading content');
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
