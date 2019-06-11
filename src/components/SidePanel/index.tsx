import * as React from 'react';
import makeClassName from 'classnames';

import ToggleButton from '../ToggleButton';
import { gettext } from '../../utils';
import { AnyReactNode } from '../../typeUtils';

import styles from './styles.module.scss';

export type PublicProps = {
  children: AnyReactNode;
  className: string;
  isExpanded: boolean;
  onClick: () => void;
  toggleLeft: boolean;
};

export const SidePanelBase = ({
  children,
  className,
  isExpanded,
  onClick,
  toggleLeft,
}: PublicProps) => {
  return (
    <aside
      aria-expanded={isExpanded ? 'true' : 'false'}
      className={makeClassName(className, {
        [styles.isCollapsed]: !isExpanded,
      })}
    >
      <div className={styles.content}>{children}</div>

      <ToggleButton
        className={styles.ToggleButton}
        label={isExpanded ? gettext('Collapse this panel') : null}
        onClick={onClick}
        title={
          isExpanded
            ? gettext('Collapse this panel')
            : gettext('Expand this panel')
        }
        toggleLeft={toggleLeft}
      />
    </aside>
  );
};

export default SidePanelBase;
