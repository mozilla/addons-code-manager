import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import {
  ExternalComment,
  actions as commentsActions,
} from '../../reducers/comments';
import { createFakeExternalComment } from '../../test-helpers';
import { loremIpsum, renderWithStoreAndRouter } from '../../storybook-utils';

import Comment, { CommentBase, PublicProps as CommentProps } from '.';

const fakeComment = createFakeExternalComment({
  comment: [
    'The use of `eval()` is dangerous. ',
    "It looks like you don't even need it here.",
    '\n',
    'Maybe you could remove it?',
  ].join(''),
});

const render = ({
  considerDelete = false,
  deleting = false,
  fileName = null,
  initialComment,
  line = null,
  beginComment = false,
  store = configureStore(),
  versionId = 2,
  ...moreProps
}: Partial<CommentProps> & {
  considerDelete?: boolean;
  deleting?: boolean;
  initialComment?: ExternalComment;
  beginComment?: boolean;
  store?: Store;
} = {}) => {
  const key = { fileName, line, versionId };

  let commentId = null;
  if (initialComment) {
    store.dispatch(
      commentsActions.setComments({ ...key, comments: [initialComment] }),
    );
    commentId = initialComment.id;

    if (considerDelete) {
      store.dispatch(commentsActions.considerDeleteComment({ commentId }));
    }
    if (deleting) {
      store.dispatch(commentsActions.beginDeleteComment({ commentId }));
    }
  }

  if (beginComment) {
    store.dispatch(
      commentsActions.beginComment({
        commentId: commentId || undefined,
        fileName,
        line,
        versionId,
      }),
    );
  }
  const props = {
    addonId: 1,
    commentId,
    ...key,
    ...moreProps,
  };
  return renderWithStoreAndRouter(<Comment {...props} />, { store });
};

export default {
  title: 'Components/Comment',
  component: CommentBase,
} as Meta;

export const AddingANewComment = () => render({ beginComment: true });

export const EditingAComment = () =>
  render({ initialComment: fakeComment, beginComment: true });

export const SavingAComment = () => {
  const keyParams = {
    commentId: undefined,
    fileName: null,
    line: null,
    versionId: 1,
  };
  const store = configureStore();
  store.dispatch(commentsActions.beginComment(keyParams));
  store.dispatch(
    commentsActions.beginSaveComment({
      ...keyParams,
      pendingCommentText:
        'This call to browser.getFuzzTabs() has been deprecated.',
    }),
  );

  return render({ ...keyParams, store });
};

export const ConsiderDiscardingAComment = () => {
  const keyParams = {
    commentId: undefined,
    fileName: null,
    line: null,
    versionId: 1,
  };
  const store = configureStore();
  store.dispatch(commentsActions.beginComment(keyParams));
  store.dispatch(commentsActions.considerDiscardComment(keyParams));
  return render({
    ...keyParams,
    initialComment: fakeComment,
    store,
  });
};

export const ViewingAnExistingComment = () =>
  render({
    initialComment: {
      ...fakeComment,
      comment: 'This is not allowed.',
    },
  });

export const ViewingAMultiLineComment = () =>
  render({ initialComment: fakeComment });

export const ViewingAVeryLongComment = () =>
  render({
    initialComment: {
      ...fakeComment,
      comment: loremIpsum.replace(/[\n\s]+/g, ''),
    },
  });

export const ConsiderDeletingAComment = () => {
  return render({
    considerDelete: true,
    initialComment: {
      ...fakeComment,
      id: 321,
      comment: 'This function call is dangerous.',
    },
  });
};

export const DeletingAComment = () => {
  return render({
    deleting: true,
    initialComment: {
      ...fakeComment,
      id: 321,
      comment: 'This function call is dangerous.',
    },
  });
};
