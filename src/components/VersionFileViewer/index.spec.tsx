import * as React from 'react';
import { Store } from 'redux';
import { ShallowWrapper, shallow } from 'enzyme';

import configureStore from '../../configureStore';
import { AccordionItem } from '../AccordionMenu';
import CodeOverview from '../CodeOverview';
import FileMetadata from '../FileMetadata';
import FileTree from '../FileTree';
import { PanelAttribs } from '../FullscreenGrid';
import KeyboardShortcuts from '../KeyboardShortcuts';
import Loading from '../Loading';
import {
  ExternalVersionEntry,
  actions as versionsActions,
  getVersionFile,
  getVersionInfo,
} from '../../reducers/versions';
import {
  createFakeEntry,
  getContentShellPanel,
  fakeVersion,
  fakeVersionEntry,
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
        `Unexpectedly could not retrieve version from state for id=${
          version.id
        }`,
      );
    }

    const file = getVersionFile(versionsState, version.id, path);
    if (!file) {
      throw new Error(
        `Unexpectedly could not retrieve version file from state for id=${
          version.id
        }, path=${path}`,
      );
    }

    return { version: internalVersion, file };
  };

  type RenderParams = Partial<PublicProps>;

  const render = (moreProps: RenderParams) => {
    const { file, version } = getInternalVersionAndFile();
    const props = {
      children: <div />,
      file,
      onSelectFile: jest.fn(),
      showFileInfo: true,
      version,
      ...moreProps,
    };

    return shallow(<VersionFileViewer {...props} />);
  };

  const renderPanel = (params: RenderParams, panel: PanelAttribs) => {
    const root = render(params);
    return getContentShellPanel(root, panel);
  };

  const getItem = (root: ShallowWrapper, title: ItemTitles) => {
    return root
      .find(AccordionItem)
      .filterWhere((c) => c.prop('title') === title);
  };

  it('renders children', () => {
    const childClass = 'ExampleClass';
    const root = render({ children: <div className={childClass} /> });

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

    const root = renderPanel({ onSelectFile, version }, 'mainSidePanel');

    const tree = root.find(FileTree);
    expect(tree).toHaveLength(1);
    expect(tree).toHaveProp('onSelect', onSelectFile);
    expect(tree).toHaveProp('versionId', version.id);
  });

  it('shows an information panel by default', () => {
    const { file } = getInternalVersionAndFile();
    const root = renderPanel({ file }, 'mainSidePanel');
    const item = getItem(root, ItemTitles.Information);

    const meta = item.find(FileMetadata);
    expect(meta).toHaveProp('file', file);
  });

  it('can hide the information panel', () => {
    const root = renderPanel({ showFileInfo: false }, 'mainSidePanel');

    expect(getItem(root, ItemTitles.Information)).toHaveLength(0);
  });

  it('renders a placeholder in the information panel without a file', () => {
    const root = renderPanel(
      { file: null, showFileInfo: true },
      'mainSidePanel',
    );
    const item = getItem(root, ItemTitles.Information);

    expect(item.find(FileMetadata)).toHaveLength(0);
    expect(item.find(Loading)).toHaveLength(1);
  });

  it('renders a KeyboardShortcuts panel', () => {
    const { version } = getInternalVersionAndFile();
    const root = renderPanel({ version }, 'mainSidePanel');
    const item = getItem(root, ItemTitles.Shortcuts);

    const shortcuts = item.find(KeyboardShortcuts);
    expect(shortcuts).toHaveLength(1);
    expect(shortcuts).toHaveProp('currentPath', version.selectedPath);
    expect(shortcuts).toHaveProp('versionId', version.id);
  });

  it('renders CodeOverview', () => {
    const { file, version } = getInternalVersionAndFile();
    const root = renderPanel({ file, version }, 'altSidePanel');

    const overview = root.find(CodeOverview);
    expect(overview).toHaveLength(1);
    expect(overview).toHaveProp('content', file.content);
    expect(overview).toHaveProp('version', version);
  });

  it('does not render CodeOverview without a file', () => {
    const root = renderPanel({ file: null }, 'altSidePanel');

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
    const root = renderPanel({ file, version }, 'altSidePanel');

    const overview = root.find(CodeOverview);
    expect(overview).toHaveProp('content', '');
  });
});
