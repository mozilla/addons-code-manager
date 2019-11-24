import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Commentable from '../src/components/Commentable';
import { renderWithStoreAndRouter } from './utils';

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

storiesOf('Commentable', module).add('default', () => (
  <>
    {renderRow({ line: 1, content: 'This is line 1' })}
    {renderRow({ line: 2, content: 'This is line 2' })}
    {renderRow({ line: 3, content: 'This is line 3' })}
  </>
));
