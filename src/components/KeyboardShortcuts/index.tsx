import * as React from 'react';

import styles from './styles.module.scss';
import { gettext } from '../../utils';

const keys = ['k', 'j', 'e', 'h'];

type Props = {};

export class KeyboardShortcutsBase extends React.Component<Props> {
  keydownListener = (event: KeyboardEvent) => {
    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      keys.includes(event.key)
    ) {
      console.log(event);
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
          <dd>{gettext('Expand or collapse all')}</dd>
          <dt>h</dt>
          <dd>{gettext('Hide or unhide tree')}</dd>
        </dl>
      </div>
    );
  }
}

export default KeyboardShortcutsBase;
