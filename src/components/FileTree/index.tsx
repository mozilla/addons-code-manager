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
  DirectoryNode,
  TreeNode,
  actions as fileTreeActions,
  getTree,
} from '../../reducers/fileTree';
import {
  Version,
  actions as versionsActions,
  getVersionInfo,
} from '../../reducers/versions';
import { gettext } from '../../utils';

type LoadData = () => void;

export type TreefoldRenderPropsForFileTree = TreefoldRenderProps<TreeNode>;

export type PublicProps = {
  _loadData?: LoadData;
  onSelect: FileTreeNodeProps['onSelect'];
  versionId: number;
};

export type DefaultProps = {
  _buildTree: typeof fileTreeActions.buildTree;
  _log: typeof log;
};

type PropsFromState = {
  tree: DirectoryNode | void;
  version: Version | void;
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class FileTreeBase extends React.Component<Props> {
  loadData: LoadData;

  static defaultProps: DefaultProps = {
    _buildTree: fileTreeActions.buildTree,
    _log: log,
  };

  constructor(props: Props) {
    super(props);
    // Allow dependency injection to test all the ways loadData() gets executed.
    this.loadData = props._loadData || this._loadData;
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  _loadData = () => {
    const { _buildTree, dispatch, tree, version } = this.props;

    if (version && !tree) {
      dispatch(_buildTree({ version }));
    }
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
    const { tree, version } = this.props;

    if (!version || !tree) {
      return <Loading message={gettext('Loading version...')} />;
    }

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
    tree: getTree(state.fileTree, version),
    version,
  };
};

export default connect(mapStateToProps)(FileTreeBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
