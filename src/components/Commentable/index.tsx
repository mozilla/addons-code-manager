import * as React from 'react';
import makeClassName from 'classnames';

import AddComment, { PublicProps as AddCommentProps } from './AddComment';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

export type ChildrenArgValue = JSX.Element;

export type PublicProps = {
  addCommentClassName?: string;
  as: React.ReactType;
  children: (addComment: ChildrenArgValue) => AnyReactNode;
  className?: string;
  id?: string;
  shellRef?: (element: HTMLElement | null) => void;
} & AddCommentProps;

// This represents something that can be commented on, such as a line of code.
export const CommentableBase = ({
  addCommentClassName,
  as: AsComponent,
  children,
  className,
  fileName,
  id,
  line,
  shellRef,
  versionId,
}: PublicProps) => {
  return (
    <AsComponent
      className={makeClassName(styles.commentable, className)}
      id={id}
      ref={shellRef}
    >
      {children(
        <AddComment
          className={addCommentClassName}
          versionId={versionId}
          fileName={fileName}
          line={line}
        />,
      )}
    </AsComponent>
  );
};

export default CommentableBase;
