import * as React from 'react';
import { Store } from 'redux';
import { ShallowWrapper, shallow } from 'enzyme';

import configureStore from '../../configureStore';
import { AccordionItem } from '../AccordionMenu';
import CodeOverview from '../CodeOverview';
import FileMetadata from '../FileMetadata';
import FileTree from '../FileTree';
import ContentShell, { PanelAttribs } from '../FullscreenGrid/ContentShell';
import KeyboardShortcuts from '../KeyboardShortcuts';
import LinterMessage from '../LinterMessage';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import Loading from '../Loading';
import { getMessageMap } from '../../reducers/linter';
import {
  ExternalVersionEntry,
  actions as versionsActions,
  getVersionFile,
  getVersionInfo,
} from '../../reducers/versions';
import {
  createFakeCompareInfo,
  createFakeEntry,
  createFakeExternalLinterResult,
  fakeExternalLinterMessage,
  fakeVersion,
  fakeVersionEntry,
  getContentShellPanel,
  simulateLinterProvider,
} from '../../test-helpers';

import VersionFileViewer, { ItemTitles, PublicProps } from '.';

describe(__filename, () => {
  const getInternalVersionAndFile = ({
    store = configureStore(),
    path = 'background.js',
    entry,
    fileContent = 'example file content',
  }: {
    store?: Store;
    path?: string;
    entry?: ExternalVersionEntry;
    fileContent?: string;
  } = {}) => {
    // TODO: add a real createInternalVersionFile().
    // See https://github.com/mozilla/addons-code-manager/issues/685
    //
    // After that this could simply be:
    // return {
    //   version: createInternalVersion(...),
    //   file: createInternalVersionFile(...),
    // };
    const version = {
      ...fakeVersion,
      file: {
        ...fakeVersion.file,
        content: fileContent,
        entries: {
          ...fakeVersion.file.entries,
          [path]: entry || { ...fakeVersionEntry, filename: path, path },
        },
        // eslint-disable-next-line @typescript-eslint/camelcase
        selected_file: path,
      },
    };
    store.dispatch(versionsActions.loadVersionInfo({ version }));
    store.dispatch(versionsActions.loadVersionFile({ path, version }));

    const versionsState = store.getState().versions;

    const internalVersion = getVersionInfo(versionsState, version.id);
    if (!internalVersion) {
      throw new Error(
        `Unexpectedly could not retrieve version from state for id=${version.id}`,
      );
    }

    const file = getVersionFile(versionsState, version.id, path);
    if (!file) {
      throw new Error(
        `Unexpectedly could not retrieve version file from state for id=${version.id}, path=${path}`,
      );
    }

    return { version: internalVersion, file };
  };

  type RenderParams = Partial<PublicProps>;

  const render = (moreProps: RenderParams = {}) => {
    const selectedPath = 'select.js';
    const { file, version } = getInternalVersionAndFile({ path: selectedPath });
    const props = {
      children: <div />,
      comparedToVersionId: null,
      file,
      onSelectFile: jest.fn(),
      selectedPath,
      version,
      ...moreProps,
    };

    return shallow(<VersionFileViewer {...props} />);
  };

  const renderWithLinterProvider = (
    params: RenderParams = {},
    info?: Partial<LinterProviderInfo>,
  ) => {
    return simulateLinterProvider(render(params), info);
  };

  const renderPanel = (params: RenderParams = {}, panel: PanelAttribs) => {
    const root = renderWithLinterProvider(params);
    return getContentShellPanel(root, panel);
  };

  const getAccordionItem = (root: ShallowWrapper, title: ItemTitles) => {
    return root
      .find(AccordionItem)
      .filterWhere((c) => c.prop('title') === title);
  };

  it('renders children', () => {
    const childClass = 'ExampleClass';
    const root = renderWithLinterProvider({
      children: <div className={childClass} />,
    });

    expect(root.find(`.${childClass}`)).toHaveLength(1);
  });

  it('renders a placeholder without a version', () => {
    const childClass = 'ExampleClass';
    const root = render({
      children: <div className={childClass} />,
      version: null,
    });

    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(`.${childClass}`)).toHaveLength(0);
  });

  it('renders a FileTree component', () => {
    const onSelectFile = jest.fn();
    const { version } = getInternalVersionAndFile();
    const comparedToVersionId = 11;

    const root = renderPanel(
      { onSelectFile, version, comparedToVersionId },
      PanelAttribs.mainSidePanel,
    );

    const tree = root.find(FileTree);
    expect(tree).toHaveLength(1);
    expect(tree).toHaveProp('onSelect', onSelectFile);
    expect(tree).toHaveProp('versionId', version.id);
    expect(tree).toHaveProp('comparedToVersionId', comparedToVersionId);
  });

  it('shows an information panel by default', () => {
    const { file } = getInternalVersionAndFile();
    const root = renderPanel({ file }, PanelAttribs.mainSidePanel);
    const item = getAccordionItem(root, ItemTitles.Information);

    const meta = item.find(FileMetadata);
    expect(meta).toHaveProp('file', file);
  });

  it('renders a placeholder in the information panel without a file', () => {
    const root = renderPanel({ file: null }, PanelAttribs.mainSidePanel);
    const item = getAccordionItem(root, ItemTitles.Information);

    expect(item.find(FileMetadata)).toHaveLength(0);
    expect(item.find(Loading)).toHaveLength(1);
  });

  it('configures LinterProvider', () => {
    const selectedPath = 'sel.js';
    const { version } = getInternalVersionAndFile();
    const compareInfo = createFakeCompareInfo();
    const root = render({ compareInfo, selectedPath, version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', selectedPath);
  });

  it('does not configure LinterProvider without a version', () => {
    const root = render({ version: null });

    expect(root.find(LinterProvider)).toHaveLength(0);
  });

  it('renders a KeyboardShortcuts panel', () => {
    const { version } = getInternalVersionAndFile();
    const compareInfo = createFakeCompareInfo();
    const comparedToVersionId = 41;
    const selectedPath = 'newPath.js';

    const messageMap = getMessageMap(
      createFakeExternalLinterResult({ messages: [fakeExternalLinterMessage] }),
    );

    const root = renderWithLinterProvider(
      { compareInfo, comparedToVersionId, selectedPath, version },
      { messageMap },
    );

    const shortcuts = getContentShellPanel(
      root,
      PanelAttribs.mainSidePanel,
    ).find(KeyboardShortcuts);

    expect(shortcuts).toHaveLength(1);
    expect(shortcuts).toHaveProp('comparedToVersionId', comparedToVersionId);
    expect(shortcuts).toHaveProp('compareInfo', compareInfo);
    expect(shortcuts).toHaveProp('currentPath', selectedPath);
    expect(shortcuts).toHaveProp('messageMap', messageMap);
    expect(shortcuts).toHaveProp('versionId', version.id);
  });

  it('renders CodeOverview', () => {
    const { file, version } = getInternalVersionAndFile();
    const root = renderPanel({ file, version }, PanelAttribs.altSidePanel);

    const overview = root.find(CodeOverview);
    expect(overview).toHaveLength(1);
    expect(overview).toHaveProp('content', file.content);
    expect(overview).toHaveProp('version', version);
  });

  it('passes getCodeLineAnchor to CodeOverview', () => {
    const getCodeLineAnchor = jest.fn();
    const { file, version } = getInternalVersionAndFile();
    const root = renderPanel(
      { getCodeLineAnchor, file, version },
      PanelAttribs.altSidePanel,
    );

    expect(root.find(CodeOverview)).toHaveProp(
      'getCodeLineAnchor',
      getCodeLineAnchor,
    );
  });

  it('does not render CodeOverview without a file', () => {
    const root = renderPanel({ file: null }, PanelAttribs.altSidePanel);

    expect(root.find(CodeOverview)).toHaveLength(0);
  });

  it('does not render CodeOverview content for images', () => {
    const path = 'image.png';
    const entry = createFakeEntry('image', path, 'image/png');
    const fileContent = 'some image data';

    const { file, version } = getInternalVersionAndFile({
      fileContent,
      path,
      entry,
    });
    const root = renderPanel({ file, version }, PanelAttribs.altSidePanel);

    const overview = root.find(CodeOverview);
    expect(overview).toHaveProp('content', '');
  });

  it('renders general LinterMessages', () => {
    const uid1 = 'general-message-1';
    const uid2 = 'general-message-2';

    const messageMap = getMessageMap(
      createFakeExternalLinterResult({
        messages: [
          {
            file: null,
            line: null,
            uid: uid1,
          },
          {
            file: null,
            line: null,
            uid: uid2,
          },
        ],
      }),
    );

    const root = getContentShellPanel(
      renderWithLinterProvider({}, { messageMap }),
      PanelAttribs.topContent,
    );

    const messages = root.find(LinterMessage);

    expect(messages).toHaveLength(2);
    expect(messages.at(0)).toHaveProp(
      'message',
      expect.objectContaining({ uid: uid1 }),
    );
    expect(messages.at(1)).toHaveProp(
      'message',
      expect.objectContaining({ uid: uid2 }),
    );
  });

  it('does not render topContent with an empty messageMap', () => {
    const root = renderWithLinterProvider({}, { messageMap: undefined });

    expect(root.find(ContentShell)).toHaveProp('topContent', null);
  });

  it('does not render topContent for non-general LinterMessages', () => {
    const messageMap = getMessageMap(
      createFakeExternalLinterResult({
        messages: [
          {
            // Define a message for a file, which should be ignored.
            file: 'some-file.js',
            line: null,
            uid: 'global-message-example',
          },
        ],
      }),
    );
    const root = renderWithLinterProvider({}, { messageMap });

    expect(root.find(ContentShell)).toHaveProp('topContent', null);
  });
});
