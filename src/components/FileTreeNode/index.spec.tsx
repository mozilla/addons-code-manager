import * as React from 'react';
import { shallow } from 'enzyme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { TreefoldRenderPropsForFileTree } from '../FileTree';
import { createInternalVersion } from '../../reducers/versions';
import { ExternalLinterMessage, getMessageMap } from '../../reducers/linter';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  createFakeExternalLinterResult,
  fakeExternalLinterMessage,
  fakeVersion,
  simulateLinterProvider,
} from '../../test-helpers';
import styles from './styles.module.scss';

import FileTreeNode, {
  LINTER_KNOWN_LIBRARY_CODE,
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
  type RenderParams = Partial<PublicProps>;

  const render = ({
    version = createInternalVersion(fakeVersion),
    ...props
  }: RenderParams = {}) => {
    const allProps: PublicProps = {
      onSelect: () => undefined,
      version,
      ...getTreefoldRenderProps(),
      ...props,
    };

    return shallow(<FileTreeNode {...allProps} />);
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
    version = createInternalVersion(fakeVersion),
    messages = [fakeExternalLinterMessage],
    treefoldRenderProps = {},
  }) => {
    const renderProps = getTreefoldRenderProps({
      id: version.selectedPath,
      ...treefoldRenderProps,
    });

    return renderWithLinterProvider({
      messageMap: _getMessageMap(messages),
      version,
      ...renderProps,
    });
  };

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
    const version = createInternalVersion(fakeVersion);

    const root = renderWithLinterProvider({
      ...getTreefoldRenderProps({ id: version.selectedPath }),
      version,
    });

    expect(root.find(`.${styles.selected}`)).toHaveLength(1);
  });

  it('does not mark a file node as selected when it is not selected', () => {
    const root = renderWithLinterProvider({
      ...getTreefoldRenderProps({ id: 'not-the-selected-path' }),
      version: createInternalVersion(fakeVersion),
    });

    expect(root.find(`.${styles.selected}`)).toHaveLength(0);
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
      const path = 'file.js';
      const map = _getMessageMap([]);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(null);
    });

    it('returns the type of the message when there is only one message and a path', () => {
      const path = 'file.js';
      const message = { ...fakeExternalLinterMessage, file: path };
      const map = _getMessageMap([message]);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(message.type);
    });

    it('returns null when the path is not found', () => {
      const path = 'file.js';
      const message = { ...fakeExternalLinterMessage, file: path };
      const map = _getMessageMap([message]);

      const type = findMostSevereTypeForPath(map, 'other-path');

      expect(type).toEqual(null);
    });

    it('returns the most severe type given a directory path', () => {
      const path = 'src';
      const message = { ...fakeExternalLinterMessage, file: `${path}/file.js` };
      const map = _getMessageMap([message]);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(message.type);
    });

    it('returns the most severe type given a map of messages and a directory path', () => {
      const path = 'src';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: `${path}/file-1.js`,
          type: 'warning',
        },
        {
          ...fakeExternalLinterMessage,
          file: `${path}/file-2.js`,
          type: 'error',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(messages[1].type);
    });

    it('returns the most severe type given a map of messages for the same exact path', () => {
      const path = 'src/file-1.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          type: 'warning',
        },
        {
          ...fakeExternalLinterMessage,
          file: path,
          type: 'error',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(messages[1].type);
    });

    it('returns the most severe type given a map of messages and a fully qualified file path', () => {
      const path = 'src/file-1.js';
      const messages = [
        {
          ...fakeExternalLinterMessage,
          file: path,
          type: 'warning',
        },
        {
          ...fakeExternalLinterMessage,
          file: `src/file-2.js`,
          type: 'error',
        },
      ] as ExternalLinterMessage[];
      const map = _getMessageMap(messages);

      const type = findMostSevereTypeForPath(map, path);

      expect(type).toEqual(messages[0].type);
    });
  });

  it('configures LinterProvider', () => {
    const version = createInternalVersion(fakeVersion);
    const root = render({ version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', version.selectedPath);
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

    it('throws an error if an extra key is found in the linter message map', () => {
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

      const unexpectedKey = 'future';
      // Artifically inject a new key in the message map.
      // @ts-ignore
      map[path][unexpectedKey] = {};

      expect(() => {
        isKnownLibrary(map, path);
      }).toThrow(new RegExp(`Unexpected key "${unexpectedKey}" found`));
    });
  });
});
