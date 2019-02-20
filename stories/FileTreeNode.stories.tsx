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
  };
};

storiesOf('FileTreeNode', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'file node',
          sectionFn: () => <FileTreeNode {...getProps()} />,
        },
        {
          title: 'directory node',
          sectionFn: () => <FileTreeNode {...getProps({ isFolder: true })} />,
        },
        {
          title: 'directory, expanded, without children',
          sectionFn: () => (
            <FileTreeNode {...getProps({ isFolder: true, isExpanded: true })} />
          ),
        },
        {
          title: 'directory, expanded, with a child',
          sectionFn: () => {
            const props = getProps({
              hasChildNodes: true,
              isExpanded: true,
              isFolder: true,
              renderChildNodes: () => {
                return <FileTreeNode {...getProps({ level: 1 })} />;
              },
            });

            return <FileTreeNode {...props} />;
          },
        },
      ],
    },
  ],
});
