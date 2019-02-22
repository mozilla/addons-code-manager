import * as React from 'react';
import { Store } from 'redux';
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
import Loading from '../../components/Loading';

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
    _fetchVersionFile?: PublicProps['_fetchVersionFile'];
    _log?: PublicProps['_log'];
    addonId?: string;
    versionId?: string;
    store?: Store;
  };

  const render = ({
    _fetchVersion,
    _fetchVersionFile,
    _log,
    addonId = '999',
    versionId = '123',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { addonId, versionId } }),
      _fetchVersion,
      _fetchVersionFile,
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

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading version...');
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
    expect(root.find(FileTree)).toHaveProp(
      'onSelect',
      (root.instance() as BrowseBase).onSelectFile,
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

    // The user clicks a different file to view.
    store.dispatch(
      versionActions.updateSelectedPath({
        selectedPath: 'some/file.js',
        versionId: version.id,
      }),
    );

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(Highlight)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading content...');
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

  it('dispatches fetchVersionFile when a file is selected', () => {
    const version = fakeVersion;
    const path = 'some-path';

    const store = configureStore();
    store.dispatch(versionActions.loadVersionInfo({ version }));

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();

    const root = render({
      _fetchVersionFile: fakeThunk.createThunk,
      store,
      versionId: String(version.id),
    });

    // Simulate a click on a file.
    (root.instance() as BrowseBase).onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
  });
});
