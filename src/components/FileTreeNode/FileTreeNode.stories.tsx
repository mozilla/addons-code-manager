import React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import {
  createStoreWithVersion,
  fakeVersionWithContent,
} from '../../test-helpers';
import { renderWithStoreAndRouter } from '../../storybook-utils';

import FileTreeNode, { FileTreeNodeBase, PublicProps } from '.';

type GetPropsParams = {
  nodeId?: PublicProps['node']['id'];
  nodeName?: PublicProps['node']['name'];
} & Partial<PublicProps>;

const getProps = ({
  hasChildNodes = false,
  isExpanded = false,
  isFolder = false,
  level = 0,
  nodeName = 'node name',
  nodeId = 'node-id',
  renderChildNodes = () => ({}),
  versionId = fakeVersionWithContent.id,
}: GetPropsParams = {}) => {
  return {
    getToggleProps: () => ({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onClick: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onKeyDown: () => {},
      role: 'button',
      tabIndex: 0,
    }),
    hasChildNodes,
    isExpanded,
    isFolder,
    level,
    node: {
      id: nodeId,
      name: nodeName,
    },
    renderChildNodes,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onSelect: () => {},
    versionId,
    comparedToVersionId: null,
  };
};

const render = ({
  versionId = 543219,
  store = createStoreWithVersion({
    version: { ...fakeVersionWithContent, id: versionId },
  }),
  ...props
}: { store?: Store } & GetPropsParams = {}) => {
  return renderWithStoreAndRouter(
    <div className="FileTreeNodeStory-shell">
      <FileTreeNode {...getProps({ versionId, ...props })} />
    </div>,
    { store },
  );
};

export default {
  title: 'Components/FileTreeNode',
  component: FileTreeNodeBase,
} as Meta;

export const FileNode = () => render({ nodeName: 'manifest.json' });

export const DirectoryNode = () =>
  render({ isFolder: true, nodeName: 'background-scripts' });

export const DirectoryExpandedWithoutChildren = () =>
  render({
    isFolder: true,
    isExpanded: true,
    nodeName: 'background-scripts',
  });

export const DirectoryExpandedWithAChild = () => {
  const versionId = 921;
  const store = createStoreWithVersion({
    version: {
      ...fakeVersionWithContent,
      id: versionId,
    },
  });

  return render({
    versionId,
    hasChildNodes: true,
    isExpanded: true,
    isFolder: true,
    nodeName: 'background-scripts',
    renderChildNodes: () => {
      return (
        <FileTreeNode
          {...getProps({
            versionId,
            level: 1,
            nodeName: 'background.js',
          })}
        />
      );
    },
    store,
  });
};

export const SelectedNode = () => {
  const externalVersion = fakeVersionWithContent;
  const store = createStoreWithVersion({ version: externalVersion });

  return render({
    store,
    versionId: externalVersion.id,
    nodeId: externalVersion.file.selected_file,
  });
};
