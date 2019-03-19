import * as React from 'react';
import { Store } from 'redux';

import {
  createFakeExternalLinterResult,
  createFakeHistory,
  createFakeThunk,
  fakeExternalLinterMessage,
  fakeExternalLinterResult,
  fakeVersion,
  fakeVersionFile,
  fakeVersionEntry,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import configureStore from '../../configureStore';
import {
  ExternalLinterMessage,
  ExternalLinterResult,
  actions as linterActions,
  createInternalMessage,
  getMessageMap,
} from '../../reducers/linter';
import {
  ExternalVersionWithContent,
  actions as versionActions,
  createInternalVersion,
  getVersionFile,
} from '../../reducers/versions';
import FileTree from '../../components/FileTree';
import LinterMessage from '../../components/LinterMessage';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import FileMetadata from '../../components/FileMetadata';

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

  const globalExternalMessage = (props = {}) => {
    return {
      ...fakeExternalLinterMessage,
      ...props,
      // When a message isn't associated with a line, it's global.
      column: null,
      line: null,
    };
  };

  type RenderParams = {
    _fetchLinterMessages?: PublicProps['_fetchLinterMessages'];
    _fetchVersion?: PublicProps['_fetchVersion'];
    _fetchVersionFile?: PublicProps['_fetchVersionFile'];
    _log?: PublicProps['_log'];
    addonId?: string;
    versionId?: string;
    store?: Store;
  };

  const render = ({
    _fetchLinterMessages,
    _fetchVersion,
    _fetchVersionFile,
    _log,
    addonId = '999',
    versionId = '123',
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({ params: { addonId, versionId } }),
      _fetchLinterMessages,
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

  const _loadVersionAndFile = ({
    store = configureStore(),
    version = fakeVersion,
  }) => {
    store.dispatch(versionActions.loadVersionInfo({ version }));
    store.dispatch(
      versionActions.loadVersionFile({
        path: version.file.selected_file,
        version,
      }),
    );
  };

  const renderAndUpdateWithVersion = ({
    store = configureStore(),
    version,
  }: {
    store?: Store;
    version: ExternalVersionWithContent;
  }) => {
    const fakeThunk = createFakeThunk();
    const _fetchLinterMessages = fakeThunk.createThunk;

    _loadVersionAndFile({ store, version });
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      _fetchLinterMessages,
      store,
      versionId: String(version.id),
    });

    dispatch.mockClear();

    // Simulate an update.
    root.setProps({});

    return { dispatch, _fetchLinterMessages, version, fakeThunk };
  };

  const renderWithMessages = ({
    externalMessages = [],
    path,
    result,
    versionId,
  }: {
    externalMessages?: ExternalLinterMessage[];
    path: string;
    result?: ExternalLinterResult;
    versionId?: string;
  }) => {
    const store = configureStore();

    // Prepare a result with all messages for the selected file.
    const externalResult =
      result ||
      createFakeExternalLinterResult({
        messages: externalMessages.map((msg) => {
          if (msg.file !== path) {
            throw new Error(
              `message uid:${msg.uid} has file "${
                msg.file
              }" but needs to have "${path}"`,
            );
          }
          return msg;
        }),
      });

    const version = {
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: { [path]: { ...fakeVersionEntry, path } },
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file: path,
      },
    };

    _loadVersionAndFile({ store, version });

    // Simulate selecting the file to render.
    store.dispatch(
      versionActions.updateSelectedPath({
        selectedPath: path,
        versionId: version.id,
      }),
    );
    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: externalResult,
      }),
    );

    return render({ versionId: versionId || String(version.id), store });
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
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileTree)).toHaveLength(1);
    expect(root.find(FileTree)).toHaveProp(
      'version',
      createInternalVersion(version),
    );
  });

  it('renders a FileMetadata component when a version file has loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(FileMetadata)).toHaveLength(1);
    expect(root.find(FileMetadata)).toHaveProp(
      'file',
      getVersionFile(
        store.getState().versions,
        version.id,
        version.file.selected_file,
      ),
    );
  });

  it('renders the content of the default file when a version has been loaded', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(CodeView)).toHaveLength(1);
  });

  it('renders a loading message when we do not have the content of a file yet', () => {
    const version = fakeVersion;

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    // The user clicks a different file to view.
    store.dispatch(
      versionActions.updateSelectedPath({
        selectedPath: 'some/file.js',
        versionId: version.id,
      }),
    );

    const root = render({ store, versionId: String(version.id) });

    expect(root.find(CodeView)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp('message', 'Loading content...');
  });

  it('dispatches fetchVersion() on mount', () => {
    const addonId = 123456;
    const version = fakeVersion;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersion = fakeThunk.createThunk;

    render({
      _fetchVersion,
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersion).toHaveBeenCalledWith({
      addonId,
      versionId: version.id,
    });
  });

  it('dispatches fetchLinterMessages() when receiving a version', () => {
    const version = { ...fakeVersion, id: fakeVersion.id + 1 };
    const {
      dispatch,
      _fetchLinterMessages,
      fakeThunk,
    } = renderAndUpdateWithVersion({ version });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchLinterMessages).toHaveBeenCalledWith({
      versionId: version.id,
      url: createInternalVersion(version).validationURL,
    });
  });

  it('does not dispatch fetchLinterMessages() without a version', () => {
    const fakeThunk = createFakeThunk();
    const _fetchLinterMessages = fakeThunk.createThunk;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ _fetchLinterMessages, store });

    dispatch.mockClear();

    // Simulate an update.
    root.setProps({});

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchLinterMessages() if linter messages have loaded', () => {
    const version = { ...fakeVersion, id: fakeVersion.id + 1 };
    const store = configureStore();
    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: fakeExternalLinterResult,
      }),
    );
    const { dispatch } = renderAndUpdateWithVersion({ store, version });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch fetchLinterMessages() when linter messages are loading', () => {
    const version = { ...fakeVersion, id: fakeVersion.id + 1 };
    const store = configureStore();
    store.dispatch(
      linterActions.beginFetchLinterResult({ versionId: version.id }),
    );
    const { dispatch } = renderAndUpdateWithVersion({ version, store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches fetchVersionFile() when a file is selected', () => {
    const addonId = 123456;
    const version = fakeVersion;
    const path = 'some-path';

    const store = configureStore();
    _loadVersionAndFile({ store, version });

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionFile = fakeThunk.createThunk;

    const root = render({
      _fetchVersionFile,
      store,
      addonId: String(addonId),
      versionId: String(version.id),
    });

    const fileTree = root.find(FileTree);
    expect(fileTree).toHaveProp('onSelect');

    const onSelectFile = fileTree.prop('onSelect');
    onSelectFile(path);

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionFile).toHaveBeenCalledWith({
      addonId,
      versionId: version.id,
      path,
    });
  });

  it('renders a global LinterMessage', () => {
    const path = 'lib/react.js';
    const externalMessage = globalExternalMessage({ file: path });

    const root = renderWithMessages({
      path,
      externalMessages: [externalMessage],
    });

    const message = root.find(LinterMessage);
    expect(message).toHaveLength(1);
    expect(message).toHaveProp(
      'message',
      createInternalMessage(externalMessage),
    );
  });

  it('renders all global LinterMessage components', () => {
    const firstUid = 'first-uid';
    const secondUid = 'second-uid';

    const path = 'lib/react.js';
    const root = renderWithMessages({
      path,
      externalMessages: [
        globalExternalMessage({ uid: firstUid, file: path }),
        globalExternalMessage({ uid: secondUid, file: path }),
      ],
    });

    const message = root.find(LinterMessage);
    expect(message).toHaveLength(2);
    expect(message.at(0).prop('message')).toMatchObject({ uid: firstUid });
    expect(message.at(1).prop('message')).toMatchObject({ uid: secondUid });
  });

  it('ignores global messages for the wrong version', () => {
    const path = 'lib/react.js';

    const root = renderWithMessages({
      path,
      externalMessages: [globalExternalMessage({ file: path })],
      // Render an unrelated version.
      versionId: '432132',
    });

    const message = root.find(LinterMessage);
    expect(message).toHaveLength(0);
  });

  it('ignores global messages for the wrong file', () => {
    const result = createFakeExternalLinterResult({
      messages: [
        // Define a message for an unrelated file.
        globalExternalMessage({ file: 'scripts/background.js' }),
      ],
    });

    const root = renderWithMessages({
      // Render this as the selected file path.
      path: 'lib/react.js',
      result,
    });

    const message = root.find(LinterMessage);
    expect(message).toHaveLength(0);
  });

  it('passes LinterMessagesByLine to CodeView', () => {
    const path = 'lib/react.js';
    const externalMessage = {
      ...fakeExternalLinterMessage,
      file: path,
      line: 1,
    };

    const result = createFakeExternalLinterResult({
      messages: [externalMessage],
    });

    const root = renderWithMessages({ path, result });

    const code = root.find(CodeView);
    expect(code).toHaveLength(1);
    expect(code).toHaveProp(
      'linterMessagesByLine',
      getMessageMap(result)[path].byLine,
    );
  });

  it('does not pass LinterMessagesByLine to CodeView if files do not match', () => {
    const result = createFakeExternalLinterResult({
      messages: [
        {
          ...fakeExternalLinterMessage,
          // Define a message for an unrelated file.
          file: 'scripts/background.js',
          line: 1,
        },
      ],
    });

    const root = renderWithMessages({
      // Render this as the selected file path.
      path: 'lib/react.js',
      result,
    });

    const code = root.find(CodeView);
    expect(code).toHaveLength(1);
    expect(code).toHaveProp('linterMessagesByLine', undefined);
  });
});
