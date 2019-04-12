import * as React from 'react';

import styles from './styles.module.scss';

type PublicProps = {
  children: React.ReactNode | React.ReactNode[];
};

type Props = PublicProps;

const FixedMetaNav = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default FixedMetaNav;
