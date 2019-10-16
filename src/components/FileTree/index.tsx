import log from 'loglevel';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import Treefold, { TreefoldRenderProps } from 'react-treefold';

import styles from './styles.module.scss';
import FileTreeNode, {
  PublicProps as FileTreeNodeProps,
} from '../FileTreeNode';
import Loading from '../Loading';
import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  FileTree,
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
  comparedToVersionId: number | null;
  onSelect: FileTreeNodeProps['onSelect'];
  versionId: number;
};

export type DefaultProps = {
  _log: typeof log;
};

type PropsFromState = {
  tree: FileTree | undefined;
  version: Version | undefined | null;
  expandedPaths: string[];
};

type Props = PublicProps & DefaultProps & PropsFromState & ConnectedReduxProps;

export class FileTreeBase extends React.Component<Props> {
  loadData: LoadData;

  static defaultProps: DefaultProps = {
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
    const { dispatch, tree, version } = this.props;

    if (version && !tree) {
      dispatch(fileTreeActions.buildTree({ version }));
    }
  };

  renderNode = (props: TreefoldRenderPropsForFileTree) => {
    const { comparedToVersionId, onSelect, version } = this.props;

    if (version) {
      return (
        <FileTreeNode
          {...props}
          comparedToVersionId={comparedToVersionId}
          onSelect={onSelect}
          versionId={version.id}
        />
      );
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
    const { expandedPaths } = this.props;

    return expandedPaths.includes(node.id);
  };

  render() {
    const { tree, version } = this.props;

    if (!version || !tree) {
      return <Loading message={gettext('Loading version...')} />;
    }

    return (
      <div className={styles.shell}>
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
        <div className={styles.treeShell}>
          <Treefold
            nodes={tree.nodes.children}
            render={this.renderNode}
            isNodeExpanded={this.isNodeExpanded}
            onToggleExpand={this.onToggleExpand}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const { versionId } = ownProps;
  const { expandedPaths } = state.versions;
  const version = getVersionInfo(state.versions, versionId);

  if (!version) {
    // TODO: support loading version objects as needed.
    // https://github.com/mozilla/addons-code-manager/issues/754
    //
    // An empty version should never happen as we are fetching the version in all of the
    // parents on this component and only rendering the FileTree if we have a
    // version, but let's log a warning in case we encounter a case where this
    // does happen.
    log.warn(`No version was loaded for version: `, versionId);
  }

  const tree = version ? getTree(state.fileTree, version.id) : undefined;

  return {
    expandedPaths,
    tree,
    version,
  };
};

export default connect(mapStateToProps)(FileTreeBase);
