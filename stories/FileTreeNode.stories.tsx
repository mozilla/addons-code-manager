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

storiesOf('FileTreeNode', module)
  .add('file node', () => <FileTreeNode {...getProps()} />)
  .add('directory node', () => (
    <FileTreeNode {...getProps({ isFolder: true })} />
  ))
  .add('directory, expanded, without children', () => (
    <FileTreeNode {...getProps({ isFolder: true, isExpanded: true })} />
  ))
  .add('directory, expanded, with a child', () => {
    const props = getProps({
      hasChildNodes: true,
      isExpanded: true,
      isFolder: true,
      renderChildNodes: () => {
        return <FileTreeNode {...getProps({ level: 1 })} />;
      },
    });

    return <FileTreeNode {...props} />;
  });
