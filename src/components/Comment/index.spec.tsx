import * as React from 'react';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { actions } from '../../reducers/comments';
import {
  createFakeExternalComment,
  createFakeChangeEvent,
  createFakeEvent,
  createFakeThunk,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import Comment, { CommentBase, DefaultProps, PublicProps } from '.';

describe(__filename, () => {
  type RenderParams = { store?: Store } & Partial<PublicProps> &
    Partial<DefaultProps>;

  const render = ({
    store = configureStore(),
    commentId = null,
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      addonId: 1,
      commentId,
      fileName: null,
      line: null,
      readOnly: false,
      versionId: 2,
      ...moreProps,
    };
    return shallowUntilTarget(<Comment {...props} />, CommentBase, {
      shallowOptions: { context: { store } },
    });
  };

  const dispatchComment = ({
    store = configureStore(),
    comment = createFakeExternalComment(),
    fileName = null,
    line = null,
    versionId = 1,
  } = {}) => {
    store.dispatch(actions.setComment({ fileName, line, versionId, comment }));
    return { store };
  };

  const createFakeTextareaRef = (currentProps = {}) => {
    return {
      ...React.createRef(),
      current: {
        ...document.createElement('textarea'),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        focus: jest.fn(),
        ...currentProps,
      },
    };
  };

  it('requires a comment when readOnly=true', () => {
    expect(() => render({ readOnly: true, commentId: null })).toThrow(
      /initialComment for commentId=null cannot be empty/,
    );
  });

  it('throws when a commentId is not mapped to a comment', () => {
    expect(() => render({ readOnly: false, commentId: 1 })).toThrow(
      /No comment was mapped/,
    );
  });

  it('renders a comment when readOnly=true', () => {
    const content = 'Example of a comment';
    const comment = createFakeExternalComment({ comment: content });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId: comment.id, store, readOnly: true });

    expect(root.find(`.${styles.form}`)).toHaveLength(0);
    expect(root.find(`.${styles.comment}`)).toHaveLength(1);
    expect(root.find(`.${styles.comment}`).html()).toContain(content);
    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
  });

  it('sanitizes the content of a comment', () => {
    const comment = createFakeExternalComment({ comment: '<span>foo</span>' });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId: comment.id, store, readOnly: true });

    expect(root.find(`.${styles.comment}`).html()).not.toContain(
      comment.comment,
    );
    // HTML `span` are removed.
    expect(root.find(`.${styles.comment}`).html()).toContain('foo');
  });

  it('converts new lines within a comment to breaks', () => {
    const firstLine = 'Example comment spanning';
    const secondLine = 'multiple lines';
    const comment = createFakeExternalComment({
      comment: `${firstLine}\n${secondLine}`,
    });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId: comment.id, store, readOnly: true });

    const html = root.find(`.${styles.comment}`).html();
    expect(html).toContain(`${firstLine}<br>${secondLine}`);
  });

  it('renders a form to edit a comment when readOnly=false', () => {
    const comment = createFakeExternalComment({ comment: 'Example' });
    const { store } = dispatchComment({ comment });
    const root = render({ commentId: comment.id, store, readOnly: false });

    expect(root.find(`.${styles.form}`)).toHaveLength(1);
    expect(root.find(`.${styles.comment}`)).toHaveLength(0);
    const textarea = root.find(`.${styles.textarea}`);
    expect(textarea).toHaveLength(1);
    expect(textarea).toHaveProp('disabled', false);
    expect(textarea).toHaveProp('value', comment.comment);

    const button = root.find(Button);
    expect(button).toHaveProp('disabled', false);
    expect(button).toHaveText('Save');
  });

  it('focuses on mount when a textarea ref exists', () => {
    const focus = jest.fn();
    render({ createTextareaRef: () => createFakeTextareaRef({ focus }) });

    expect(focus).toHaveBeenCalled();
  });

  it('submits a new comment', () => {
    const addonId = 222;
    const fileName = 'manifest.json';
    const line = 432;
    const versionId = 321;
    const store = configureStore();
    const dispatchSpy = spyOn(store, 'dispatch');

    const fakeThunk = createFakeThunk();
    const _manageComment = fakeThunk.createThunk;

    const commentText = 'Example of a comment';

    const root = render({
      _manageComment,
      addonId,
      fileName,
      line,
      store,
      versionId,
    });

    root.find(`.${styles.textarea}`).simulate(
      'change',
      createFakeChangeEvent({
        name: 'input',
        value: commentText,
      }),
    );

    root.find(`.${styles.form}`).simulate('submit', createFakeEvent());

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_manageComment).toHaveBeenCalledWith({
      addonId,
      cannedResponseId: undefined,
      comment: commentText,
      commentId: undefined,
      fileName,
      line,
      versionId,
    });
  });

  it('renders a pending state while saving a comment', () => {
    const keyParams = { fileName: null, line: null, versionId: 1 };
    const pendingCommentText = 'Example of a comment being edited';
    const store = configureStore();
    store.dispatch(
      actions.beginSaveComment({ ...keyParams, pendingCommentText }),
    );

    const root = render({ readOnly: false, store, ...keyParams });

    const textarea = root.find(`.${styles.textarea}`);
    expect(textarea).toHaveProp('disabled', true);
    expect(textarea).toHaveProp('value', pendingCommentText);

    const button = root.find(Button);
    expect(button).toHaveProp('disabled', true);
    expect(button).toHaveText('Saving…');
  });

  it('seeds the form with an initial comment', () => {
    const commentId = 1;
    const commentText = 'Example of a previously saved comment';
    const comment = createFakeExternalComment({
      id: commentId,
      comment: commentText,
    });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId, store });

    expect(root.find(`.${styles.textarea}`)).toHaveProp('value', commentText);
  });

  it('seeds the form with initialCommentText', () => {
    const keyParams = { fileName: null, line: null, versionId: 1 };
    const pendingCommentText = 'Example of a comment being edited';
    const store = configureStore();
    store.dispatch(
      actions.beginSaveComment({ ...keyParams, pendingCommentText }),
    );

    const root = render({ store, ...keyParams });

    expect(root.find(`.${styles.textarea}`)).toHaveProp(
      'value',
      pendingCommentText,
    );
  });

  it('lets you update a previously saved comment', () => {
    const commentId = 1;
    const previousCommentText = 'Example of a previously saved comment';
    const comment = createFakeExternalComment({
      id: commentId,
      comment: previousCommentText,
    });
    const { store } = dispatchComment({ comment });
    const dispatchSpy = spyOn(store, 'dispatch');

    const commentText = 'Example of an edited comment';

    const fakeThunk = createFakeThunk();
    const _manageComment = fakeThunk.createThunk;

    const root = render({
      _manageComment,
      commentId,
      store,
    });

    const textarea = root.find(`.${styles.textarea}`);
    expect(textarea).toHaveProp('value', previousCommentText);

    textarea.simulate(
      'change',
      createFakeChangeEvent({
        name: 'input',
        value: commentText,
      }),
    );

    root.find(`.${styles.form}`).simulate('submit', createFakeEvent());

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_manageComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment: commentText,
        commentId: comment.id,
      }),
    );
  });

  describe('keydown protection', () => {
    it('adds keydown listeners on mount', () => {
      const fakeRef = createFakeTextareaRef();
      const root = render({ createTextareaRef: () => fakeRef });

      expect(fakeRef.current.addEventListener).toHaveBeenCalledWith(
        'keydown',
        (root.instance() as CommentBase).keydownListener,
      );
    });

    it('stops propagating keydown events', () => {
      const fakeRef = createFakeTextareaRef();
      render({ createTextareaRef: () => fakeRef });

      expect(fakeRef.current.addEventListener).toHaveBeenCalled();
      const listenToKeydown = fakeRef.current.addEventListener.mock.calls[0][1];

      const fakeEvent = createFakeEvent();
      listenToKeydown(fakeEvent);

      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    });

    it('removes keydown event listeners on unmount', () => {
      const fakeRef = createFakeTextareaRef();
      const root = render({ createTextareaRef: () => fakeRef });
      const { keydownListener } = root.instance() as CommentBase;
      root.unmount();

      expect(fakeRef.current.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        keydownListener,
      );
    });

    it('does not add/remove listeners with an undefined ref', () => {
      // Make sure this doesn't throw an error.
      const root = render({ createTextareaRef: () => undefined });
      root.unmount();
    });

    it('does not add/remove listeners with a null DOM node', () => {
      // Make sure this doesn't throw an error.
      const root = render({ createTextareaRef: () => React.createRef() });
      root.unmount();
    });
  });
});
