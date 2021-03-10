import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import { AnyReactNode } from '../../typeUtils';
import {
  ExternalComment,
  actions as commentsActions,
} from '../../reducers/comments';
import { renderWithStoreAndRouter } from '../../storybook-utils';
import { createFakeExternalComment } from '../../test-helpers';

import CommentList, { PublicProps } from '.';

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

export default {
  title: 'Components/CommentList',
  component: CommentList,
} as Meta;

export const OneComment = () => {
  return render({
    comments: [
      createFakeExternalComment({
        id: 1,
        comment: 'This is unnecessary due to the reset library up above',
      }),
    ],
  });
};

export const MultipleComments = () => {
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
};

export const CommentEntryForm = () => {
  return render({ beginComment: true });
};

export const CommentEntryFormWithSavedComments = () => {
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
};
