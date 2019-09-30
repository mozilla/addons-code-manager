/* eslint @typescript-eslint/camelcase: 0 */
import { actions as errorsActions } from './errors';
import reducer, {
  CommentInfo,
  actions,
  createCommentKey,
  createEmptyCommentInfo,
  createInternalComment,
  initialState,
  manageComment,
  selectCommentInfo,
  selectVersionHasComments,
  stateForVersion,
} from './comments';
import { createInternalVersion } from './versions';
import {
  createFakeExternalComment,
  fakeVersion,
  thunkTester,
} from '../test-helpers';

describe(__filename, () => {
  const createCommentInfo = (info: Partial<CommentInfo> = {}): CommentInfo => {
    return {
      ...createEmptyCommentInfo(),
      ...info,
    };
  };

  const keyParams = Object.freeze({
    versionId: 1,
    fileName: 'manifest.json',
    line: 123,
  });

  describe('beginComment', () => {
    it('begins a comment by key', () => {
      const state = reducer(undefined, actions.beginComment(keyParams));

      expect(selectCommentInfo({ comments: state, ...keyParams })).toEqual(
        createCommentInfo({ beginNewComment: true }),
      );

      expect(state.forVersionId).toEqual(keyParams.versionId);
    });

    it('resets historic info', () => {
      let state;

      // Imagine that this happened some time in the past.
      state = reducer(
        state,
        actions.beginSaveComment({
          ...keyParams,
          pendingCommentText: 'Example',
        }),
      );
      // Imagine that the user opened a comment form again.
      state = reducer(state, actions.beginComment(keyParams));

      expect(
        selectCommentInfo({ comments: state, ...keyParams }),
      ).toMatchObject({
        pendingCommentText: null,
        savingComment: false,
      });
    });
  });

  describe('beginSaveComment', () => {
    it('begins saving a comment by key', () => {
      const pendingCommentText = 'Example comment';
      const state = reducer(
        undefined,
        actions.beginSaveComment({ pendingCommentText, ...keyParams }),
      );

      expect(selectCommentInfo({ comments: state, ...keyParams })).toEqual(
        createCommentInfo({ pendingCommentText, savingComment: true }),
      );

      expect(state.forVersionId).toEqual(keyParams.versionId);
    });
  });

  describe('abortSaveComment', () => {
    it('aborts saving a comment by key', () => {
      const pendingCommentText = 'Example of a comment';
      let state;

      state = reducer(
        state,
        actions.beginSaveComment({ ...keyParams, pendingCommentText }),
      );
      state = reducer(state, actions.abortSaveComment(keyParams));

      expect(selectCommentInfo({ comments: state, ...keyParams })).toEqual(
        // This should make sure pendingCommentText is preserved.
        createCommentInfo({ pendingCommentText, savingComment: false }),
      );

      expect(state.forVersionId).toEqual(keyParams.versionId);
    });
  });

  describe('finishComment', () => {
    it('finishes a comment by key', () => {
      const state = reducer(undefined, actions.finishComment(keyParams));

      expect(selectCommentInfo({ comments: state, ...keyParams })).toEqual(
        createCommentInfo({ beginNewComment: false }),
      );
      expect(state.forVersionId).toEqual(keyParams.versionId);
    });

    it('resets comment info', () => {
      let state;

      state = reducer(
        state,
        actions.beginSaveComment({
          ...keyParams,
          pendingCommentText: 'Example',
        }),
      );
      state = reducer(state, actions.finishComment(keyParams));

      expect(
        selectCommentInfo({ comments: state, ...keyParams }),
      ).toMatchObject({
        pendingCommentText: null,
        savingComment: false,
      });
    });
  });

  describe('setComments', () => {
    it('sets comments for a key', () => {
      const comment1 = createFakeExternalComment({ id: 12345 });
      const comment2 = createFakeExternalComment({ id: 54322 });

      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      const state = reducer(
        undefined,
        actions.setComments({
          comments: [comment1, comment2],
          fileName,
          line,
          versionId,
        }),
      );

      expect(state.byId[comment1.id]).toEqual(createInternalComment(comment1));
      expect(state.byId[comment2.id]).toEqual(createInternalComment(comment2));

      expect(
        selectCommentInfo({ comments: state, fileName, line, versionId }),
      ).toMatchObject({
        commentIds: [comment1.id, comment2.id],
      });

      expect(state.forVersionId).toEqual(versionId);
    });

    it('sets zero comments', () => {
      const versionId = 1;
      const state = reducer(
        undefined,
        actions.setComments({ comments: [], ...keyParams, versionId }),
      );

      expect(state.byId).toEqual({});
      expect(state.forVersionId).toEqual(versionId);
    });

    it('adds comments to a key', () => {
      const comment1 = createFakeExternalComment({ id: 1 });
      const comment2 = createFakeExternalComment({ id: 2 });
      const comment3 = createFakeExternalComment({ id: 3 });

      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      let state;
      state = reducer(
        state,
        actions.setComments({
          comments: [comment1],
          fileName,
          line,
          versionId,
        }),
      );
      state = reducer(
        state,
        actions.setComments({
          comments: [comment2, comment3],
          fileName,
          line,
          versionId,
        }),
      );

      expect(
        selectCommentInfo({ comments: state, fileName, line, versionId }),
      ).toMatchObject({
        commentIds: [comment1.id, comment2.id, comment3.id],
      });

      expect(state.byId[comment1.id]).toEqual(createInternalComment(comment1));
      expect(state.byId[comment2.id]).toEqual(createInternalComment(comment2));
      expect(state.byId[comment3.id]).toEqual(createInternalComment(comment3));
    });
  });

  describe('createCommentKey', () => {
    it('creates a key from fileName and line', () => {
      const fileName = 'manifest.json';
      const line = 321;

      expect(createCommentKey({ fileName, line })).toEqual(
        `fileName:${fileName};line:${line}`,
      );
    });

    it('creates a key from fileName', () => {
      const fileName = 'manifest.json';

      expect(createCommentKey({ fileName, line: null })).toEqual(
        `fileName:${fileName};line:null`,
      );
    });

    it('creates a key from a null fileName and null line', () => {
      expect(createCommentKey({ fileName: null, line: null })).toEqual(
        `fileName:null;line:null`,
      );
    });

    it('cannot create a key from just a line', () => {
      expect(() => createCommentKey({ fileName: null, line: 2 })).toThrow(
        /Cannot create key/,
      );
    });
  });

  describe('createInternalComment', () => {
    it('creates a comment', () => {
      const comment = 'Example comment';
      const id = 1;
      const lineno = 321;
      const filename = 'manifest.json';
      const userId = 1;
      const userName = 'Toni';
      const userUrl = 'https://domain/user';
      const userUsername = 'some_user';
      const version = fakeVersion;

      expect(
        createInternalComment({
          canned_response: null,
          comment,
          id,
          lineno,
          filename,
          user: {
            id: userId,
            name: userName,
            url: userUrl,
            username: userUsername,
          },
          version,
        }),
      ).toEqual({
        content: comment,
        id,
        lineno,
        filename,
        userId,
        userName,
        userUrl,
        userUsername,
        version: createInternalVersion(version),
      });
    });
  });

  describe('manageComment', () => {
    const _manageComment = (params = {}) => {
      return manageComment({
        _createOrUpdateComment: jest
          .fn()
          .mockResolvedValue(createFakeExternalComment()),
        addonId: 1,
        cannedResponseId: undefined,
        comment: 'Example of a comment',
        commentId: undefined,
        fileName: null,
        line: null,
        versionId: 432,
        ...params,
      });
    };

    it('calls createOrUpdateComment', async () => {
      const _createOrUpdateComment = jest
        .fn()
        .mockResolvedValue(createFakeExternalComment());
      const addonId = 123;
      const cannedResponseId = undefined;
      const comment = 'A comment on a file';
      const commentId = undefined;
      const fileName = 'manifest.json';
      const line = 543;
      const versionId = 321;

      const { store, thunk } = thunkTester({
        createThunk: () =>
          _manageComment({
            _createOrUpdateComment,
            addonId,
            cannedResponseId,
            comment,
            fileName,
            line,
            versionId,
          }),
      });

      await thunk();

      expect(_createOrUpdateComment).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        cannedResponseId,
        comment,
        commentId,
        fileName,
        line,
        versionId,
      });
    });

    it('dispatches beginSaveComment()', async () => {
      const comment = 'Example of a comment';

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _manageComment({ comment, ...keyParams }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginSaveComment({
          pendingCommentText: comment,
          ...keyParams,
        }),
      );
    });

    it('can dispatch beginSaveComment() with empty pendingCommentText', async () => {
      const { dispatch, thunk } = thunkTester({
        // The comment value might be undefined when performing a PATCH request.
        createThunk: () => _manageComment({ comment: undefined, ...keyParams }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginSaveComment({
          ...keyParams,
          pendingCommentText: null,
        }),
      );
    });

    it('dispatches finishComment(), setComments() on success', async () => {
      const fakeComment = createFakeExternalComment();

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _manageComment({
            _createOrUpdateComment: jest.fn().mockResolvedValue(fakeComment),
            ...keyParams,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(actions.finishComment(keyParams));
      expect(dispatch).toHaveBeenCalledWith(
        actions.setComments({ comments: [fakeComment], ...keyParams }),
      );
    });

    it('dispatches abortSaveComment(), addError() on error', async () => {
      const error = new Error('Bad Request');

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _manageComment({
            _createOrUpdateComment: jest.fn().mockResolvedValue({ error }),
            ...keyParams,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortSaveComment(keyParams),
      );
      expect(dispatch).toHaveBeenCalledWith(errorsActions.addError({ error }));
    });
  });

  describe('selectCommentInfo', () => {
    it('returns undefined before any data has loaded', () => {
      expect(
        selectCommentInfo({ comments: initialState, ...keyParams }),
      ).toEqual(undefined);
    });

    it('gets comment info', () => {
      const versionId = 1;
      const fileName = 'manifest.json';
      const line = 321;
      const state = reducer(
        undefined,
        actions.beginComment({ versionId, fileName, line }),
      );

      expect(
        selectCommentInfo({ comments: state, versionId, fileName, line }),
      ).toEqual({
        beginNewComment: true,
        commentIds: [],
        pendingCommentText: null,
        savingComment: false,
      });
    });

    it('returns undefined when the versionId does not match', () => {
      const versionId = 1;
      const fileName = 'manifest.json';
      const line = 321;
      const state = reducer(
        undefined,
        actions.beginComment({ versionId, fileName, line }),
      );

      expect(
        selectCommentInfo({
          comments: state,
          fileName,
          line,
          versionId: versionId + 1,
        }),
      ).toEqual(undefined);
    });
  });

  describe('selectVersionHasComments', () => {
    it('returns undefined before any data has loaded', () => {
      expect(
        selectVersionHasComments({ comments: initialState, versionId: 1 }),
      ).toEqual(undefined);
    });

    it('returns false if the version has zero comments', () => {
      const state = reducer(
        undefined,
        actions.setComments({ comments: [], ...keyParams }),
      );

      expect(
        selectVersionHasComments({
          comments: state,
          versionId: keyParams.versionId,
        }),
      ).toEqual(false);
    });

    it('returns true if comments have been set', () => {
      const state = reducer(
        undefined,
        actions.setComments({
          comments: [createFakeExternalComment()],
          ...keyParams,
        }),
      );

      expect(
        selectVersionHasComments({
          comments: state,
          versionId: keyParams.versionId,
        }),
      ).toEqual(true);
    });

    it('returns undefined if no comments for this version have been set', () => {
      const versionId1 = 1;
      const versionId2 = 2;

      const state = reducer(
        undefined,
        actions.setComments({
          comments: [createFakeExternalComment()],
          ...keyParams,
          versionId: versionId1,
        }),
      );

      expect(
        selectVersionHasComments({
          comments: state,
          versionId: versionId2,
        }),
      ).toEqual(undefined);
    });

    it.each([
      'abortSaveComment',
      'beginComment',
      'beginSaveComment',
      'finishComment',
      'setComments',
    ])('returns false when switching versions via action=%s', (action) => {
      const oldVersionId = 1;
      const versionId = 2;
      let state;

      // Set comments for a previous version.
      state = reducer(
        state,
        actions.setComments({
          comments: [createFakeExternalComment()],
          ...keyParams,
          versionId: oldVersionId,
        }),
      );

      // Perform an action with a new version.
      switch (action) {
        case 'abortSaveComment': {
          state = reducer(
            state,
            actions.abortSaveComment({ ...keyParams, versionId }),
          );
          break;
        }
        case 'beginComment': {
          state = reducer(
            state,
            actions.beginComment({ ...keyParams, versionId }),
          );
          break;
        }
        case 'beginSaveComment': {
          state = reducer(
            state,
            actions.beginSaveComment({
              ...keyParams,
              versionId,
              pendingCommentText: null,
            }),
          );
          break;
        }
        case 'finishComment': {
          state = reducer(
            state,
            actions.finishComment({ ...keyParams, versionId }),
          );
          break;
        }
        case 'setComments': {
          // Set zero comments for the current version.
          state = reducer(
            state,
            actions.setComments({ comments: [], ...keyParams, versionId }),
          );
          break;
        }
        default: {
          throw new Error(`Unmapped action: ${action}`);
        }
      }

      expect(selectVersionHasComments({ comments: state, versionId })).toEqual(
        false,
      );
    });
  });

  describe('stateForVersion', () => {
    it('preserves old values when not switching versions', () => {
      const versionId = 1;
      const state = reducer(
        undefined,
        actions.setComments({
          comments: [createFakeExternalComment()],
          fileName: 'manifest.json',
          line: null,
          versionId,
        }),
      );

      expect(stateForVersion({ state, versionId })).toMatchObject({
        forVersionId: versionId,
        byKey: state.byKey,
        byId: state.byId,
      });
    });

    it('resets values when switching versions', () => {
      const oldVersionId = 1;
      const versionId = 2;

      const state = reducer(
        undefined,
        actions.setComments({
          comments: [createFakeExternalComment()],
          fileName: 'manifest.json',
          line: null,
          versionId: oldVersionId,
        }),
      );

      expect(stateForVersion({ state, versionId })).toMatchObject({
        forVersionId: versionId,
        byKey: {},
        byId: {},
      });
    });
  });
});
