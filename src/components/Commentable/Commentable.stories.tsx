import * as React from 'react';
import { Meta } from '@storybook/react';

import { renderWithStoreAndRouter } from '../../storybook-utils';

import Commentable, { CommentableBase } from '.';

const renderRow = ({ content, line }: { content: string; line: number }) => {
  return renderWithStoreAndRouter(
    <Commentable
      addCommentClassName="CommentableStory-addComment"
      as="div"
      className="CommentableStory-row"
      fileName="manifest.json"
      line={line}
      versionId={1}
    >
      {(addCommentButton) => (
        <>
          {addCommentButton}
          <div className="CommentableStory-content">{content}</div>
        </>
      )}
    </Commentable>,
  );
};

export default {
  title: 'Components/Commentable',
  component: CommentableBase,
} as Meta;

export const Default = () => (
  <>
    {renderRow({ line: 1, content: 'This is line 1' })}
    {renderRow({ line: 2, content: 'This is line 2' })}
    {renderRow({ line: 3, content: 'This is line 3' })}
  </>
);
