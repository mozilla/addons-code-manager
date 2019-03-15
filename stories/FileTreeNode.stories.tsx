import React from 'react';
import { storiesOf } from '@storybook/react';

import FileTreeNode from '../src/components/FileTreeNode';
import { createInternalVersion } from '../src/reducers/versions';
import { fakeVersion } from '../src/test-helpers';

const getProps = ({
  hasChildNodes = false,
  isExpanded = false,
  isFolder = false,
  level = 0,
  nodeName = 'node name',
  nodeId = 'node-id',
  renderChildNodes = () => ({}),
  version = createInternalVersion(fakeVersion),
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
      id: nodeId,
      name: nodeName,
    },
    renderChildNodes,
    onSelect: () => {},
    version,
  };
};

const render = (props = {}) => {
  return <FileTreeNode {...getProps(props)} />;
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
