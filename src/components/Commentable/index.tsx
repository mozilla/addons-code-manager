import * as React from 'react';
import makeClassName from 'classnames';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

export type PublicProps = {
  as: React.ReactType;
  children?: AnyReactNode;
  className?: string;
  id?: string;
};

// This represents something that can be commented on, such as a line of code.
const CommentableBase = ({
  as: AsComponent,
  children,
  className,
  id,
}: PublicProps) => {
  return (
    <AsComponent
      className={makeClassName(styles.commentable, className)}
      id={id}
    >
      {children}
    </AsComponent>
  );
};

export default CommentableBase;
