import * as React from 'react';
import { Store } from 'redux';

import Comment from '../Comment';
import configureStore from '../../configureStore';
import {
  ExternalComment,
  actions as commentsActions,
} from '../../reducers/comments';
import {
  createFakeExternalComment,
  dispatchComments,
  shallowUntilTarget,
} from '../../test-helpers';

import CommentList, { CommentListBase, PublicProps } from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> & { store?: Store };

  const render = ({
    addonId = 1,
    children = (content: JSX.Element) => content,
    fileName = null,
    line = null,
    versionId = 2,
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      addonId,
      children,
      fileName,
      line,
      versionId,
      ...moreProps,
    };
    return shallowUntilTarget(<CommentList {...props} />, CommentListBase, {
      shallowOptions: { context: { store } },
    });
  };

  const keyParams = Object.freeze({ fileName: null, line: null, versionId: 1 });

  const renderComments = ({
    comments = [createFakeExternalComment()],
    fileName,
    line,
    versionId,
    ...props
  }: RenderParams & { comments?: ExternalComment[] } = {}) => {
    if (
      fileName !== undefined ||
      line !== undefined ||
      versionId !== undefined
    ) {
      throw new Error('Defining custom key parameters is not supported');
    }
    const { store } = dispatchComments({ ...keyParams, comments });

    return render({ ...keyParams, store, ...props });
  };

  it('lets you add a custom class', () => {
    const className = 'ExampleClass';
    const root = renderComments({ className });

    expect(root).toHaveClassName(className);
  });

  it('renders null when no comments exist', () => {
    expect(render()).toBeEmptyRender();
  });

  it('renders saved comments', () => {
    const addonId = 3214;
    const comments = [
      createFakeExternalComment({ id: 1 }),
      createFakeExternalComment({ id: 2 }),
    ];
    const { store } = dispatchComments({ ...keyParams, comments });

    const root = render({ ...keyParams, addonId, store });

    const list = root.find(Comment);
    expect(list).toHaveLength(comments.length);
    expect(list.at(0)).toHaveProp('commentId', comments[0].id);
    expect(list.at(1)).toHaveProp('commentId', comments[1].id);

    // Check one sample to make sure it's configured:
    const sample = list.at(1);
    expect(sample).toHaveProp('readOnly', true);
    expect(sample).toHaveProp('addonId', addonId);
    expect(sample).toHaveProp('fileName', keyParams.fileName);
    expect(sample).toHaveProp('line', keyParams.line);
    expect(sample).toHaveProp('versionId', keyParams.versionId);
  });

  it('renders a comment entry form', () => {
    const addonId = 3214;
    const store = configureStore();
    store.dispatch(commentsActions.beginComment(keyParams));

    const root = render({ ...keyParams, addonId, store });

    const comment = root.find(Comment);

    expect(comment).toHaveLength(1);
    expect(comment).toHaveProp('readOnly', false);
    expect(comment).toHaveProp('commentId', null);
    expect(comment).toHaveProp('addonId', addonId);
    expect(comment).toHaveProp('fileName', keyParams.fileName);
    expect(comment).toHaveProp('line', keyParams.line);
    expect(comment).toHaveProp('versionId', keyParams.versionId);
  });

  it('renders a comment entry form and comments', () => {
    const savedCommentId1 = 1;
    const savedCommentId2 = 2;
    const store = configureStore();

    store.dispatch(commentsActions.beginComment(keyParams));
    dispatchComments({
      ...keyParams,
      comments: [
        createFakeExternalComment({ id: savedCommentId1 }),
        createFakeExternalComment({ id: savedCommentId2 }),
      ],
      store,
    });

    const root = render({ ...keyParams, store });

    const list = root.find(Comment);
    expect(list).toHaveLength(3);

    // Check the from entry.
    expect(list.at(0)).toHaveProp('readOnly', false);
    expect(list.at(0)).toHaveProp('commentId', null);

    // Check the saved comments.
    expect(list.at(1)).toHaveProp('readOnly', true);
    expect(list.at(1)).toHaveProp('commentId', savedCommentId1);

    expect(list.at(2)).toHaveProp('readOnly', true);
    expect(list.at(2)).toHaveProp('commentId', savedCommentId2);
  });

  it('can render comments in a custom wrapper', () => {
    const className = 'ExampleClass';
    const comments = [createFakeExternalComment()];

    const root = renderComments({
      children: (content: JSX.Element) => {
        return <div className={className}>{content}</div>;
      },
      comments,
    });

    expect(root).toHaveClassName(className);
    expect(root.find(Comment)).toHaveLength(comments.length);
  });

  it('does not render in the custom wrapper without any output', () => {
    const className = 'ExampleClass';

    const root = render({
      children: (content: JSX.Element) => {
        return <div className={className}>{content}</div>;
      },
    });

    expect(root).not.toHaveClassName(className);
    expect(root).toBeEmptyRender();
  });

  it('does not render comments for different keys', () => {
    const keyBase = { fileName: null, line: null };
    const versionId1 = 1;
    const versionId2 = 2;

    const store = configureStore();

    const otherKeyParams = { ...keyBase, versionId: versionId1 };
    store.dispatch(commentsActions.beginComment(otherKeyParams));
    dispatchComments({
      ...otherKeyParams,
      comments: [
        createFakeExternalComment({ id: 1 }),
        createFakeExternalComment({ id: 2 }),
      ],
      store,
    });

    // Render for a different versionId.
    const root = render({ ...keyBase, versionId: versionId2, store });

    expect(root.find(Comment)).toHaveLength(0);
    expect(root).toBeEmptyRender();
  });
});
