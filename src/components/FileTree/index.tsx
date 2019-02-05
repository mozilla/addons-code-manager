import * as React from 'react';
import { Treebeard } from 'react-treebeard';

import treebeardStyle from './treebeard-style';

export type Entry = {
  depth: number;
  directory: boolean;
  filename: string;
  path: string;
};

type FileNode = {
  name: string;
};

type DirectoryNode = {
  name: string;
  toggled: boolean;
  children: TreeNode[];
};

type TreeNode = FileNode | DirectoryNode;

export const buildTreebeardData = (
  versionId: string,
  entries: Entry[],
): DirectoryNode => {
  const root: DirectoryNode = {
    name: versionId,
    toggled: true,
    children: [],
  };

  // We need to know how depth the tree is because we'll build the Treebeard
  // tree depth by depth.
  const maxDepth = entries.reduce((max, entry) => {
    if (entry.depth > max) {
      return entry.depth;
    }

    return max;
  }, 0);

  let currentDepth = 0;
  while (currentDepth <= maxDepth) {
    // We find the entries for the current depth.
    const currentEntries = entries.filter(
      // eslint-disable-next-line no-loop-func
      (entry) => entry.depth === currentDepth,
    );

    // This is where we create new "nodes" for each entry.
    // eslint-disable-next-line no-loop-func
    currentEntries.forEach((entry) => {
      let currentNode = root;

      if (currentDepth > 0) {
        // We need to find the current node (directory) to add the current
        // entry in its children. We do this by splitting the `path` attribute
        // and visit each node until we reach the desired node.
        //
        // This only applies when the current depth is not 0 (a.k.a. the root
        // directory) because we already know `root`.
        const parts = entry.path.split('/');
        // Remove the filename
        parts.pop();

        for (let i = 0; i < parts.length; i++) {
          const maybeNode = currentNode.children.find(
            (child: TreeNode) => child.name === parts[i],
          ) as DirectoryNode;

          if (maybeNode) {
            currentNode = maybeNode;
          }

          // TODO: this should not happen but what if we don't find a node?
        }
      }

      // Create a new node.
      let node: TreeNode = {
        name: entry.filename,
      };

      // When the entry is a directory, we create a `DirectoryNode`.
      if (entry.directory) {
        node = {
          ...node,
          toggled: true,
          children: [],
        };
      }

      currentNode.children.push(node);
    });

    // To the next depth.
    currentDepth++;
  }

  return root;
};

type PartialExternalVersion = {
  id: string;
  file: {
    entries: Entry[];
  };
};

type PublicProps = {
  response: PartialExternalVersion;
};

export class FileTreeBase extends React.Component<PublicProps> {
  render() {
    const { response } = this.props;

    return (
      <Treebeard
        data={buildTreebeardData(
          response.id,
          Object.values(response.file.entries),
        )}
        style={treebeardStyle}
      />
    );
  }
}

export default FileTreeBase;
