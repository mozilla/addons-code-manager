import * as React from 'react';
import makeClassName from 'classnames';

import styles from './styles.module.scss';

type PanelProps = {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
};

export const Header = ({ children, className }: PanelProps) => {
  return (
    <div className={makeClassName(styles.Header, className)}>{children}</div>
  );
};

export const NavPanel = ({ children, className }: PanelProps) => {
  return (
    <div className={makeClassName(styles.NavPanel, className)}>{children}</div>
  );
};

export const AltPanel = ({ children, className }: PanelProps) => {
  return (
    <div className={makeClassName(styles.AltPanel, className)}>{children}</div>
  );
};

export const ContentPanel = ({ children, className }: PanelProps) => {
  return (
    <div className={makeClassName(styles.ContentPanel, className)}>
      {children}
    </div>
  );
};

const FullscreenGrid = ({ children, className }: PanelProps) => {
  return (
    <div className={makeClassName(styles.FullscreenGrid, className)}>
      {children}
    </div>
  );
};

export default FullscreenGrid;
