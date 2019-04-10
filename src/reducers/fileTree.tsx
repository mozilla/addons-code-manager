import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { Version, viewVersionFile } from './versions';
import { ThunkActionCreator } from '../configureStore';
import { getLocalizedString } from '../utils';
import { LinterMessage, LinterMessageMap, getMessagesForPath } from './linter';

export const ROOT_PATH = '~root~';

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

export const buildFileTreeNodes = (version: Version): DirectoryNode => {
  const { entries } = version;
  const root: DirectoryNode = {
    id: ROOT_PATH,
    name: getLocalizedString(version.addon.name),
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

const findRelativeMessageUid = (
  currentPath: string,
  messageMap: LinterMessageMap,
  pathList: string[],
  position: RelativePathPosition,
): LinterMessage['uid'] | null => {
  let path = currentPath;
  for (let i = 0; i < pathList.length; i++) {
    const nextPath = getRelativePath({
      currentPath: path,
      pathList,
      position,
    });
    const nextMessages = messageMap[nextPath];
    if (nextMessages) {
      const nextMessagesForPath = getMessagesForPath(nextMessages);
      if (position === RelativePathPosition.previous) {
        const lastMessageIndex = nextMessagesForPath.length - 1;
        if (lastMessageIndex >= 0) {
          return nextMessagesForPath[lastMessageIndex].uid;
        }
      } else if (nextMessagesForPath.length) {
        return nextMessagesForPath[0].uid;
      }
    }
    path = nextPath;
  }
  // If we got here then we never found another message, which would be odd,
  // because we should have at the very least gotten back to our original
  // message.
  // We should probably log this.
  return null;
};

export type GetRelativeMessageUidParams = {
  currentMessageUid: LinterMessage['uid'] | void;
  currentPath: string;
  locateCurrentMessage?: boolean;
  messageMap: LinterMessageMap;
  pathList: string[];
  position: RelativePathPosition;
};

export const getRelativeMessageUid = ({
  currentMessageUid,
  currentPath,
  messageMap,
  pathList,
  position,
}: GetRelativeMessageUidParams): string | null => {
  if (!currentMessageUid) {
    // There is no current message, so get the first one.
    if (!Object.keys(messageMap).length) {
      return null;
    }
    for (const path of pathList) {
      const messages = messageMap[path];
      if (messages) {
        const messagesForPath = getMessagesForPath(messages);
        if (messagesForPath.length) {
          return messagesForPath[0].uid;
        }
      }
    }
    // No messages found in the map (which shouldn't be possible because of the
    // length check, so throw an error.
    throw new Error(
      'The messageMap is not empty, but we were unable to find any messages',
    );
  }

  const messages = messageMap[currentPath];
  if (!messages) {
    // No messages exist for the current path, which shouldn't be the case.
    // If we have a currentMessageUid it should correspond to the current path.
    throw new Error(`No messages found for current path: ${currentPath}`);
  }

  const messagesForPath = getMessagesForPath(messages);
  const currentMessageIndex = messagesForPath.findIndex(
    (message) => message.uid === currentMessageUid,
  );

  const newIndex =
    position === RelativePathPosition.previous
      ? currentMessageIndex - 1
      : currentMessageIndex + 1;

  if (newIndex >= 0 && newIndex < messagesForPath.length) {
    return messagesForPath[newIndex].uid;
  }
  return findRelativeMessageUid(currentPath, messageMap, pathList, position);
};

type GoToRelativeFileParams = {
  _getRelativePath?: typeof getRelativePath;
  _viewVersionFile?: typeof viewVersionFile;
  currentPath: string;
  pathList: string[];
  position: RelativePathPosition;
  versionId: number;
};

export const goToRelativeFile = ({
  /* istanbul ignore next */
  _getRelativePath = getRelativePath,
  /* istanbul ignore next */
  _viewVersionFile = viewVersionFile,
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
      _viewVersionFile({
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
