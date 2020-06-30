import * as React from 'react';
import { Store } from 'redux';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import configureStore from '../../configureStore';
import { TreefoldRenderPropsForFileTree } from '../FileTree';
import { actions as commentsActions } from '../../reducers/comments';
import {
  ExternalLinterMessage,
  createInternalMessage,
  getMessageMap,
} from '../../reducers/linter';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  actions as versionsActions,
  VersionEntryStatus,
} from '../../reducers/versions';
import {
  createExternalVersionWithEntries,
  createFakeExternalComment,
  createFakeExternalLinterResult,
  createFakeRef,
  createStoreWithVersion,
  fakeExternalLinterMessage,
  fakeVersionWithContent,
  shallowUntilTarget,
  simulateLinterProvider,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import FileTreeNode, {
  LINTER_KNOWN_LIBRARY_CODE,
  FileTreeNodeBase,
  PublicProps,
  findMostSevereTypeForPath,
  isKnownLibrary,
} from '.';

const fakeGetToggleProps = () => ({
  onClick: jest.fn(),
  onKeyDown: jest.fn(),
  role: 'button',
  tabIndex: 0,
});

type GetTreefoldRenderPropsParams = {
  id?: string;
  name?: string;
  onSelect?: PublicProps['onSelect'];
} & Partial<TreefoldRenderPropsForFileTree>;

// eslint-disable-next-line jest/no-export
export const getTreefoldRenderProps = ({
  getToggleProps = fakeGetToggleProps,
  hasChildNodes = false,
  id = 'root',
  isExpanded = false,
  isFolder = true,
  name = 'root',
  renderChildNodes = jest.fn(),
  onSelect = jest.fn(),
}: GetTreefoldRenderPropsParams = {}): TreefoldRenderPropsForFileTree & {
  onSelect: PublicProps['onSelect'];
} => {
  return {
    node: {
      id,
      name,
    },
    getToggleProps,
    hasChildNodes,
    isExpanded,
    isFolder,
    level: 0,
    renderChildNodes,
    onSelect,
  };
};

describe(__filename, () => {
  type RenderParams = { store?: Store } & Partial<PublicProps>;

  const render = ({
    versionId = 12349876,
    comparedToVersionId = 123,
    store = createStoreWithVersion({
      version: { ...fakeVersionWithContent, id: versionId },
    }),
    ...props
  }: RenderParams = {}) => {
    const allProps: PublicProps = {
      onSelect: () => undefined,
      versionId,
      comparedToVersionId,
      ...getTreefoldRenderProps(),
      ...props,
    };

    return shallowUntilTarget(
      <FileTreeNode {...allProps} />,
      FileTreeNodeBase,
      {
        shallowOptions: { context: { store } },
      },
    );
  };

  const _getMessageMap = (
    messages: Partial<ExternalLinterMessage>[] = [fakeExternalLinterMessage],
  ) => {
    return getMessageMap(createFakeExternalLinterResult({ messages }));
  };

  type RenderWithLinterProviderParams = Partial<LinterProviderInfo> &
    RenderParams;

  const renderWithLinterProvider = ({
    messageMap = undefined,
    messagesAreLoading = false,
    selectedMessageMap = undefined,
    ...renderParams
  }: RenderWithLinterProviderParams = {}) => {
    const root = render(renderParams);

    return simulateLinterProvider(root, {
      messageMap,
      messagesAreLoading,
      selectedMessageMap,
    });
  };

  const renderWithLinterMessages = ({
    messages = [fakeExternalLinterMessage],
    treefoldRenderProps = {},
  }) => {
    const externalVersion = fakeVersionWithContent;
    const comparedToVersionId = 22;
    const store = createStoreWithVersion({ version: externalVersion });
    store.dispatch(
      versionsActions.loadEntryStatusMap({
        version: externalVersion,
        comparedToVersionId,
      }),
    );
    const renderProps = getTreefoldRenderProps({
      id: externalVersion.file.selected_file,
      ...treefoldRenderProps,
    });

    return renderWithLinterProvider({
      messageMap: _getMessageMap(messages),
      ...renderProps,
      store,
      versionId: externalVersion.id,
      comparedToVersionId,
    });
  };

  const renderWithVersionEntries = (
    partialEntries: Parameters<typeof createExternalVersionWithEntries>[0],
    renderProps: RenderParams = {},
  ) => {
    const versionId = 321;
    const comparedToVersionId = 12;
    const externalVersion = createExternalVersionWithEntries(partialEntries, {
      id: versionId,
    });
    const store = createStoreWithVersion({ version: externalVersion });
    store.dispatch(
      versionsActions.loadEntryStatusMap({
        version: externalVersion,
        comparedToVersionId,
      }),
    );

    return renderWithLinterProvider({
      ...renderProps,
      store,
      versionId,
      comparedToVersionId,
    });
  };

  const renderWithComments = ({
    pathsWithComments = ['any-file.js'],
    ...renderProps
  }: {
    pathsWithComments?: string[];
  } & RenderWithLinterProviderParams = {}) => {
    const versionId = 987;
    const comparedToVersionId = null;

    const version = createExternalVersionWithEntries(
      pathsWithComments.map((p) => {
        return { path: p };
      }),
      {
        id: versionId,
      },
    );
    const store = createStoreWithVersion({ version });

    store.dispatch(
      versionsActions.loadEntryStatusMap({ version, comparedToVersionId }),
    );

    store.dispatch(
      commentsActions.setComments({
        versionId: version.id,
        comments: pathsWithComments.map((p) =>
          createFakeExternalComment({ filename: p }),
        ),
      }),
    );

    return renderWithLinterProvider({
      ...renderProps,
      store,
      versionId,
      comparedToVersionId,
    });
  };

  const renderVersionEntry = ({
    path = 'background.js',
    entryStatus = undefined,
  }: {
    path?: string;
    entryStatus?: VersionEntryStatus;
  }) => {
    return renderWithVersionEntries([{ path, status: entryStatus }], {
      // Link this node to the version entry.
      ...getTreefoldRenderProps({ id: path, name: path }),
    });
  };

  it('requires a loaded version', () => {
    const store = configureStore();
    expect(() =>
      render({ store, versionId: fakeVersionWithContent.id + 1 }),
    ).toThrow(/No version exists/);
  });

  it('renders a simple directory node', () => {
    const name = 'simple directory node';
    const getToggleProps = jest.fn();
    const renderProps = getTreefoldRenderProps({
      name,
      isFolder: true,
      getToggleProps,
    });

    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveLength(1);
    expect(root.find(`.${styles.node}`)).toIncludeText(name);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(1);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'folder');

    expect(getToggleProps).toHaveBeenCalled();
  });

  it('renders a simple node', () => {
    const name = 'simple node';
    const renderProps = getTreefoldRenderProps({ name, isFolder: false });

    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveLength(1);
    expect(root.find(`.${styles.node}`)).toIncludeText(name);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(0);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'file');
  });

  it('sets an onClick handler to a simple node', () => {
    const onSelect = jest.fn();
    const id = 'path/to/some/file.js';
    const renderProps = getTreefoldRenderProps({
      id,
      onSelect,
      isFolder: false,
    });

    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveProp('onClick');

    root.find(`.${styles.node}`).simulate('click');

    expect(onSelect).toHaveBeenCalledWith(id);
  });

  it('uses the onClick handler of the toggle props for a directory node', () => {
    const onSelect = jest.fn();
    const getToggleProps = fakeGetToggleProps();
    const renderProps = getTreefoldRenderProps({
      getToggleProps: () => getToggleProps,
      onSelect,
      isFolder: true,
    });

    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveProp('onClick');

    root.find(`.${styles.node}`).simulate('click');

    expect(onSelect).not.toHaveBeenCalled();
    expect(getToggleProps.onClick).toHaveBeenCalled();
  });

  it('renders an expanded node', () => {
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
    });
    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(1);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'folder-open');
  });

  it('displays a message when a folder is empty', () => {
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: false,
    });
    const root = renderWithLinterProvider(renderProps);

    expect(root.find(`.${styles.emptyNodeDirectory}`)).toHaveLength(1);
    expect(root.find(`.${styles.emptyNodeDirectory}`)).toIncludeText(
      'This folder is empty',
    );
  });

  it('does not call a function to render the child nodes of an expanded node when it has no child nodes', () => {
    const renderChildNodes = jest.fn();
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: false,
      renderChildNodes,
    });

    renderWithLinterProvider(renderProps);

    expect(renderChildNodes).not.toHaveBeenCalled();
  });

  it('calls a function to render the child nodes of an expanded node when it has child nodes', () => {
    const renderChildNodes = jest.fn();
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: true,
      renderChildNodes,
    });

    renderWithLinterProvider(renderProps);

    expect(renderChildNodes).toHaveBeenCalled();
  });

  it('marks a file node as selected', () => {
    const externalVersion = fakeVersionWithContent;
    const store = createStoreWithVersion({ version: externalVersion });

    const root = renderWithLinterProvider({
      store,
      versionId: externalVersion.id,
      ...getTreefoldRenderProps({ id: externalVersion.file.selected_file }),
    });

    expect(root.find(`.${styles.selected}`)).toHaveLength(1);
  });

  it('does not mark a file node as selected when it is not selected', () => {
    const root = renderWithLinterProvider({
      ...getTreefoldRenderProps({ id: 'not-the-selected-path' }),
    });

    expect(root.find(`.${styles.selected}`)).toHaveLength(0);
  });

  it.each([
    ['D', styles.wasDeleted],
    ['M', styles.wasModified],
    ['A', styles.wasAdded],
  ])('classifies a file with status %s as %s', (fileStatus, className) => {
    const path = 'scripts/background.js';
    const root = renderWithVersionEntries(
      [{ path, status: fileStatus as VersionEntryStatus }],
      {
        ...getTreefoldRenderProps({ id: path }),
      },
    );

    expect(root.find(`.${styles.nodeItem}`)).toHaveClassName(className);
  });

  it('handles directories with many file statuses', () => {
    const dirPath = 'scripts';
    const root = renderWithVersionEntries(
      [
        { path: `${dirPath}/background.js`, status: 'D' },
        { path: `${dirPath}/content.js`, status: 'M' },
      ],
      {
        ...getTreefoldRenderProps({ id: dirPath }),
      },
    );

    expect(root.find(`.${styles.nodeItem}`)).toHaveClassName(
      styles.wasModified,
    );
    expect(root.find(`.${styles.nodeItem}`)).not.toHaveClassName(
      styles.wasDeleted,
    );
  });

  it('does not classify files with an undefined status', () => {
    const path = 'scripts/background.js';
    const root = renderWithVersionEntries([{ path, status: undefined }], {
      ...getTreefoldRenderProps({ id: path }),
    });

    expect(root.find(`.${styles.nodeItem}`)).not.toHaveClassName(
      styles.wasAdded,
    );
    expect(root.find(`.${styles.nodeItem}`)).not.toHaveClassName(
      styles.wasModified,
    );
    expect(root.find(`.${styles.nodeItem}`)).not.toHaveClassName(
      styles.wasDeleted,
    );
  });

  it('adds a comment icon for a file', () => {
    const path = 'scripts/background.js';

    const root = renderWithComments({
      pathsWithComments: [path],
      ...getTreefoldRenderProps({ id: path, isFolder: false }),
    });

    const icons = root.find(`.${styles.nodeIcons}`).find(FontAwesomeIcon);
    expect(icons).toHaveLength(1);

    const icon = icons.at(0);
    expect(icon.key()).toEqual('comments-icon');
    expect(icon).toHaveProp('title', 'This file has comments');
  });

  it('adds a comment icon for a directory', () => {
    const dir = 'scripts';
    const path = `${dir}/background.js`;

    const root = renderWithComments({
      pathsWithComments: [path],
      ...getTreefoldRenderProps({ id: dir, isFolder: true }),
    });

    const icons = root.find(`.${styles.nodeIcons}`).find(FontAwesomeIcon);
    expect(icons).toHaveLength(1);

    const icon = icons.at(0);
    expect(icon.key()).toEqual('comments-icon');
    expect(icon).toHaveProp(
      'title',
      'This directory contains files with comments',
    );
  });

  it('adds a linter and comment icon for a file', () => {
    const path = 'scripts/background.js';

    const root = renderWithComments({
      messageMap: _getMessageMap([
        {
          ...fakeExternalLinterMessage,
          file: path,
          type: 'error',
        },
      ]),
      pathsWithComments: [path],
      ...getTreefoldRenderProps({ id: path }),
    });

    const icons = root.find(`.${styles.nodeIcons}`).find(FontAwesomeIcon);
    expect(icons).toHaveLength(2);

    expect(icons.at(0).key()).toEqual('linter-icon');
    expect(icons.at(1).key()).toEqual('comments-icon');
  });

  it('adds a title to the node name', () => {
    const path = 'background.js';
    const root = renderVersionEntry({ path, entryStatus: undefined });

    expect(root.find(`.${styles.nodeName}`)).toHaveProp(
      'title',
      `View ${path}`,
    );
  });

  it('adds a title to a deleted node', () => {
    const root = renderVersionEntry({ entryStatus: 'D' });

    expect(root.find(`.${styles.nodeName}`)).toHaveProp(
      'title',
      expect.stringMatching(/\(deleted\)$/),
    );
  });

  it('adds a title to a modified node', () => {
    const root = renderVersionEntry({ entryStatus: 'M' });

    expect(root.find(`.${styles.nodeName}`)).toHaveProp(
      'title',
      expect.stringMatching(/\(modified\)$/),
    );
  });

  it('adds a title to an added node', () => {
    const root = renderVersionEntry({ entryStatus: 'A' });

    expect(root.find(`.${styles.nodeName}`)).toHaveProp(
      'title',
      expect.stringMatching(/\(added\)$/),
    );
  });

  it('does not adjust the title for additional types of nodes', () => {
    const path = 'background.js';
    const root = renderVersionEntry({ path, entryStatus: 'C' });

    expect(root.find(`.${styles.nodeName}`)).toHaveProp(
      'title',
      `View ${path}`,
    );
  });

  it.each([
    ['error', `.${styles.hasLinterErrors}`, 'times-circle'],
    ['notice', `.${styles.hasLinterMessages}`, 'info-circle'],
    ['warning', `.${styles.hasLinterWarnings}`, 'exclamation-triangle'],
  ])('renders a file node that has linter %ss', (type, className, icon) => {
    const message = {
      ...fakeExternalLinterMessage,
      file: 'manifest.json',
      type: type as ExternalLinterMessage['type'],
    };

    const root = renderWithLinterMessages({
      messages: [message],
      treefoldRenderProps: {
        isFolder: false,
      },
    });

    expect(root.find(className)).toHaveLength(1);

    const nodeIcons = root.find(`.${styles.nodeIcons}`);
    expect(nodeIcons).toHaveLength(1);
    expect(nodeIcons.find(FontAwesomeIcon)).toHaveProp('icon', icon);
    expect(nodeIcons.find(FontAwesomeIcon).prop('title')).toMatch(
      new RegExp(`file contains linter ${type}s`),
    );
  });

  it.each([
    ['error', `.${styles.hasLinterErrors}`, 'times-circle'],
    ['notice', `.${styles.hasLinterMessages}`, 'info-circle'],
    ['warning', `.${styles.hasLinterWarnings}`, 'exclamation-triangle'],
  ])(
    'renders a directory node that has linter %ss',
    (type, className, icon) => {
      const message = {
        ...fakeExternalLinterMessage,
        file: 'src',
        type: type as ExternalLinterMessage['type'],
      };

      const root = renderWithLinterMessages({
        messages: [message],
        treefoldRenderProps: {
          id: message.file,
          isFolder: true,
        },
      });

      expect(root.find(className)).toHaveLength(1);

      const nodeIcons = root.find(`.${styles.nodeIcons}`);
      expect(nodeIcons).toHaveLength(1);
      expect(nodeIcons.find(FontAwesomeIcon)).toHaveProp('icon', icon);
      expect(nodeIcons.find(FontAwesomeIcon).prop('title')).toMatch(
        new RegExp(`contains files with linter ${type}s`),
      );
    },
  );

  it('ignores linter messages unrelated to the current node', () => {
    const message = {
      ...fakeExternalLinterMessage,
      file: 'manifest.json',
    };

    const root = renderWithLinterMessages({
      messages: [message],
      treefoldRenderProps: {
        id: 'some/other/file.js',
      },
    });

    expect(root.find(`.${styles.hasLinterMessages}`)).toHaveLength(0);
  });

  it('indicates when a directory node contains a file that has linter messages', () => {
    const message = {
      ...fakeExternalLinterMessage,
      file: 'src/manifest.json',
    };

    const root = renderWithLinterMessages({
      messages: [message],
      treefoldRenderProps: {
        id: 'src/',
        isFolder: true,
      },
    });

    expect(root.find(`.${styles.hasLinterMessages}`)).toHaveLength(1);
  });

  it('renders a file node that is a known library', () => {
    const message: ExternalLinterMessage = {
      ...fakeExternalLinterMessage,
      file: 'jquery.js',
      id: [LINTER_KNOWN_LIBRARY_CODE],
      line: null,
      type: 'notice',
    };

    const root = renderWithLinterMessages({
      messages: [message],
      treefoldRenderProps: {
        id: message.file,
        isFolder: false,
      },
    });

    expect(root.find(`.${styles.isKnownLibrary}`)).toHaveLength(1);

    const nodeIcons = root.find(`.${styles.nodeIcons}`);
    expect(nodeIcons).toHaveLength(1);
    expect(nodeIcons.find(FontAwesomeIcon)).toHaveProp('icon', 'check-circle');
    expect(nodeIcons.find(FontAwesomeIcon).prop('title')).toMatch(
      /known library/,
    );
  });

  it('does not override a more severe type when a file node is a known library with several linter messages', () => {
    const file = 'jquery.js';
    const messages: ExternalLinterMessage[] = [
      {
        ...fakeExternalLinterMessage,
        file,
        id: [LINTER_KNOWN_LIBRARY_CODE],
        line: null,
        type: 'notice',
      },
      {
        ...fakeExternalLinterMessage,
        file,
        type: 'error',
      },
    ];

    const root = renderWithLinterMessages({
      messages,
      treefoldRenderProps: {
        id: file,
        isFolder: false,
      },
    });

    expect(root.find(`.${styles.isKnownLibrary}`)).toHaveLength(0);
    expect(root.find(`.${styles.hasLinterErrors}`)).toHaveLength(1);
  });

  describe('findMostSevereTypeForPath', () => {
    it('returns null when the map is empty', () => {
      const map = _getMessageMap([]);

      const type = findMostSevereTypeForPath(map, 'file.js');

      expect(type).toEqual(null);
    });

    it('returns null when the path is not found', () => {
      const message = { ...fakeExternalLinterMessage, file: 'file.js' };
      const map = _getMessageMap([message]);

      const type = findMostSevereTypeForPath(map, 'other-path');

      expect(type).toEqual(null);
    });

    it('returns the most severe type given a directory path', () => {
      const path = 'src';
      const message = { ...fakeExternalLinterMessage, file: `${path}/file.js` };
      const map = _getMessageMap([message]);

      // This uses a real implementation of findMostSevereType to make
      // sure the return value is passed through.
      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(message.type);
    });

    it('passes all messages for a directory path to findMostSevereType', () => {
      const path = 'src';

      const messages = [
        { ...fakeExternalLinterMessage, file: `${path}/file-1.js` },
        { ...fakeExternalLinterMessage, file: `${path}/file-2.js` },
        { ...fakeExternalLinterMessage, file: 'other/directory/file-3.js' },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const _findMostSevereType = jest.fn();
      findMostSevereTypeForPath(map, path, { _findMostSevereType });

      expect(_findMostSevereType).toHaveBeenCalledWith([
        createInternalMessage(messages[0]),
        createInternalMessage(messages[1]),
      ]);
    });

    it('passes all messages for an exact path to findMostSevereType', () => {
      const path = 'src/file-1.js';

      const messages = [
        { ...fakeExternalLinterMessage, file: path },
        { ...fakeExternalLinterMessage, file: path },
        { ...fakeExternalLinterMessage, file: 'other-path-to-file.js' },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const _findMostSevereType = jest.fn();
      findMostSevereTypeForPath(map, path, { _findMostSevereType });

      expect(_findMostSevereType).toHaveBeenCalledWith([
        createInternalMessage(messages[0]),
        createInternalMessage(messages[1]),
      ]);
    });

    it('passes global and line messages to findMostSevereType', () => {
      const path = 'src/file-1.js';

      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          // Make this a global message.
          line: null,
          uid: 'global-uid-example',
        },
        {
          ...fakeExternalLinterMessage,
          file: path,
          // Make this a line message.
          line: 123,
          uid: 'line-uid-example',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const _findMostSevereType = jest.fn();
      findMostSevereTypeForPath(map, path, { _findMostSevereType });

      expect(_findMostSevereType).toHaveBeenCalledWith([
        createInternalMessage(messages[0]),
        createInternalMessage(messages[1]),
      ]);
    });

    it('does not check general messages', () => {
      const messages = [
        {
          ...fakeExternalLinterMessage,
          // Make this a general message.
          file: null,
          line: null,
          uid: 'general-uid-example',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(findMostSevereTypeForPath(map, 'src/file-1.js')).toEqual(null);
    });
  });

  it('configures LinterProvider', () => {
    const externalVersion = fakeVersionWithContent;
    const store = createStoreWithVersion({ version: externalVersion });
    const root = render({ store, versionId: externalVersion.id });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', externalVersion.id);
    expect(provider).toHaveProp(
      'validationURL',
      externalVersion.validation_url_json,
    );
    expect(provider).toHaveProp(
      'selectedPath',
      externalVersion.file.selected_file,
    );
  });

  it('executes node scrolling helper on mount', () => {
    const _scrollIntoViewIfNeeded = jest.fn();

    render({ _scrollIntoViewIfNeeded });

    expect(_scrollIntoViewIfNeeded).toHaveBeenCalled();
  });

  it('executes node scrolling helper on update', () => {
    const _scrollIntoViewIfNeeded = jest.fn();

    const root = render({ _scrollIntoViewIfNeeded });
    _scrollIntoViewIfNeeded.mockClear();
    root.setProps({});

    expect(_scrollIntoViewIfNeeded).toHaveBeenCalled();
  });

  it('focuses a node when selected and not already in focus', () => {
    const externalVersion = fakeVersionWithContent;
    const nodeId = externalVersion.file.selected_file;

    const store = createStoreWithVersion({ version: externalVersion });
    const fakeRef = createFakeRef({ scrollIntoView: jest.fn() });
    // Make sure the path is not in focus.
    store.dispatch(
      versionsActions.setVisibleSelectedPath({
        path: null,
        versionId: externalVersion.id,
      }),
    );

    const dispatch = spyOn(store, 'dispatch');

    render({
      // Render the selected path.
      ...getTreefoldRenderProps({ id: nodeId }),
      createNodeRef: () => fakeRef,
      store,
      versionId: externalVersion.id,
    });

    expect(fakeRef.current.scrollIntoView).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.setVisibleSelectedPath({
        path: nodeId,
        versionId: externalVersion.id,
      }),
    );
  });

  it('does not focus a node when not selected', () => {
    const versionId = 8765;
    const store = createStoreWithVersion({
      version: { ...fakeVersionWithContent, id: versionId },
    });
    // Make sure the path is not in focus.
    store.dispatch(
      versionsActions.setVisibleSelectedPath({ path: null, versionId }),
    );
    const fakeRef = createFakeRef({ scrollIntoView: jest.fn() });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getTreefoldRenderProps({ id: 'any-other-file.js' }),
      createNodeRef: () => fakeRef,
      versionId,
      store,
    });

    expect(fakeRef.current.scrollIntoView).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not focus a node when selected and already in focus', () => {
    const externalVersion = fakeVersionWithContent;
    const store = createStoreWithVersion({ version: externalVersion });
    const nodeId = externalVersion.file.selected_file;

    // Focus the path.
    store.dispatch(
      versionsActions.setVisibleSelectedPath({
        path: nodeId,
        versionId: externalVersion.id,
      }),
    );
    const fakeRef = createFakeRef({ scrollIntoView: jest.fn() });
    const dispatch = spyOn(store, 'dispatch');

    render({
      ...getTreefoldRenderProps({ id: nodeId }),
      createNodeRef: () => fakeRef,
      versionId: externalVersion.id,
      store,
    });

    expect(fakeRef.current.scrollIntoView).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('configures ListGroup.Item with a custom div', () => {
    const root = renderWithLinterProvider();

    const itemShell = root.find(ListGroup.Item);
    const createItem = itemShell.renderProp('as');

    // Make sure the custom element renders arbitrary props.
    const className = 'Example';
    const item = createItem({ className });

    expect(item).toHaveClassName(className);
  });

  describe('isKnownLibrary', () => {
    it('returns false when there is no linter message', () => {
      const path = 'jquery.js';
      const messages = [] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(false);
    });

    it('returns false when there is more than one global message', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          id: [LINTER_KNOWN_LIBRARY_CODE],
          line: null,
          type: 'notice',
        },
        {
          ...fakeExternalLinterMessage,
          file: path,
          line: null,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(false);
    });

    it('returns false when there are inlined linter messages', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          id: [LINTER_KNOWN_LIBRARY_CODE],
          line: null,
          type: 'notice',
        },
        {
          ...fakeExternalLinterMessage,
          file: path,
          line: 123,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(false);
    });

    it('returns false when there are only inlined linter messages', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          line: 123,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(false);
    });

    it('returns false when a path is not a known library', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          id: ['another_code'],
          line: null,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(false);
    });

    it('returns false when another path is a known library', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          id: [LINTER_KNOWN_LIBRARY_CODE],
          line: null,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, 'not-the-same-path')).toEqual(false);
    });

    it('returns true when a path is a known library', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          id: [LINTER_KNOWN_LIBRARY_CODE],
          line: null,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      expect(isKnownLibrary(map, path)).toEqual(true);
    });

    it('calls getMessagesForPath to validate the messages for unexpected keys', () => {
      const path = 'jquery.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          line: 123,
          type: 'notice',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);
      const _getMessagesForPath = jest.fn().mockReturnValue([map.byPath[path]]);

      isKnownLibrary(map, path, _getMessagesForPath);
      expect(_getMessagesForPath).toHaveBeenCalledWith(map.byPath[path]);
    });
  });
});
