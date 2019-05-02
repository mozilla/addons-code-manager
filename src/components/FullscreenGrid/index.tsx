import * as React from 'react';
import makeClassName from 'classnames';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

export const Header = ({
  children,
  className,
}: {
  children?: AnyReactNode;
  className?: string;
}) => {
  return (
    <header className={makeClassName(styles.Header, className)}>
      {children}
    </header>
  );
};

type ContentShellProps = {
  altSidePanel?: AnyReactNode;
  altSidePanelClass?: string;
  children?: AnyReactNode;
  className?: string;
  mainSidePanel?: AnyReactNode;
  mainSidePanelClass?: string;
};

export const ContentShell = ({
  altSidePanel,
  altSidePanelClass,
  children,
  className,
  mainSidePanel,
  mainSidePanelClass,
}: ContentShellProps) => {
  return (
    <React.Fragment>
      <aside
        className={makeClassName(styles.mainSidePanel, mainSidePanelClass)}
      >
        {mainSidePanel}
      </aside>
      <main className={makeClassName(styles.content, className)}>
        {children}
      </main>
      <aside className={makeClassName(styles.altSidePanel, altSidePanelClass)}>
        {altSidePanel}
      </aside>
    </React.Fragment>
  );
};

const FullscreenGrid = ({
  children,
  className,
}: {
  children?: AnyReactNode;
  className?: string;
}) => {
  return (
    <div className={makeClassName(styles.FullscreenGrid, className)}>
      {children}
    </div>
  );
};

export default FullscreenGrid;
