import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Commentable from '../src/components/Commentable';
import AddComment from '../src/components/Commentable/AddComment';
import { renderWithStoreAndRouter } from './utils';

const renderRow = ({ content, line }: { content: string; line: number }) => {
  return renderWithStoreAndRouter(
    <Commentable as="div" className="CommentableStory-row">
      <AddComment
        className="CommentableStory-addComment"
        versionId={1}
        fileName="manifest.json"
        line={line}
      />
      <div className="CommentableStory-content">{content}</div>
    </Commentable>,
  );
};

storiesOf('Commentable', module).add('default', () => (
  <React.Fragment>
    {renderRow({ line: 1, content: 'This is line 1' })}
    {renderRow({ line: 2, content: 'This is line 2' })}
    {renderRow({ line: 3, content: 'This is line 3' })}
  </React.Fragment>
));
