import log from 'loglevel';
import * as React from 'react';
import { Button, ListGroup } from 'react-bootstrap';
import { connect } from 'react-redux';
import Treefold, { TreefoldRenderProps } from 'react-treefold';

import styles from './styles.module.scss';
import FileTreeNode, {
  PublicProps as FileTreeNodeProps,
} from '../FileTreeNode';
import Loading from '../Loading';
import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import {
  Version,
  actions as versionsActions,
  getVersionInfo,
} from '../../reducers/versions';
import { getLocalizedString, gettext } from '../../utils';

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

export type TreefoldRenderPropsForFileTree = TreefoldRenderProps<TreeNode>;

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

export const buildFileTree = (version: Version): DirectoryNode => {
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
          }

          // TODO: this should not happen but what if we don't find a node?
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

export type PublicProps = {
  onSelect: FileTreeNodeProps['onSelect'];
  versionId: number;
};

export type DefaultProps = {
  _log: typeof log;
};

type PropsFromState = {
  version: Version | void;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class FileTreeBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _log: log,
  };

  renderNode = (props: TreefoldRenderPropsForFileTree) => {
    const { onSelect, version } = this.props;

    if (version) {
      return <FileTreeNode {...props} onSelect={onSelect} version={version} />;
    }
    return <Loading message={gettext('Loading version...')} />;
  };

  onToggleExpand = (node: TreeNode) => {
    const { dispatch, version } = this.props;

    if (!version) {
      throw new Error('Cannot toggle expanded path without a version');
    }

    dispatch(
      versionsActions.toggleExpandedPath({
        path: node.id,
        versionId: version.id,
      }),
    );
  };

  onExpandTree = () => {
    const { dispatch, version } = this.props;

    if (version) {
      dispatch(
        versionsActions.expandTree({
          versionId: version.id,
        }),
      );
    }
  };

  onCollapseTree = () => {
    const { dispatch, version } = this.props;

    if (version) {
      dispatch(
        versionsActions.collapseTree({
          versionId: version.id,
        }),
      );
    }
  };

  isNodeExpanded = (node: TreeNode) => {
    const { version } = this.props;

    if (!version) {
      throw new Error('Cannot check if node is expanded without a version');
    }

    return version.expandedPaths.includes(node.id);
  };

  render() {
    const { version } = this.props;

    if (!version) {
      return <Loading message={gettext('Loading version...')} />;
    }

    const tree = buildFileTree(version);

    return (
      <ListGroup>
        <div className={styles.controlButtons}>
          <Button
            className={styles.button}
            id="openAll"
            onClick={this.onExpandTree}
            size="sm"
            type="button"
            variant="light"
          >
            {gettext('Open all folders')}
          </Button>
          <Button
            className={styles.button}
            id="closeAll"
            onClick={this.onCollapseTree}
            size="sm"
            type="button"
            variant="light"
          >
            {gettext('Close all folders')}
          </Button>
        </div>
        <Treefold
          nodes={[tree]}
          render={this.renderNode}
          isNodeExpanded={this.isNodeExpanded}
          onToggleExpand={this.onToggleExpand}
        />
      </ListGroup>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps & DefaultProps,
): PropsFromState => {
  const { _log, versionId } = ownProps;
  const version = getVersionInfo(state.versions, versionId);

  if (!version) {
    // This should never happen as we are fetching the version in all of the
    // parents on this component and only rendering the FileTree if we have a
    // version, but let's log a warning in case we encounter a case where this
    // does happen.
    _log.warn(`No version was loaded for version: `, versionId);
  }

  return {
    version,
  };
};

export default connect(mapStateToProps)(FileTreeBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
