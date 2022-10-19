import * as React from 'react';
import makeClassName from 'classnames';

import styles from './styles.module.scss';

type PublicProps = {
  className?: string;
};

function SkeletonBase({ className }: PublicProps) {
  return <div className={makeClassName(styles.skeleton, className)} />;
}

export default SkeletonBase;
