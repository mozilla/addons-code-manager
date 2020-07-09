/* eslint @typescript-eslint/camelcase: 0 */
import * as React from 'react';
import { DiffInfo } from 'react-diff-view';
import { ShallowWrapper, shallow } from 'enzyme';

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
  EntryStatusMap,
  ExternalVersionEntry,
  ExternalVersionFileWithContent,
  createInternalVersion,
  createInternalVersionFile,
  VersionFileWithContent,
  VersionFileWithDiff,
  ExternalVersionWithContent,
  ExternalVersionWithDiff,
} from '../../reducers/versions';
import {
  createFakeExternalLinterResult,
  fakeExternalLinterMessage,
  fakeVersionWithContent,
  fakeVersionWithDiff,
  fakeVersionEntry,
  getContentShellPanel,
  simulateLinterProvider,
  fakeVersionFileWithContent,
  fakeVersionFileWithDiff,
} from '../../test-helpers';
import { flattenDiffChanges } from '../../utils';
import styles from './styles.module.scss';

import VersionFileViewer, { ItemTitles, PublicProps } from '.';

describe(__filename, () => {
  enum ContentOrDiff {
    content,
    diff,
  }

  const getInternalVersionAndFile = ({
    contentOrDiff = ContentOrDiff.content,
    entry,
    fileProps = {},
    path = 'background.js',
  }: {
    contentOrDiff?: ContentOrDiff;
    entry?: ExternalVersionEntry;
    fileContent?: string;
    fileProps?: Partial<ExternalVersionFileWithContent>;
    path?: string;
  } = {}) => {
    const baseFile =
      contentOrDiff === ContentOrDiff.content
        ? fakeVersionFileWithContent
        : fakeVersionFileWithDiff;
    const externalFile = { ...baseFile, ...fileProps };
    const file =
      contentOrDiff === ContentOrDiff.content
        ? (createInternalVersionFile(externalFile) as VersionFileWithContent)
        : (createInternalVersionFile(externalFile) as VersionFileWithDiff);

    const version =
      contentOrDiff === ContentOrDiff.content
        ? ({
            ...fakeVersionWithContent,
            file_entries: {
              ...fakeVersionWithContent.file_entries,
              [path]: entry || { ...fakeVersionEntry, filename: path, path },
            },
          } as ExternalVersionWithContent)
        : ({
            ...fakeVersionWithDiff,
            file_entries: {
              ...fakeVersionWithContent.file_entries,
              [path]: entry || { ...fakeVersionEntry, filename: path, path },
            },
          } as ExternalVersionWithDiff);

    return {
      file,
      version: createInternalVersion(version),
    };
  };

  type RenderParams = Partial<PublicProps>;

  const render = (moreProps: RenderParams = {}) => {
    const { file, version } = getInternalVersionAndFile();
    const props = {
      children: <div />,
      comparedToVersionId: null,
      file,
      onSelectFile: jest.fn(),
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

  it('renders a loading message when linter messages are not loaded yet', () => {
    const childClass = 'ExampleClass';
    const root = renderWithLinterProvider(
      {
        children: <div className={childClass} />,
      },
      {
        messageMap: undefined,
      },
    );

    expect(root.find(`.${childClass}`)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
    expect(root.find(Loading)).toHaveProp(
      'message',
      'Loading linter information...',
    );
  });

  it('renders children when linter messages are loaded', () => {
    const childClass = 'ExampleClass';
    const messageMap = getMessageMap(
      createFakeExternalLinterResult({ messages: [] }),
    );
    const root = renderWithLinterProvider(
      {
        children: <div className={childClass} />,
      },
      {
        messageMap,
      },
    );

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

  it('renders a message in the information panel for the deleted file', () => {
    const filename = 'someFileName.js';
    const version = createInternalVersion({
      ...fakeVersionWithContent,
      file: {
        ...fakeVersionFileWithContent,
        filename,
        selected_file: filename,
      },
    });
    const entryStatusMap: EntryStatusMap = {
      [filename]: 'D',
    };
    const root = renderPanel(
      { entryStatusMap, file: null, version },
      PanelAttribs.mainSidePanel,
    );
    const item = getAccordionItem(root, ItemTitles.Information);
    const message = item.find(`.${styles.deletedFileMessage}`);

    expect(item.find(FileMetadata)).toHaveLength(0);
    expect(item.find(Loading)).toHaveLength(0);
    expect(message).toHaveLength(1);
    expect(message).toHaveText(
      `The file has been deleted in the new version ${version.versionString}`,
    );
  });

  it('renders a placeholder in the information panel if the modified file has not been loaded', () => {
    const { file, version } = getInternalVersionAndFile();
    const entryStatusMap: EntryStatusMap = {
      [file.filename]: 'M',
    };
    const root = renderPanel(
      { entryStatusMap, file: null, version },
      PanelAttribs.mainSidePanel,
    );
    const item = getAccordionItem(root, ItemTitles.Information);
    const message = item.find(`.${styles.deletedFileMessage}`);

    expect(item.find(FileMetadata)).toHaveLength(0);
    expect(item.find(Loading)).toHaveLength(1);
    expect(message).toHaveLength(0);
  });

  it('configures LinterProvider', () => {
    const { version } = getInternalVersionAndFile();
    const root = render({ version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('version', version);
    expect(provider).toHaveProp('selectedPath', version.selectedPath);
  });

  it('does not configure LinterProvider without a version', () => {
    const root = render({ version: null });

    expect(root.find(LinterProvider)).toHaveLength(0);
  });

  it('renders a KeyboardShortcuts panel', () => {
    const { file, version } = getInternalVersionAndFile();
    const comparedToVersionId = 41;

    const messageMap = getMessageMap(
      createFakeExternalLinterResult({ messages: [fakeExternalLinterMessage] }),
    );

    const root = renderWithLinterProvider(
      { comparedToVersionId, version },
      { messageMap },
    );

    const shortcuts = getContentShellPanel(
      root,
      PanelAttribs.mainSidePanel,
    ).find(KeyboardShortcuts);

    expect(shortcuts).toHaveLength(1);
    expect(shortcuts).toHaveProp('comparedToVersionId', comparedToVersionId);
    expect(shortcuts).toHaveProp('file', file);
    expect(shortcuts).toHaveProp('currentPath', version.selectedPath);
    expect(shortcuts).toHaveProp('messageMap', messageMap);
    expect(shortcuts).toHaveProp('versionId', version.id);
  });

  it('renders CodeOverview', () => {
    const fileAndVersion = getInternalVersionAndFile();
    const file = fileAndVersion.file as VersionFileWithContent;
    const { version } = fileAndVersion;
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

  it('passes insertedLines to CodeOverview', () => {
    const insertedLines = [1, 2];
    const _getInsertedLines = jest.fn().mockReturnValue(insertedLines);
    const fileAndVersion = getInternalVersionAndFile({
      contentOrDiff: ContentOrDiff.diff,
    });
    const file = fileAndVersion.file as VersionFileWithDiff;
    const { version } = fileAndVersion;

    const root = renderPanel(
      { _getInsertedLines, file, version },
      PanelAttribs.altSidePanel,
    );

    expect(root.find(CodeOverview)).toHaveProp('insertedLines', insertedLines);
    expect(_getInsertedLines).toHaveBeenCalledWith(file.diff);
  });

  it('does not call getInsertedLines if no diff exists', () => {
    const _getInsertedLines = jest.fn();
    const { file, version } = getInternalVersionAndFile({
      contentOrDiff: ContentOrDiff.content,
    });

    const root = renderPanel(
      { _getInsertedLines, file, version },
      PanelAttribs.altSidePanel,
    );

    expect(root.find(CodeOverview)).toHaveProp('insertedLines', []);
    expect(_getInsertedLines).not.toHaveBeenCalled();
  });

  it('passes the content of a diff to CodeOverview', () => {
    const fileAndVersion = getInternalVersionAndFile({
      contentOrDiff: ContentOrDiff.diff,
    });
    const file = fileAndVersion.file as VersionFileWithDiff;
    const { version } = fileAndVersion;
    const diff = file.diff as DiffInfo;

    const root = renderPanel({ file, version }, PanelAttribs.altSidePanel);

    expect(root.find(CodeOverview)).toHaveProp(
      'content',
      flattenDiffChanges(diff),
    );
  });

  it('does not render CodeOverview content for images', () => {
    const fileContent = 'some image data';

    const { file, version } = getInternalVersionAndFile({
      fileContent,
      fileProps: { mime_category: 'image' },
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
