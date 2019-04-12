import * as React from 'react';
import { connect } from 'react-redux';

import { ConnectedReduxProps } from '../../configureStore';
import {
  FileTree,
  RelativePathPosition,
  goToRelativeFile,
} from '../../reducers/fileTree';
import { actions as versionsActions } from '../../reducers/versions';
import styles from './styles.module.scss';
import { gettext } from '../../utils';

const keys = ['k', 'j', 'e', 'o', 'c'];

export type PublicProps = {
  currentPath: string;
  pathList: FileTree['pathList'];
  versionId: number;
};

export type DefaultProps = {
  _document: typeof document;
  _goToRelativeFile: typeof goToRelativeFile;
};

type Props = PublicProps & DefaultProps & ConnectedReduxProps;

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
        <h4>{gettext('Keyboard Shortcuts')}</h4>

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

export default connect()(KeyboardShortcutsBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
