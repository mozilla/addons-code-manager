import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { actions, createInternalComment } from '../../reducers/comments';
import {
  createFakeExternalComment,
  createFakeChangeEvent,
  createFakeEvent,
  createFakeThunk,
  dispatchComment,
  nextUniqueId,
  getInstance,
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
      addonId: nextUniqueId(),
      commentId,
      fileName: null,
      line: null,
      versionId: nextUniqueId(),
      ...moreProps,
    };

    return shallowUntilTarget(<Comment {...props} />, CommentBase, {
      shallowOptions: { context: { store } },
    });
  };

  const setUpStoreAndRender = ({
    beginEdit = false,
    commentId = null,
    fileName = null,
    line = null,
    store = configureStore(),
    versionId = nextUniqueId(),
    ...moreProps
  }: RenderParams & { beginEdit?: boolean } = {}) => {
    const keyParams = {
      commentId,
      fileName,
      line,
      versionId,
    };

    if (beginEdit) {
      store.dispatch(
        actions.beginComment({
          ...keyParams,
          commentId: commentId || undefined,
        }),
      );
    }

    const dispatchSpy = spyOn(store, 'dispatch');

    const root = render({ store, ...keyParams, ...moreProps });

    return { dispatchSpy, root };
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

  it('lets you set a custom class', () => {
    const className = 'ExampleClass';
    const { root } = setUpStoreAndRender({ beginEdit: true, className });

    expect(root).toHaveClassName(className);
  });

  it('requires a comment when it is rendered as read-only', () => {
    expect(() => render({ commentId: null })).toThrow(
      /Cannot get initialComment/,
    );
  });

  it('throws when a commentId is not mapped to a comment', () => {
    expect(() => render({ commentId: nextUniqueId() })).toThrow(
      /No comment was mapped/,
    );
  });

  it('renders a comment as read-only', () => {
    const content = 'Example of a comment';
    const comment = createFakeExternalComment({ comment: content });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId: comment.id, store });

    expect(root.find(`.${styles.form}`)).toHaveLength(0);
    expect(root.find(`.${styles.comment}`)).toHaveLength(1);
    expect(root.find(`.${styles.comment}`).html()).toContain(content);
    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
  });

  it('sanitizes the content of a comment', () => {
    const comment = createFakeExternalComment({ comment: '<span>foo</span>' });
    const { store } = dispatchComment({ comment });

    const root = render({ commentId: comment.id, store });

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

    const root = render({ commentId: comment.id, store });

    const html = root.find(`.${styles.comment}`).html();
    expect(html).toContain(`${firstLine}<br>${secondLine}`);
  });

  it('renders a form to edit a comment when beginComment has been dispatched', () => {
    const versionId = nextUniqueId();
    const comment = createFakeExternalComment({ comment: 'Example' });
    const { store } = dispatchComment({ comment, versionId });
    const { root } = setUpStoreAndRender({
      beginEdit: true,
      commentId: comment.id,
      store,
      versionId,
    });

    expect(root.find(`.${styles.form}`)).toHaveLength(1);
    expect(root.find(`.${styles.comment}`)).toHaveLength(0);
    const textarea = root.find(`.${styles.textarea}`);
    expect(textarea).toHaveLength(1);
    expect(textarea).toHaveProp('disabled', false);
    expect(textarea).toHaveProp('value', comment.comment);

    const button = root.find(`.${styles.saveButton}`);
    expect(button).toHaveProp('disabled', false);
    expect(button).toHaveText('Save');
  });

  it('focuses on mount when a textarea ref exists', () => {
    const focus = jest.fn();
    setUpStoreAndRender({
      beginEdit: true,
      createTextareaRef: () => createFakeTextareaRef({ focus }),
    });

    expect(focus).toHaveBeenCalled();
  });

  it('submits a new comment', () => {
    const addonId = nextUniqueId();
    const keyParams = {
      commentId: undefined,
      fileName: 'manifest.json',
      line: nextUniqueId(),
      versionId: nextUniqueId(),
    };
    const fakeThunk = createFakeThunk();
    const _manageComment = fakeThunk.createThunk;

    const commentText = 'Example of a comment';

    const { root, dispatchSpy } = setUpStoreAndRender({
      _manageComment,
      addonId,
      beginEdit: true,
      ...keyParams,
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
      ...keyParams,
    });
  });

  it('can submit an empty comment', () => {
    const fakeThunk = createFakeThunk();
    const _manageComment = fakeThunk.createThunk;

    const { dispatchSpy, root } = setUpStoreAndRender({
      _manageComment,
      beginEdit: true,
    });

    // Submit the comment before it has been typed in the input box.
    root.find(`.${styles.form}`).simulate('submit', createFakeEvent());

    expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_manageComment).toHaveBeenCalledWith(
      expect.objectContaining({
        // Make sure an empty string is passed to the API so that the
        // API can be responsible for raising an error.
        comment: '',
      }),
    );
  });

  it('renders a pending state while saving a comment', () => {
    const keyParams = {
      commentId: undefined,
      fileName: null,
      line: null,
      versionId: nextUniqueId(),
    };
    const pendingCommentText = 'Example of a comment being edited';
    const store = configureStore();
    store.dispatch(actions.beginComment(keyParams));
    store.dispatch(
      actions.beginSaveComment({ ...keyParams, pendingCommentText }),
    );

    const root = render({
      store,
      ...keyParams,
    });

    const textarea = root.find(`.${styles.textarea}`);
    expect(textarea).toHaveProp('disabled', true);
    expect(textarea).toHaveProp('value', pendingCommentText);

    const button = root.find(`.${styles.saveButton}`);
    expect(button).toHaveProp('disabled', true);
    expect(button).toHaveText('Saving…');

    expect(root.find(`.${styles.discardButton}`)).toHaveProp('disabled', true);
  });

  it('seeds the form with an initial comment', () => {
    const commentId = 1;
    const commentText = 'Example of a previously saved comment';
    const comment = createFakeExternalComment({
      id: commentId,
      comment: commentText,
    });
    const versionId = nextUniqueId();
    const { store } = dispatchComment({ comment, versionId });

    const { root } = setUpStoreAndRender({
      beginEdit: true,
      commentId,
      store,
      versionId,
    });

    expect(root.find(`.${styles.textarea}`)).toHaveProp('value', commentText);
  });

  it('seeds the form with initialCommentText', () => {
    const keyParams = {
      commentId: undefined,
      fileName: null,
      line: null,
      versionId: nextUniqueId(),
    };
    const pendingCommentText = 'Example of a comment being edited';
    const store = configureStore();
    store.dispatch(actions.beginComment(keyParams));
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
    const versionId = nextUniqueId();
    const comment = createFakeExternalComment({
      id: commentId,
      comment: previousCommentText,
    });
    const { store } = dispatchComment({ comment, versionId });

    const commentText = 'Example of an edited comment';

    const fakeThunk = createFakeThunk();
    const _manageComment = fakeThunk.createThunk;

    const { dispatchSpy, root } = setUpStoreAndRender({
      _manageComment,
      beginEdit: true,
      commentId,
      store,
      versionId,
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
      const { root } = setUpStoreAndRender({
        beginEdit: true,
        createTextareaRef: () => fakeRef,
      });

      expect(fakeRef.current.addEventListener).toHaveBeenCalledWith(
        'keydown',
        getInstance<CommentBase>(root).keydownListener,
      );
    });

    it('stops propagating keydown events', () => {
      const fakeRef = createFakeTextareaRef();
      setUpStoreAndRender({
        beginEdit: true,
        createTextareaRef: () => fakeRef,
      });

      expect(fakeRef.current.addEventListener).toHaveBeenCalled();
      const listenToKeydown = fakeRef.current.addEventListener.mock.calls[0][1];

      const fakeEvent = createFakeEvent();
      listenToKeydown(fakeEvent);

      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    });

    it('removes and adds keydown event listener on update', () => {
      const fakeRef = createFakeTextareaRef();
      const { root } = setUpStoreAndRender({
        beginEdit: true,
        createTextareaRef: () => fakeRef,
      });
      const { addEventListener, removeEventListener } = fakeRef.current;
      addEventListener.mockClear();
      removeEventListener.mockClear();

      root.setProps({});

      expect(addEventListener).toHaveBeenCalled();
      expect(removeEventListener).toHaveBeenCalled();
    });

    it('removes keydown event listeners on unmount', () => {
      const fakeRef = createFakeTextareaRef();
      const { root } = setUpStoreAndRender({
        beginEdit: true,
        createTextareaRef: () => fakeRef,
      });
      const { keydownListener } = getInstance<CommentBase>(root);
      root.unmount();

      expect(fakeRef.current.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        keydownListener,
      );
    });

    it('does not add/remove listeners with an undefined ref', () => {
      // Make sure this doesn't throw an error.
      expect(() => {
        const { root } = setUpStoreAndRender({
          beginEdit: true,
          createTextareaRef: () => undefined,
        });
        root.unmount();
      }).not.toThrow();
    });

    it('does not add/remove listeners with a null DOM node', () => {
      // Make sure this doesn't throw an error.
      expect(() => {
        const { root } = setUpStoreAndRender({
          beginEdit: true,
          createTextareaRef: () => React.createRef(),
        });
        root.unmount();
      }).not.toThrow();
    });
  });

  describe('deleting', () => {
    const renderCommentToDelete = ({
      commentId = 5432,
      considerDelete = false,
      deleting = false,
      store = configureStore(),
      ...params
    }: RenderParams & {
      commentId?: number;
      considerDelete?: boolean;
      deleting?: boolean;
    } = {}) => {
      const comment = createFakeExternalComment({
        id: commentId,
        comment: 'Example of a comment',
      });
      dispatchComment({ comment, store });

      if (considerDelete) {
        store.dispatch(
          actions.considerDeleteComment({ commentId: comment.id }),
        );
      }

      if (deleting) {
        store.dispatch(actions.beginDeleteComment({ commentId: comment.id }));
      }

      const fakeThunk = createFakeThunk();
      const _deleteComment = fakeThunk.createThunk;
      const { dispatchSpy, root } = setUpStoreAndRender({
        _deleteComment,
        commentId: comment.id,
        store,
        ...params,
      });

      return {
        _deleteComment,
        dispatchSpy,
        fakeThunk,
        root,
      };
    };

    it('provides a delete button', () => {
      const commentId = 987;
      const { dispatchSpy, root } = renderCommentToDelete({ commentId });

      const deleteButton = root.find(`.${styles.deleteButton}`);
      expect(deleteButton).toHaveLength(1);
      expect(deleteButton).toHaveText('Delete');
      expect(deleteButton).toHaveProp('disabled', false);

      expect(root.find(`.${styles.cancelButton}`)).toHaveLength(0);

      deleteButton.simulate('click');

      expect(dispatchSpy).toHaveBeenCalledWith(
        actions.considerDeleteComment({ commentId }),
      );
    });

    it('provides a cancel button when considering deletion', () => {
      const commentId = 987;
      const { dispatchSpy, root } = renderCommentToDelete({
        commentId,
        considerDelete: true,
      });

      const cancelButton = root.find(`.${styles.cancelButton}`);
      expect(cancelButton).toHaveLength(1);

      cancelButton.simulate('click');

      expect(dispatchSpy).toHaveBeenCalledWith(
        actions.abortDeleteComment({ commentId }),
      );
    });

    it('provides an actual delete button', () => {
      const addonId = 123;
      const commentId = 987;
      const versionId = 432;

      const {
        _deleteComment,
        dispatchSpy,
        fakeThunk,
        root,
      } = renderCommentToDelete({
        addonId,
        commentId,
        considerDelete: true,
        versionId,
      });

      const deleteButton = root.find(`.${styles.deleteButton}`);
      expect(deleteButton).toHaveLength(1);
      expect(deleteButton).toHaveText('Confirm delete');
      expect(deleteButton).toHaveProp('disabled', false);

      deleteButton.simulate('click');

      expect(dispatchSpy).toHaveBeenCalledWith(fakeThunk.thunk);

      expect(_deleteComment).toHaveBeenCalledWith({
        addonId,
        commentId,
        versionId,
      });
    });

    it('disables the delete button when deleting', () => {
      const { root } = renderCommentToDelete({ deleting: true });

      const deleteButton = root.find(`.${styles.deleteButton}`);
      expect(deleteButton).toHaveLength(1);
      expect(deleteButton).toHaveText('Deleting…');
      expect(deleteButton).toHaveProp('disabled', true);

      expect(root.find(`.${styles.cancelButton}`)).toHaveLength(0);
    });
  });

  describe('getInitialCommentOrThrow', () => {
    it('throws when initialComment is empty', () => {
      const { root } = setUpStoreAndRender({
        beginEdit: true,
        commentId: null,
      });
      expect(() =>
        getInstance<CommentBase>(root).getInitialCommentOrThrow(),
      ).toThrow(/Cannot get initialComment/);
    });

    it('returns initialComment', () => {
      const comment = createFakeExternalComment();
      const versionId = nextUniqueId();
      const { store } = dispatchComment({ comment, versionId });

      const { root } = setUpStoreAndRender({
        beginEdit: true,
        commentId: comment.id,
        store,
        versionId,
      });

      expect(getInstance<CommentBase>(root).getInitialCommentOrThrow()).toEqual(
        createInternalComment(comment),
      );
    });
  });

  describe('discarding a new comment', () => {
    const setUpForDiscard = ({
      commentId,
    }: {
      commentId: undefined | number;
    }) => {
      const store = configureStore();
      const versionId = nextUniqueId();
      const keyParams = {
        commentId,
        fileName: 'example.json',
        line: nextUniqueId(),
        versionId,
      };

      if (commentId) {
        dispatchComment({
          comment: createFakeExternalComment({ id: commentId }),
          store,
          versionId,
        });
      }
      store.dispatch(actions.beginComment(keyParams));

      return {
        keyParams,
        store,
      };
    };

    it.each([undefined, nextUniqueId()])(
      'renders a discard button to cancel entering a comment with id=%s',
      (commentId) => {
        const { keyParams, store } = setUpForDiscard({ commentId });

        const { dispatchSpy, root } = setUpStoreAndRender({
          store,
          ...keyParams,
        });
        const discardButton = root.find(`.${styles.discardButton}`);

        expect(discardButton).toHaveText('Discard');

        discardButton.simulate('click');

        expect(dispatchSpy).toHaveBeenCalledWith(
          actions.considerDiscardComment(keyParams),
        );
      },
    );

    it.each([undefined, nextUniqueId()])(
      'renders confirm button to discard a comment with id=%s',
      (commentId) => {
        const { keyParams, store } = setUpForDiscard({ commentId });
        store.dispatch(actions.considerDiscardComment(keyParams));

        const { dispatchSpy, root } = setUpStoreAndRender({
          store,
          ...keyParams,
        });
        const discardButton = root.find(`.${styles.discardButton}`);

        expect(discardButton).toHaveText('Confirm discard');

        discardButton.simulate('click');

        expect(dispatchSpy).toHaveBeenCalledWith(
          actions.finishComment(keyParams),
        );
      },
    );

    it.each([undefined, nextUniqueId()])(
      'disables the save button and textarea when ask for confirmation when commentId=%s',
      (commentId) => {
        const { keyParams, store } = setUpForDiscard({ commentId });
        store.dispatch(actions.considerDiscardComment(keyParams));

        const root = render({
          store,
          ...keyParams,
        });

        expect(root.find(`.${styles.saveButton}`)).toHaveProp('disabled', true);
        expect(root.find(`.${styles.textarea}`)).toHaveProp('disabled', true);
      },
    );

    it.each([undefined, nextUniqueId()])(
      'provides a cancel button to abort discard when commentid=%s',
      (commentId) => {
        const { keyParams, store } = setUpForDiscard({ commentId });
        store.dispatch(actions.considerDiscardComment(keyParams));

        const { dispatchSpy, root } = setUpStoreAndRender({
          store,
          ...keyParams,
        });
        const abortDiscardButton = root.find(`.${styles.abortDiscardButton}`);

        expect(abortDiscardButton).toHaveText('Cancel');

        abortDiscardButton.simulate('click');

        expect(dispatchSpy).toHaveBeenCalledWith(
          actions.abortDiscardComment(keyParams),
        );
      },
    );

    it.each([undefined, nextUniqueId()])(
      'does not render the cancel button after abort discard when commentId=%s',
      (commentId) => {
        const { keyParams, store } = setUpForDiscard({ commentId });
        store.dispatch(actions.beginComment(keyParams));
        store.dispatch(actions.considerDiscardComment(keyParams));
        store.dispatch(actions.abortDiscardComment(keyParams));

        const root = render({
          store,
          ...keyParams,
        });

        expect(root.find(`.${styles.abortDiscardButton}`)).toHaveLength(0);
      },
    );
  });

  describe('editing a comment', () => {
    const getKeyParams = () => {
      return {
        versionId: nextUniqueId(),
        commentId: nextUniqueId(),
        fileName: 'example.js',
        line: nextUniqueId(),
      };
    };

    const renderCommentToEdit = ({
      commentId = nextUniqueId(),
      considerDelete = false,
      fileName = 'example.json',
      line = nextUniqueId(),
      store = configureStore(),
      versionId = nextUniqueId(),
      ...params
    }: RenderParams & {
      beginEdit?: boolean;
      commentId?: number;
      considerDelete?: boolean;
    } = {}) => {
      const comment = createFakeExternalComment({
        id: commentId,
        filename: fileName,
        lineno: line,
        comment: 'Example of a comment',
      });

      dispatchComment({ comment, store, versionId });

      if (considerDelete) {
        store.dispatch(actions.considerDeleteComment({ commentId }));
      }

      const { dispatchSpy, root } = setUpStoreAndRender({
        commentId,
        fileName,
        line,
        store,
        versionId,
        ...params,
      });

      return {
        dispatchSpy,
        root,
      };
    };

    it('provides a button to start editing a comment', () => {
      const keyParams = getKeyParams();
      const { dispatchSpy, root } = renderCommentToEdit(keyParams);
      const editButton = root.find(`.${styles.editButton}`);

      expect(editButton).toHaveLength(1);

      editButton.simulate('click');

      expect(dispatchSpy).toHaveBeenCalledWith(actions.beginComment(keyParams));
    });

    it('disables the edit button when considering deletion', () => {
      const keyParams = getKeyParams();
      const { root } = renderCommentToEdit({
        ...keyParams,
        considerDelete: true,
      });
      const editButton = root.find(`.${styles.editButton}`);

      expect(editButton).toHaveProp('disabled', true);
    });
  });
});
