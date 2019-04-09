import log from 'loglevel';
import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { Version, actions as versionActions } from './versions';
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

type GetRelativePathParams = {
  _log: typeof log;
  currentPath: string;
  pathList: string[];
  position: 'previous' | 'next';
};

export const getRelativePath = ({
  _log = log,
  currentPath,
  pathList,
  position,
}: GetRelativePathParams): string | void => {
  const currentIndex = pathList.indexOf(currentPath);
  if (!currentIndex) {
    _log.debug(`Cannot find ${currentPath} in pathList: ${pathList}`);
    return undefined;
  }
  let newIndex = position === 'previous' ? currentIndex - 1 : currentIndex + 1;
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

type GoToNextFileParams = {
  _log: typeof log;
  currentPath: string;
};

export const goToNextFile = ({
  _log = log,
  currentPath,
}: GoToNextFileParams): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { fileTree: fileTreeState } = getState();
    const { forVersionId, tree } = fileTreeState;
    const { pathList } = tree;

    if (!forVersionId || !pathList) {
      _log.debug('Cannot navigate to next file with no version loaded');
      return;
    }

    const nextPath = getRelativePath({
      _log,
      currentPath,
      pathList,
      position: 'next',
    });

    if (!nextPath) {
      // There is no next file, so do nothing.
      // TODO: I don't think we need to log in this case.
      return;
    }

    dispatch(
      versionActions.updateSelectedPath({
        selectedPath: nextPath,
        versionId: forVersionId,
      }),
    );
  };
};

export type FileTree = {
  nodes: DirectoryNode | void;
  pathList: string[] | void;
};

export type FileTreeState = {
  forVersionId: void | number;
  tree: FileTree;
};

export const initialState: FileTreeState = {
  forVersionId: undefined,
  tree: { nodes: undefined, pathList: undefined },
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
