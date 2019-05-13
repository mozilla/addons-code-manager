import * as React from 'react';
import makeClassName from 'classnames';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type PublicProps = {
  altSidePanel?: AnyReactNode;
  altSidePanelClass?: string;
  children?: AnyReactNode;
  className?: string;
  mainSidePanel?: AnyReactNode;
  mainSidePanelClass?: string;
};

type Props = PublicProps;

export const ContentShellBase = ({
  altSidePanel,
  altSidePanelClass,
  children,
  className,
  mainSidePanel,
  mainSidePanelClass,
}: Props) => {
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

export default ContentShellBase;
