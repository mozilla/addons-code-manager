import * as React from 'react';
import { connect } from 'react-redux';

import { ConnectedReduxProps } from '../../configureStore';
import {
  PathList,
  RelativePathPosition,
  goToRelativeFile,
} from '../../reducers/fileTree';
import { actions as versionsActions } from '../../reducers/versions';
import styles from './styles.module.scss';
import { gettext } from '../../utils';

const keys = ['k', 'j', 'e', 'c', 'h'];

export type PublicProps = {
  currentPath: string;
  pathList: PathList;
  versionId: number;
};

export type DefaultProps = {
  _goToRelativeFile: typeof goToRelativeFile;
};

type Props = PublicProps & DefaultProps & ConnectedReduxProps;

export class KeyboardShortcutsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
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
        case 'e':
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
    document.addEventListener('keydown', this.keydownListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydownListener);
  }

  render() {
    return (
      <div className={styles.KeyboardShortcuts}>
        <h4>{gettext('Keyboard Shortcuts')}</h4>

        <dl>
          <dt>k</dt>
          <dd>{gettext('Up file')}</dd>
          <dt>j</dt>
          <dd>{gettext('Down file')}</dd>
          <dt>e</dt>
          <dd>{gettext('Open all folders')}</dd>
          <dt>c</dt>
          <dd>{gettext('Close all folders')}</dd>
          <dt>h</dt>
          <dd>{gettext('Hide or unhide tree')}</dd>
        </dl>
      </div>
    );
  }
}

export default connect()(KeyboardShortcutsBase);
