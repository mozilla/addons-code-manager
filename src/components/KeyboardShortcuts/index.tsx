import log from 'loglevel';
import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  FileTree,
  RelativePathPosition,
  getTree,
  goToRelativeFile,
} from '../../reducers/fileTree';
import { actions as versionsActions } from '../../reducers/versions';
import styles from './styles.module.scss';
import { gettext } from '../../utils';

const keys = ['k', 'j', 'e', 'o', 'c'];

export type PublicProps = {
  currentPath: string;
  versionId: number;
};

type PropsFromState = {
  pathList: FileTree['pathList'] | void;
};

export type DefaultProps = {
  _document: typeof document;
  _goToRelativeFile: typeof goToRelativeFile;
};

type Props = PublicProps & PropsFromState & DefaultProps & ConnectedReduxProps;

export class KeyboardShortcutsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _document: document,
    _goToRelativeFile: goToRelativeFile,
  };

  keydownListener = (event: KeyboardEvent) => {
    const {
      _goToRelativeFile,
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
  ownProps: PublicProps,
): PropsFromState => {
  const { versionId } = ownProps;

  const tree = getTree(state.fileTree, versionId);
  if (!tree) {
    // TODO: Do not rely on <FileTree> to actually load the data.
    // This will be fixed in:
    // https://github.com/mozilla/addons-code-manager/issues/678
    log.warn(`No tree was loaded for version:`, versionId);
  }

  return { pathList: tree && tree.pathList };
};

export default connect(mapStateToProps)(
  KeyboardShortcutsBase,
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
