import log from 'loglevel';
import queryString from 'query-string';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { LinterProviderInfo } from '../LinterProvider';
import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  FileTree,
  RelativePathPosition,
  getTree,
  goToRelativeFile,
  goToRelativeMessage,
} from '../../reducers/fileTree';
import { LinterMessage } from '../../reducers/linter';
import {
  CompareInfo,
  actions as versionsActions,
  goToRelativeDiff,
} from '../../reducers/versions';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import styles from './styles.module.scss';
import {
  createCodeLineAnchorGetter,
  gettext,
  messageUidQueryParam,
} from '../../utils';

export const supportedKeys: { [key: string]: string | null } = {
  k: gettext('Up file'),
  j: gettext('Down file'),
  o: gettext('Open all folders'),
  e: null, // same as 'o'
  c: gettext('Close all folders'),
  n: gettext('Next change'),
  p: gettext('Previous change'),
  h: gettext('Toggle main side panel'),
  a: gettext('Previous linter message'),
  z: gettext('Next linter message'),
};

export type PublicProps = {
  compareInfo: CompareInfo | null | undefined;
  comparedToVersionId: number | null;
  currentPath: string;
  messageMap: LinterProviderInfo['messageMap'];
  versionId: number;
};

type PropsFromState = {
  currentAnchor: string;
  messageUid: LinterMessage['uid'];
  pathList: FileTree['pathList'] | undefined;
  selectedPath: string | undefined;
};

export type DefaultProps = {
  _createCodeLineAnchorGetter: typeof createCodeLineAnchorGetter;
  _document: typeof document;
  _goToRelativeDiff: typeof goToRelativeDiff;
  _goToRelativeFile: typeof goToRelativeFile;
  _goToRelativeMessage: typeof goToRelativeMessage;
};

type Props = RouteComponentProps &
  PropsFromState &
  PublicProps &
  DefaultProps &
  ConnectedReduxProps;

export class KeyboardShortcutsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _createCodeLineAnchorGetter: createCodeLineAnchorGetter,
    _document: document,
    _goToRelativeDiff: goToRelativeDiff,
    _goToRelativeFile: goToRelativeFile,
    _goToRelativeMessage: goToRelativeMessage,
  };

  keydownListener = (event: KeyboardEvent) => {
    const {
      _createCodeLineAnchorGetter,
      _goToRelativeDiff,
      _goToRelativeFile,
      _goToRelativeMessage,
      compareInfo,
      comparedToVersionId,
      currentAnchor,
      currentPath,
      dispatch,
      messageMap,
      messageUid,
      pathList,
      selectedPath,
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

      const getCodeLineAnchor = _createCodeLineAnchorGetter({ compareInfo });

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
          if (compareInfo && selectedPath) {
            dispatch(
              _goToRelativeDiff({
                currentAnchor,
                comparedToVersionId,
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.next,
                selectedPath,
                versionId,
              }),
            );
          } else {
            log.warn('Cannot navigate to next change without diff loaded');
          }
          break;
        case 'p':
          if (compareInfo && selectedPath) {
            dispatch(
              _goToRelativeDiff({
                currentAnchor,
                comparedToVersionId,
                diff: compareInfo.diff,
                pathList,
                position: RelativePathPosition.previous,
                selectedPath,
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
        case 'z':
          if (messageMap) {
            dispatch(
              _goToRelativeMessage({
                currentMessageUid: messageUid,
                currentPath,
                getCodeLineAnchor,
                messageMap,
                pathList,
                position: RelativePathPosition.next,
                versionId,
              }),
            );
          }
          break;
        case 'a':
          if (messageMap) {
            dispatch(
              _goToRelativeMessage({
                currentMessageUid: messageUid,
                currentPath,
                getCodeLineAnchor,
                messageMap,
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
  const messageUid = queryString.parse(location.search)[messageUidQueryParam];
  const { selectedPath } = state.versions;

  const tree = getTree(state.fileTree, versionId);
  if (!tree) {
    // TODO: Do not rely on <FileTree> to actually load the data.
    // This will be fixed in:
    // https://github.com/mozilla/addons-code-manager/issues/678
    log.warn(`No tree was loaded for version:`, versionId);
  }

  return {
    currentAnchor: location.hash.replace(/^#/, ''),
    messageUid: typeof messageUid === 'string' ? messageUid : '',
    pathList: tree && tree.pathList,
    selectedPath,
  };
};

export default withRouter(
  connect(mapStateToProps)(KeyboardShortcutsBase),
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
