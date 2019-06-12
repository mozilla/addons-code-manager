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
  goToRelativeDiff,
} from '../../reducers/versions';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import styles from './styles.module.scss';
import { gettext } from '../../utils';

export const supportedKeys: { [key: string]: string | null } = {
  k: gettext('Up file'),
  j: gettext('Down file'),
  o: gettext('Open all folders'),
  e: null, // same as 'o'
  c: gettext('Close all folders'),
  n: gettext('Next change'),
  p: gettext('Previous change'),
  h: gettext('Hide file tree'),
};

export type PublicProps = {
  compareInfo: CompareInfo | null | void;
  currentPath: string;
  versionId: number;
};

type PropsFromState = {
  currentAnchor: string;
  pathList: FileTree['pathList'] | void;
};

export type DefaultProps = {
  _document: typeof document;
  _goToRelativeDiff: typeof goToRelativeDiff;
  _goToRelativeFile: typeof goToRelativeFile;
};

type Props = RouteComponentProps &
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
      Object.keys(supportedKeys).includes(event.key)
    ) {
      event.preventDefault();

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
                currentAnchor,
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.next,
                versionId,
              }),
            );
          } else {
            log.warn('Cannot navigate to next change without diff loaded');
          }
          break;
        case 'p':
          if (compareInfo) {
            dispatch(
              _goToRelativeDiff({
                currentAnchor,
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.previous,
                versionId,
              }),
            );
          } else {
            log.warn('Cannot navigate to previous change without diff loaded');
          }
          break;
        case 'h':
          dispatch(fullscreenGridActions.toggleMainSidePanel());
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

  makeClassNameForKey(key: string) {
    // `n` and `p` are the keys for navigating a diff.
    if (['n', 'p'].includes(key) && !this.props.compareInfo) {
      return styles.disabled;
    }

    return '';
  }

  render() {
    return (
      <div className={styles.KeyboardShortcuts}>
        <dl className={styles.definitions}>
          {Object.keys(supportedKeys)
            // exlude alias keys
            .filter((key) => supportedKeys[key] !== null)
            .map((key) => {
              const className = this.makeClassNameForKey(key);

              return (
                <React.Fragment key={key}>
                  <dt className={className}>
                    <kbd>{key}</kbd>
                  </dt>
                  <dd className={className}>{supportedKeys[key]}</dd>
                </React.Fragment>
              );
            })}
        </dl>
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps & RouteComponentProps,
): PropsFromState => {
  const { location, versionId } = ownProps;

  const tree = getTree(state.fileTree, versionId);
  if (!tree) {
    // TODO: Do not rely on <FileTree> to actually load the data.
    // This will be fixed in:
    // https://github.com/mozilla/addons-code-manager/issues/678
    log.warn(`No tree was loaded for version:`, versionId);
  }

  return {
    currentAnchor: location.hash.replace(/^#/, ''),
    pathList: tree && tree.pathList,
  };
};

export default withRouter(
  connect(mapStateToProps)(KeyboardShortcutsBase),
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
