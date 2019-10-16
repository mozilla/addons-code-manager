/* eslint-disable @typescript-eslint/camelcase */
import React from 'react';
import { Store } from 'redux';

import { Version, createInternalVersion } from '../../reducers/versions';
import configureStore from '../../configureStore';
import {
  ExternalLinterMessage,
  actions as linterActions,
  getMessageMap,
} from '../../reducers/linter';
import {
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeThunk,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';

import LinterProvider, {
  DefaultProps,
  LinterProviderBase,
  PublicProps,
  RenderWithMessages,
} from '.';

describe(__filename, () => {
  type RenderParams = {
    children?: RenderWithMessages;
    version?: Version;
    store?: Store;
  } & Partial<PublicProps & DefaultProps>;

  const render = ({
    children = jest.fn(),
    version = createInternalVersion(fakeVersion),
    selectedPath = 'selected.js',
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      children,
      versionId: version.id,
      validationURL: version.validationURL,
      selectedPath,
      ...moreProps,
    };

    const shallowOptions = createContextWithFakeRouter();

    return shallowUntilTarget(
      <LinterProvider {...props}>{children}</LinterProvider>,
      LinterProviderBase,
      {
        shallowOptions: {
          ...shallowOptions,
          context: {
            ...shallowOptions.context,
            store,
          },
        },
      },
    );
  };

  const renderWithFakeThunk = ({
    store = configureStore(),
    ...moreProps
  }: { store?: Store } & RenderParams) => {
    const dispatch = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _fetchLinterMessagesIfNeeded = fakeThunk.createThunk;

    const root = render({ _fetchLinterMessagesIfNeeded, store, ...moreProps });

    return { _fetchLinterMessagesIfNeeded, dispatch, root, fakeThunk };
  };

  const _loadLinterResult = ({
    messages,
    path = 'lib/react.js',
    store,
  }: {
    messages: Partial<ExternalLinterMessage>[];
    path?: string;
    store: Store;
  }) => {
    const version = createInternalVersion({
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: { [path]: { ...fakeVersionEntry, path } },
        selected_file: path,
      },
    });

    const linterResult = createFakeExternalLinterResult({
      messages: messages.map((msg) => {
        return { ...msg, file: path };
      }),
    });

    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: linterResult,
      }),
    );

    return { linterResult, version };
  };

  it('calls loadData on construction', () => {
    const _loadData = jest.fn();

    render({ _loadData });

    expect(_loadData).toHaveBeenCalled();
  });

  it('calls loadData on update', () => {
    const _loadData = jest.fn();

    const root = render({ _loadData });

    _loadData.mockClear();
    // Simulate an update.
    root.setProps({});

    expect(_loadData).toHaveBeenCalledWith();
  });

  it('dispatches fetchLinterMessagesIfNeeded when linterMessages is undefined', () => {
    const url = '/path/to/validation.json';
    const version = createInternalVersion({
      ...fakeVersion,
      id: fakeVersion.id + 1,
      validation_url_json: url,
    });

    const {
      _fetchLinterMessagesIfNeeded,
      dispatch,
      fakeThunk,
    } = renderWithFakeThunk({
      version,
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchLinterMessagesIfNeeded).toHaveBeenCalledWith({
      versionId: version.id,
      url,
    });
  });

  it('does not dispatch fetchLinterMessagesIfNeeded after they have loaded', () => {
    const store = configureStore();
    const { version } = _loadLinterResult({
      store,
      messages: [{ uid: 'some-message-uid' }],
    });

    const { dispatch } = renderWithFakeThunk({ store, version });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchLinterMessagesIfNeeded if they have loaded but for another path', () => {
    const store = configureStore();

    const manifestPath = 'manifest.json';
    const libPath = 'lib/react.js';

    // Create a version where the manifestPath is selected.
    const version = createInternalVersion({
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: {
          [manifestPath]: { ...fakeVersionEntry, path: manifestPath },
          [libPath]: { ...fakeVersionEntry, path: libPath },
        },
        selected_file: manifestPath,
      },
    });

    // Create linter messages for libPath, which is not selected.
    const linterResult = createFakeExternalLinterResult({
      messages: [{ uid: 'some-message-uid', file: libPath }],
    });

    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: linterResult,
      }),
    );

    const { dispatch } = renderWithFakeThunk({ store, version });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('renders child content', () => {
    const className = 'childClassName';
    const root = render({
      children: jest.fn().mockReturnValue(<div className={className} />),
    });

    expect(root).toHaveClassName(className);
  });

  it('renders children with a LinterMessageMap', () => {
    const children = jest.fn();
    const store = configureStore();
    const { linterResult, version } = _loadLinterResult({
      store,
      messages: [{ uid: 'some-message-uid' }],
    });

    render({ children, store, version });

    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({
        messageMap: getMessageMap(linterResult),
      }),
    );
  });

  it('renders children with the selected message map', () => {
    const children = jest.fn();
    const store = configureStore();

    const path = 'script/background.js';
    const { linterResult, version } = _loadLinterResult({
      path,
      store,
      messages: [{ uid: 'some-message-uid' }],
    });

    render({ children, selectedPath: path, store, version });

    const map = getMessageMap(linterResult);
    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedMessageMap: map.byPath[path],
      }),
    );
  });

  it('renders children without a selected message map when none is selected', () => {
    const children = jest.fn();
    const store = configureStore();

    const manifestPath = 'manifest.json';
    const libPath = 'lib/react.js';

    // Create a version with manifestPath selected.
    const version = createInternalVersion({
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: {
          [manifestPath]: { ...fakeVersionEntry, path: manifestPath },
          [libPath]: { ...fakeVersionEntry, path: libPath },
        },
        selected_file: manifestPath,
      },
    });

    // Create a linter result with only one message related to libPath.
    const linterResult = createFakeExternalLinterResult({
      messages: [{ file: libPath, uid: 'linter-message-uid' }],
    });

    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: linterResult,
      }),
    );

    render({ children, store, version });

    // Since libPath is not selected, no messages will be mapped.
    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({
        messageMap: getMessageMap(linterResult),
        selectedMessageMap: null,
      }),
    );
  });

  it('renders children with an indication of loading state', () => {
    const children = jest.fn();
    const store = configureStore();

    const version = createInternalVersion(fakeVersion);
    store.dispatch(
      linterActions.beginFetchLinterResult({ versionId: version.id }),
    );

    render({ children, store, version });

    expect(children).toHaveBeenCalledWith({
      messageMap: undefined,
      messagesAreLoading: true,
      selectedMessageMap: undefined,
    });
  });

  it('renders children without a loading indicator after messages have loaded', () => {
    const children = jest.fn();
    const store = configureStore();
    const { version } = _loadLinterResult({
      store,
      messages: [{ uid: 'some-message-uid' }],
    });

    render({ children, store, version });

    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({
        messagesAreLoading: false,
      }),
    );
  });
});
