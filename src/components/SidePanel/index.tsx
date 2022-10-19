import * as React from 'react';
import makeClassName from 'classnames';

import ToggleButton from '../ToggleButton';
import { gettext } from '../../utils';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

export type PublicProps = {
  borderless?: boolean;
  children: AnyReactNode;
  className: string;
  isExpanded: boolean;
  onClick: () => void;
  toggleLeft: boolean;
};

export function SidePanelBase({
  borderless = false,
  children,
  className,
  isExpanded,
  onClick,
  toggleLeft,
}: PublicProps) {
  const collapseText = gettext('Collapse this panel');

  return (
    <aside
      className={makeClassName(styles.SidePanel, className, {
        [styles.isCollapsed]: !isExpanded,
      })}
    >
      <div
        className={makeClassName(styles.content, {
          [styles.borderlessContent]: borderless,
        })}
      >
        {children}
      </div>

      <ToggleButton
        className={styles.ToggleButton}
        label={isExpanded ? collapseText : null}
        onClick={onClick}
        title={isExpanded ? collapseText : gettext('Expand this panel')}
        toggleLeft={toggleLeft}
      />
    </aside>
  );
}

export default SidePanelBase;
