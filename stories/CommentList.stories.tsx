import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import { AnyReactNode } from '../src/typeUtils';
import CommentList, { PublicProps } from '../src/components/CommentList';
import {
  ExternalComment,
  actions as commentsActions,
} from '../src/reducers/comments';
import { createFakeExternalComment } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const render = ({
  addonId = 1,
  beginComment = false,
  comments = [],
  fileName = null,
  line = null,
  store = configureStore(),
  versionId = 2,
  ...moreProps
}: Partial<PublicProps> & {
  beginComment?: boolean;
  store?: Store;
  comments?: ExternalComment[];
} = {}) => {
  if (beginComment) {
    store.dispatch(
      commentsActions.beginComment({
        commentId: undefined,
        fileName,
        line,
        versionId,
      }),
    );
  }
  for (const comment of comments) {
    store.dispatch(
      commentsActions.setComments({ versionId, comments: [comment] }),
    );
  }

  const indent = <>&nbsp;&nbsp;</>;
  const codeLine = (...content: AnyReactNode[]) => {
    return (
      <p>
        <code>{content}</code>
      </p>
    );
  };

  const props = {
    addonId,
    fileName,
    line,
    versionId,
    ...moreProps,
  };

  return renderWithStoreAndRouter(
    <div className="CommentListStory">
      {codeLine('body {')}
      {codeLine(indent, 'margin: 0;')}
      {codeLine(indent, 'padding: 0;')}

      <CommentList {...props}>{(content) => content}</CommentList>

      {codeLine(indent, 'background-color: "fuschia";')}
      {codeLine(indent, 'box-sizing: border-box;')}
      {codeLine('}')}

      {codeLine(indent)}

      {codeLine('button {')}
      {codeLine(indent, 'color: "blue";')}
      {codeLine('}')}
    </div>,
    { store },
  );
};

storiesOf('CommentList', module)
  .add('One comment', () => {
    return render({
      comments: [
        createFakeExternalComment({
          id: 1,
          comment: 'This is unnecessary due to the reset library up above',
        }),
      ],
    });
  })
  .add('Multiple comments', () => {
    return render({
      comments: [
        createFakeExternalComment({
          id: 1,
          comment: 'This is unnecessary due to the reset library up above',
        }),
        createFakeExternalComment({
          id: 2,
          comment: 'Thanks for promptly addressing our other change requests',
        }),
      ],
    });
  })
  .add('Comment entry form', () => {
    return render({ beginComment: true });
  })
  .add('Comment entry form with saved comments', () => {
    return render({
      beginComment: true,
      comments: [
        createFakeExternalComment({
          id: 1,
          comment: 'This is unnecessary due to the reset library up above',
        }),
        createFakeExternalComment({
          id: 2,
          comment: 'Thanks for promptly addressing our other change requests',
        }),
      ],
    });
  });
