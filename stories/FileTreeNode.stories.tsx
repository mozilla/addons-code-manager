import React from 'react';
import { storiesOf } from '@storybook/react';

import FileTreeNode from '../src/components/FileTreeNode';

const getProps = ({
  hasChildNodes = false,
  isExpanded = false,
  isFolder = false,
  level = 0,
  nodeName = 'node name',
  renderChildNodes = () => ({}),
} = {}) => {
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
      id: 'node-id',
      name: nodeName,
    },
    renderChildNodes,
    onSelect: () => {},
  };
};

storiesOf('FileTreeNode', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'file node',
          sectionFn: () => (
            <FileTreeNode {...getProps({ nodeName: 'manifest.json' })} />
          ),
        },
        {
          title: 'directory node',
          sectionFn: () => (
            <FileTreeNode
              {...getProps({ isFolder: true, nodeName: 'background-scripts' })}
            />
          ),
        },
        {
          title: 'directory, expanded, without children',
          sectionFn: () => (
            <FileTreeNode
              {...getProps({
                isFolder: true,
                isExpanded: true,
                nodeName: 'background-scripts',
              })}
            />
          ),
        },
        {
          title: 'directory, expanded, with a child',
          sectionFn: () => {
            const props = getProps({
              hasChildNodes: true,
              isExpanded: true,
              isFolder: true,
              nodeName: 'background-scripts',
              renderChildNodes: () => {
                return (
                  <FileTreeNode
                    {...getProps({ level: 1, nodeName: 'background.js' })}
                  />
                );
              },
            });

            return <FileTreeNode {...props} />;
          },
        },
      ],
    },
  ],
});
