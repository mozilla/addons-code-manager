import React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import FileTreeNode, { PublicProps } from '../src/components/FileTreeNode';
import {
  createStoreWithVersion,
  fakeVersionWithContent,
} from '../src/test-helpers';
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
  versionId = fakeVersionWithContent.id,
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
          },
        },
        {
          title: 'selected node',
          sectionFn: () => {
            const externalVersion = fakeVersionWithContent;
            const store = createStoreWithVersion({ version: externalVersion });

            return render({
              store,
              versionId: externalVersion.id,
              nodeId: externalVersion.file.selected_file,
            });
          },
        },
      ],
    },
  ],
});
