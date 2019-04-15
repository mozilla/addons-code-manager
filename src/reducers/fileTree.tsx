import log from 'loglevel';
import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { Version, updateSelectedPath } from './versions';
import { ThunkActionCreator } from '../configureStore';
import { getLocalizedString } from '../utils';

type FileNode = {
  id: string;
  name: string;
};

export type DirectoryNode = {
  id: string;
  name: string;
  children: TreeNode[];
};

export type TreeNode = FileNode | DirectoryNode;

const recursiveSortInPlace = (node: DirectoryNode): void => {
  node.children.sort((a, b) => {
    if ('children' in a && 'children' in b) {
      return a.name.localeCompare(b.name);
    }

    if ('children' in a === false && 'children' in b === false) {
      return a.name.localeCompare(b.name);
    }

    if ('children' in b === false) {
      return -1;
    }

    return 1;
  });

  node.children.forEach((child) => {
    if ('children' in child) {
      recursiveSortInPlace(child);
    }
  });
};

const getVersionName = (version: Version) => {
  return getLocalizedString(version.addon.name);
};

export const getRootPath = (version: Version) => {
  return `root-${getVersionName(version)}`;
};

export const buildFileTreeNodes = (version: Version): DirectoryNode => {
  const { entries } = version;
  const root: DirectoryNode = {
    id: getRootPath(version),
    name: getVersionName(version),
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
          const foundNode = currentNode.children.find(
            (child: TreeNode) => child.name === parts[i],
          ) as DirectoryNode;

          if (foundNode) {
            currentNode = foundNode;
          } else {
            // This should not happen, but throw an exception if it does.
            throw new Error(`Could not find parent of entry: ${entry.path}`);
          }
        }
      }

      // Create a new node.
      let node: TreeNode = {
        id: entry.path,
        name: entry.filename,
      };

      // When the entry is a directory, we create a `DirectoryNode`.
      if (entry.type === 'directory') {
        node = {
          ...node,
          children: [],
        };
      }

      currentNode.children.push(node);
    });

    // To the next depth.
    currentDepth++;
  }

  recursiveSortInPlace(root);

  return root;
};

export const buildTreePathList = (nodes: DirectoryNode): string[] => {
  const treePathList: string[] = [];

  const extractPaths = (node: TreeNode) => {
    if ('children' in node) {
      for (const child of node.children) {
        extractPaths(child);
      }
    } else {
      treePathList.push(node.id);
    }
  };

  extractPaths(nodes);

  return treePathList;
};

export const buildFileTree = (version: Version): FileTree => {
  const nodes = buildFileTreeNodes(version);
  return {
    nodes,
    pathList: buildTreePathList(nodes),
  };
};

export enum RelativePathPosition {
  next,
  previous,
}

type GetRelativePathParams = {
  _log?: typeof log;
  currentPath: string;
  pathList: string[];
  position: RelativePathPosition;
};

export const getRelativePath = ({
  currentPath,
  pathList,
  position,
}: GetRelativePathParams): string => {
  const currentIndex = pathList.indexOf(currentPath);
  if (currentIndex < 0) {
    throw new Error(`Cannot find ${currentPath} in pathList: ${pathList}`);
  }
  let newIndex =
    position === RelativePathPosition.previous
      ? currentIndex - 1
      : currentIndex + 1;
  if (newIndex < 0) {
    // We are at the first file and the user selected 'previous', so go to the
    // last file.
    newIndex = pathList.length - 1;
  } else if (newIndex >= pathList.length) {
    // We are at the last file and the user selected 'next', so go to the
    // first file.
    newIndex = 0;
  }

  return pathList[newIndex];
};

type GoToRelativeFileParams = {
  _getRelativePath?: typeof getRelativePath;
  _updateSelectedPath?: typeof updateSelectedPath;
  currentPath: string;
  pathList: string[];
  position: RelativePathPosition;
  versionId: number;
};

export const goToRelativeFile = ({
  /* istanbul ignore next */
  _getRelativePath = getRelativePath,
  /* istanbul ignore next */
  _updateSelectedPath = updateSelectedPath,
  currentPath,
  pathList,
  position,
  versionId,
}: GoToRelativeFileParams): ThunkActionCreator => {
  return async (dispatch) => {
    const nextPath = _getRelativePath({
      currentPath,
      pathList,
      position,
    });

    dispatch(
      _updateSelectedPath({
        selectedPath: nextPath,
        versionId,
      }),
    );
  };
};

export type FileTree = {
  nodes: DirectoryNode;
  pathList: string[];
};

export type FileTreeState = {
  forVersionId: void | number;
  tree: void | FileTree;
};

export const initialState: FileTreeState = {
  forVersionId: undefined,
  tree: undefined,
};

export const actions = {
  buildTree: createAction('BUILD_TREE', (resolve) => {
    return (payload: { version: Version }) => resolve(payload);
  }),
};

export const getTree = (
  treeState: FileTreeState,
  versionId: number,
): void | FileTree => {
  if (treeState.forVersionId !== versionId) {
    return undefined;
  }
  return treeState.tree;
};

const reducer: Reducer<FileTreeState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): FileTreeState => {
  switch (action.type) {
    case getType(actions.buildTree): {
      const { version } = action.payload;
      const tree = buildFileTree(version);

      return {
        ...state,
        forVersionId: version.id,
        tree,
      };
    }
    default:
      return state;
  }
};

export default reducer;
