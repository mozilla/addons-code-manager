import * as React from 'react';
import makeClassName from 'classnames';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type PublicProps = {
  children?: AnyReactNode;
  className?: string;
};

type Props = PublicProps;

export enum PanelAttribs {
  altSidePanel = 'altSidePanel',
  mainSidePanel = 'mainSidePanel',
}

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

export const FullscreenGridBase = ({ children, className }: Props) => {
  return (
    <div className={makeClassName(styles.FullscreenGrid, className)}>
      {children}
    </div>
  );
};

export default FullscreenGridBase;
