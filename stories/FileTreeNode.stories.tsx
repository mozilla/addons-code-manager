import React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import FileTreeNode, { PublicProps } from '../src/components/FileTreeNode';
import { createInternalVersion } from '../src/reducers/versions';
import { fakeVersion } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

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
  version = createInternalVersion(fakeVersion),
}: GetPropsParams = {}) => {
  return {
    getToggleProps: () => ({
      onClick: () => {},
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
    onSelect: () => {},
    version,
  };
};

const render = ({
  store = configureStore(),
  ...props
}: { store?: Store } & GetPropsParams = {}) => {
  return renderWithStoreAndRouter(
    <div className="FileTreeNodeStory-shell">
      <FileTreeNode {...getProps(props)} />
    </div>,
    store,
  );
};

storiesOf('FileTreeNode', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'file node',
          sectionFn: () => render({ nodeName: 'manifest.json' }),
        },
        {
          title: 'directory node',
          sectionFn: () =>
            render({ isFolder: true, nodeName: 'background-scripts' }),
        },
        {
          title: 'directory, expanded, without children',
          sectionFn: () =>
            render({
              isFolder: true,
              isExpanded: true,
              nodeName: 'background-scripts',
            }),
        },
        {
          title: 'directory, expanded, with a child',
          sectionFn: () => {
            const version = createInternalVersion(fakeVersion);

            return render({
              version,
              hasChildNodes: true,
              isExpanded: true,
              isFolder: true,
              nodeName: 'background-scripts',
              renderChildNodes: () => {
                return (
                  <FileTreeNode
                    version={version}
                    {...getProps({ level: 1, nodeName: 'background.js' })}
                  />
                );
              },
            });
          },
        },
        {
          title: 'selected node',
          sectionFn: () => {
            const version = createInternalVersion(fakeVersion);

            return render({ version, nodeId: version.selectedPath });
          },
        },
      ],
    },
  ],
});
