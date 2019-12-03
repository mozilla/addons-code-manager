import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import Comment, {
  PublicProps as CommentProps,
} from '../src/components/Comment';
import {
  ExternalComment,
  actions as commentsActions,
} from '../src/reducers/comments';
import { createFakeExternalComment } from '../src/test-helpers';
import { loremIpsum, renderWithStoreAndRouter } from './utils';

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
  store = configureStore(),
  versionId = 2,
  ...moreProps
}: Partial<CommentProps> & {
  considerDelete?: boolean;
  deleting?: boolean;
  initialComment?: ExternalComment;
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
  const props = {
    addonId: 1,
    commentId,
    readOnly: false,
    ...key,
    ...moreProps,
  };
  return renderWithStoreAndRouter(<Comment {...props} />, { store });
};

storiesOf('Comment', module)
  .addWithChapters('form variants', {
    chapters: [
      {
        sections: [
          {
            title: 'adding a new comment',
            sectionFn: () => render({ readOnly: false }),
          },
          {
            title: 'editing a comment',
            sectionFn: () =>
              render({ initialComment: fakeComment, readOnly: false }),
          },
          {
            title: 'saving a comment',
            sectionFn: () => {
              const keyParams = {
                commentId: undefined,
                fileName: null,
                line: null,
                versionId: 1,
              };
              const store = configureStore();
              store.dispatch(
                commentsActions.beginSaveComment({
                  ...keyParams,
                  pendingCommentText:
                    'This call to browser.getFuzzTabs() has been deprecated.',
                }),
              );
              return render({ ...keyParams, store, readOnly: false });
            },
          },
          {
            title: 'consider discarding a comment',
            sectionFn: () => {
              const keyParams = {
                commentId: undefined,
                fileName: null,
                line: null,
                versionId: 1,
              };
              const store = configureStore();
              store.dispatch(commentsActions.considerDiscardComment(keyParams));
              return render({
                ...keyParams,
                initialComment: fakeComment,
                store,
                readOnly: false,
              });
            },
          },
        ],
      },
    ],
  })
  .addWithChapters('read-only variants', {
    chapters: [
      {
        sections: [
          {
            title: 'viewing an existing comment',
            sectionFn: () =>
              render({
                initialComment: {
                  ...fakeComment,
                  comment: 'This is not allowed.',
                },
                readOnly: true,
              }),
          },
          {
            title: 'viewing a multi-line comment',
            sectionFn: () =>
              render({ initialComment: fakeComment, readOnly: true }),
          },
          {
            title: 'viewing a very long comment',
            sectionFn: () =>
              render({
                initialComment: {
                  ...fakeComment,
                  comment: loremIpsum.replace(/[\n\s]+/g, ''),
                },
                readOnly: true,
              }),
          },
          {
            title: 'consider deleting a comment',
            sectionFn: () => {
              return render({
                considerDelete: true,
                initialComment: {
                  ...fakeComment,
                  id: 321,
                  comment: 'This function call is dangerous.',
                },
                readOnly: true,
              });
            },
          },
          {
            title: 'deleting a comment',
            sectionFn: () => {
              return render({
                deleting: true,
                initialComment: {
                  ...fakeComment,
                  id: 321,
                  comment: 'This function call is dangerous.',
                },
                readOnly: true,
              });
            },
          },
        ],
      },
    ],
  });
