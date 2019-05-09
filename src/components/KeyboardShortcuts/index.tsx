import log from 'loglevel';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  FileTree,
  RelativePathPosition,
  getTree,
  goToRelativeFile,
} from '../../reducers/fileTree';
import {
  CompareInfo,
  actions as versionsActions,
  getCompareInfo,
  goToRelativeDiff,
} from '../../reducers/versions';
import styles from './styles.module.scss';
import { gettext, getPathFromQueryString } from '../../utils';

const keys = ['k', 'j', 'e', 'o', 'c', 'n', 'p'];

export type PublicProps = {
  currentPath: string;
  versionId: number;
};

type PropsFromRouter = {
  addonId: string;
  baseVersionId: string;
  headVersionId: string;
};

type PropsFromState = {
  compareInfo: CompareInfo | null | void;
  currentAnchor: string;
  pathList: FileTree['pathList'] | void;
};

export type DefaultProps = {
  _document: typeof document;
  _goToRelativeDiff: typeof goToRelativeDiff;
  _goToRelativeFile: typeof goToRelativeFile;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  DefaultProps &
  ConnectedReduxProps;

export class KeyboardShortcutsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _document: document,
    _goToRelativeDiff: goToRelativeDiff,
    _goToRelativeFile: goToRelativeFile,
  };

  keydownListener = (event: KeyboardEvent) => {
    const {
      _goToRelativeDiff,
      _goToRelativeFile,
      compareInfo,
      currentAnchor,
      currentPath,
      dispatch,
      pathList,
      versionId,
    } = this.props;

    if (!pathList) {
      log.warn('Ignoring keyboard events while fileTree.pathList is undefined');
      return;
    }

    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      keys.includes(event.key)
    ) {
      switch (event.key) {
        case 'k':
          dispatch(
            _goToRelativeFile({
              currentPath,
              pathList,
              position: RelativePathPosition.previous,
              versionId,
            }),
          );
          break;
        case 'j':
          dispatch(
            _goToRelativeFile({
              currentPath,
              pathList,
              position: RelativePathPosition.next,
              versionId,
            }),
          );
          break;
        // We are supporting 'e' as it was the shortcut from the old tool, hence
        // existing reviewers might be used to using it.
        case 'e':
        case 'o':
          dispatch(
            versionsActions.expandTree({
              versionId,
            }),
          );
          break;
        case 'c':
          dispatch(
            versionsActions.collapseTree({
              versionId,
            }),
          );
          break;
        case 'n':
          if (compareInfo) {
            dispatch(
              _goToRelativeDiff({
                // TODO: Store the current anchor somewhere.
                currentAnchor: currentAnchor.replace('#', ''),
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.next,
                versionId,
              }),
            );
          }
          break;
        case 'p':
          if (compareInfo) {
            dispatch(
              _goToRelativeDiff({
                currentAnchor: currentAnchor.replace('#', ''),
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.previous,
                versionId,
              }),
            );
          }
          break;
        default:
      }
    }
  };

  componentDidMount() {
    const { _document } = this.props;

    _document.addEventListener('keydown', this.keydownListener);
  }

  componentWillUnmount() {
    const { _document } = this.props;

    _document.removeEventListener('keydown', this.keydownListener);
  }

  render() {
    return (
      <div className={styles.KeyboardShortcuts}>
        <dl className={styles.definitions}>
          <dt>
            <kbd>k</kbd>
          </dt>
          <dd>{gettext('Up file')}</dd>
          <dt>
            <kbd>j</kbd>
          </dt>
          <dd>{gettext('Down file')}</dd>
          <dt>
            <kbd>o</kbd>
          </dt>
          <dd>{gettext('Open all folders')}</dd>
          <dt>
            <kbd>c</kbd>
          </dt>
          <dd>{gettext('Close all folders')}</dd>
        </dl>
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps & RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { history, location, match, versionId } = ownProps;
  const addonId = parseInt(match.params.addonId, 10);
  const baseVersionId = parseInt(match.params.baseVersionId, 10);
  const headVersionId = parseInt(match.params.headVersionId, 10);
  const path = getPathFromQueryString(history) || undefined;

  let compareInfo = null;

  if (addonId && baseVersionId && headVersionId) {
    compareInfo = getCompareInfo(
      state.versions,
      addonId,
      baseVersionId,
      headVersionId,
      path,
    );
  }

  const tree = getTree(state.fileTree, versionId);
  if (!tree) {
    // TODO: Do not rely on <FileTree> to actually load the data.
    // This will be fixed in:
    // https://github.com/mozilla/addons-code-manager/issues/678
    log.warn(`No tree was loaded for version:`, versionId);
  }

  return {
    compareInfo,
    currentAnchor: location.hash,
    pathList: tree && tree.pathList,
  };
};

export default withRouter(
  connect(mapStateToProps)(KeyboardShortcutsBase),
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
