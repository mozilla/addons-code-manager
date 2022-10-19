import * as React from 'react';

import styles from './styles.module.scss';

export type PublicProps = {
  children: JSX.Element;
  fade: boolean;
};

function FadableContentBase({ children, fade }: PublicProps) {
  if (!fade) {
    return children;
  }

  return <div className={styles.shell}>{children}</div>;
}

export default FadableContentBase;
