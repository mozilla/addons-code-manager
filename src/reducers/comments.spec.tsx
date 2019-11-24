/* eslint @typescript-eslint/camelcase: 0 */
import { actions as errorsActions } from './errors';
import configureStore from '../configureStore';
import reducer, {
  CommentInfo,
  ExternalComment,
  SelectCommentInfoParams,
  actions,
  adjustComment,
  createCommentKey,
  createEmptyCommentInfo,
  createInternalComment,
  deleteComment,
  fetchAndLoadComments,
  findAllSubpaths,
  initialState,
  manageComment,
  selectComment,
  selectCommentInfo,
  selectFilePathHasComments,
  selectVersionComments,
  selectVersionHasComments,
  stateForVersion,
} from './comments';
import { createInternalVersion } from './versions';
import {
  createFakeCommentsResponse,
  createFakeExternalComment,
  createErrorResponse,
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

  const stateWithComment = (props: Partial<ExternalComment> = {}) => {
    return reducer(
      undefined,
      actions.setComments({
        comments: [createFakeExternalComment(props)],
        versionId: 1,
      }),
    );
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

  describe('considerDiscardComment', () => {
    it('sets considerDiscard to be true', () => {
      let state = reducer(undefined, actions.beginComment({ ...keyParams }));

      expect(
        selectCommentInfo({ comments: state, ...keyParams }),
      ).toHaveProperty('considerDiscard', false);

      state = reducer(state, actions.considerDiscardComment({ ...keyParams }));

      expect(
        selectCommentInfo({ comments: state, ...keyParams }),
      ).toHaveProperty('considerDiscard', true);
    });
  });

  describe('abortDiscardComment', () => {
    it('resets considerDiscard to be false', () => {
      let state = reducer(undefined, actions.beginComment({ ...keyParams }));
      state = reducer(state, actions.considerDiscardComment({ ...keyParams }));
      state = reducer(state, actions.abortDiscardComment({ ...keyParams }));

      expect(
        selectCommentInfo({ comments: state, ...keyParams }),
      ).toHaveProperty('considerDiscard', false);
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
        considerDiscard: false,
        pendingCommentText: null,
        savingComment: false,
      });
    });
  });

  describe('setComments', () => {
    it('sets comments for a single key', () => {
      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      const comment = (id: number) => {
        return createFakeExternalComment({
          filename: fileName,
          id,
          lineno: line,
        });
      };

      const comment1 = comment(12345);
      const comment2 = comment(54322);

      const state = reducer(
        undefined,
        actions.setComments({ comments: [comment1, comment2], versionId }),
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

    it('adds comments to a single key', () => {
      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      const comment = (id: number) => {
        return createFakeExternalComment({
          filename: fileName,
          id,
          lineno: line,
        });
      };

      const comment1 = comment(1);
      const comment2 = comment(2);
      const comment3 = comment(3);

      let state;
      state = reducer(
        state,
        actions.setComments({ comments: [comment1], versionId }),
      );
      state = reducer(
        state,
        actions.setComments({ comments: [comment2, comment3], versionId }),
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

    it('sets comments for a version, file, and a line', () => {
      const versionId = 1;
      const version = { ...fakeVersion, id: versionId };

      const commentId1 = 1;
      const commentId2 = 2;
      const commentId3 = 2;
      const commentId4 = 4;
      const commentId5 = 5;
      const commentId6 = 6;

      const fileName = 'manifest.json';
      const line = 321;

      const comment = ({
        filename = fileName,
        lineno = line,
        ...params
      }: Partial<ExternalComment>) => {
        return createFakeExternalComment({
          version,
          filename,
          lineno,
          ...params,
        });
      };

      const versionComments = [commentId1, commentId2].map((id) => {
        return comment({ id, filename: null, lineno: null });
      });

      const fileComments = [commentId3, commentId4].map((id) => {
        return comment({ id, lineno: null });
      });

      const lineComments = [commentId5, commentId6].map((id) => {
        return comment({ id });
      });

      const comments = reducer(
        undefined,
        actions.setComments({
          comments: versionComments.concat(fileComments, lineComments),
          versionId,
        }),
      );

      const select = (
        params: Pick<SelectCommentInfoParams, 'fileName' | 'line'>,
      ) => selectCommentInfo({ comments, versionId, ...params });

      // Check version comments.
      expect(select({ fileName: null, line: null })).toMatchObject({
        commentIds: versionComments.map((c) => c.id),
      });

      // Check file comments.
      expect(select({ fileName, line: null })).toMatchObject({
        commentIds: fileComments.map((c) => c.id),
      });

      // Check line comments.
      expect(select({ fileName, line })).toMatchObject({
        commentIds: lineComments.map((c) => c.id),
      });
    });

    it('loads comments separately by file line', () => {
      const versionId = 1;
      const version = { ...fakeVersion, id: versionId };

      const commentId1 = 1;
      const commentId2 = 2;
      const commentId3 = 2;
      const commentId4 = 4;

      const fileName = 'manifest.json';
      const line1 = 1;
      const line2 = 2;

      const comment = (params: Partial<ExternalComment> = {}) => {
        return createFakeExternalComment({
          version,
          filename: fileName,
          ...params,
        });
      };

      const line1Comments = [commentId1, commentId2].map((id) => {
        return comment({ id, lineno: line1 });
      });

      const line2Comments = [commentId3, commentId4].map((id) => {
        return comment({ id, lineno: line2 });
      });

      const comments = reducer(
        undefined,
        actions.setComments({
          comments: line1Comments.concat(line2Comments),
          versionId,
        }),
      );

      const select = (params: Pick<SelectCommentInfoParams, 'line'>) =>
        selectCommentInfo({ comments, fileName, versionId, ...params });

      // Check comments on line 1
      expect(select({ line: line1 })).toMatchObject({
        commentIds: line1Comments.map((c) => c.id),
      });

      // Check comments on line 2
      expect(select({ line: line2 })).toMatchObject({
        commentIds: line2Comments.map((c) => c.id),
      });
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
        beginDelete: false,
        considerDelete: false,
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
      const versionId = 1;
      const fakeComment = createFakeExternalComment();

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _manageComment({
            ...keyParams,
            _createOrUpdateComment: jest.fn().mockResolvedValue(fakeComment),
            versionId,
          }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.finishComment({ ...keyParams, versionId }),
      );
      expect(dispatch).toHaveBeenCalledWith(
        actions.setComments({ comments: [fakeComment], versionId }),
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
        considerDiscard: false,
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

  describe('selectVersionComments', () => {
    it('returns undefined before any data has loaded', () => {
      expect(
        selectVersionComments({ comments: initialState, versionId: 1 }),
      ).toEqual(undefined);
    });

    it('returns zero comments', () => {
      const state = reducer(
        undefined,
        actions.setComments({ comments: [], ...keyParams }),
      );

      expect(
        selectVersionComments({
          comments: state,
          versionId: keyParams.versionId,
        }),
      ).toEqual([]);
    });

    it('returns comments', () => {
      const comment1 = createFakeExternalComment({ id: 1 });
      const comment2 = createFakeExternalComment({ id: 2 });

      const state = reducer(
        undefined,
        actions.setComments({
          comments: [comment1, comment2],
          ...keyParams,
        }),
      );

      expect(
        selectVersionComments({
          comments: state,
          versionId: keyParams.versionId,
        }),
      ).toEqual([
        createInternalComment(comment1),
        createInternalComment(comment2),
      ]);
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
        selectVersionComments({
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
    ])(
      'returns zero comments when switching versions via action=%s',
      (action) => {
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

        expect(selectVersionComments({ comments: state, versionId })).toEqual(
          [],
        );
      },
    );
  });

  describe('selectVersionHasComments', () => {
    const _selectVersionHasComments = (params = {}) => {
      return selectVersionHasComments({
        _selectVersionComments: jest.fn(() => undefined),
        comments: initialState,
        versionId: 9944,
        ...params,
      });
    };

    it('calls selectVersionComments', () => {
      const state = reducer(
        undefined,
        actions.setComments({
          comments: [createFakeExternalComment()],
          ...keyParams,
        }),
      );

      const versionId = 984;
      const _selectVersionComments = jest.fn();

      _selectVersionHasComments({
        _selectVersionComments,
        comments: state,
        versionId,
      });

      expect(_selectVersionComments).toHaveBeenCalledWith({
        comments: state,
        versionId,
      });
    });

    it('handles undefined comments', () => {
      const _selectVersionComments = jest.fn(() => undefined);
      expect(_selectVersionHasComments({ _selectVersionComments })).toEqual(
        undefined,
      );
    });

    it('returns false for zero comments', () => {
      const _selectVersionComments = jest.fn(() => []);
      expect(_selectVersionHasComments({ _selectVersionComments })).toEqual(
        false,
      );
    });

    it('returns true for one or more comment', () => {
      const _selectVersionComments = jest.fn(() => [
        createInternalComment(createFakeExternalComment()),
      ]);
      expect(_selectVersionHasComments({ _selectVersionComments })).toEqual(
        true,
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

  describe('abortFetchVersionComments', () => {
    it('sets isLoading to false', () => {
      const versionId = 1;
      let state;
      state = reducer(state, actions.beginFetchVersionComments({ versionId }));
      state = reducer(state, actions.abortFetchVersionComments({ versionId }));

      expect(state.isLoading).toEqual(false);
    });
  });

  describe('beginFetchVersionComments', () => {
    it('sets isLoading to true', () => {
      const versionId = 1;
      const state = reducer(
        undefined,
        actions.beginFetchVersionComments({ versionId }),
      );

      expect(state.isLoading).toEqual(true);
    });
  });

  describe('fetchAndLoadComments', () => {
    const _fetchAndLoadComments = ({
      _getAllComments = jest
        .fn()
        .mockResolvedValue(createFakeCommentsResponse()),
      addonId = 1,
      versionId = 2,
    }) => {
      return fetchAndLoadComments({ _getAllComments, addonId, versionId });
    };

    it('dispatches beginFetchVersionComments', async () => {
      const versionId = 1;

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _fetchAndLoadComments({ versionId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginFetchVersionComments({ versionId }),
      );
    });

    it('does not dispatch anything while already fetching comments', async () => {
      const store = configureStore();
      const versionId = 1;
      store.dispatch(actions.beginFetchVersionComments({ versionId }));

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _fetchAndLoadComments({ versionId }),
        store,
      });

      await thunk();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('handles API errors', async () => {
      const errorResponse = createErrorResponse({
        error: new Error('API Error'),
      });
      const _getAllComments = jest.fn().mockResolvedValue(errorResponse);
      const versionId = 1;

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _fetchAndLoadComments({ _getAllComments, versionId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortFetchVersionComments({ versionId }),
      );
      expect(dispatch).toHaveBeenCalledWith(
        errorsActions.addError(errorResponse),
      );
    });

    it('fetches version comments', async () => {
      const _getAllComments = jest
        .fn()
        .mockResolvedValue(createFakeCommentsResponse());
      const store = configureStore();
      const addonId = 1;
      const versionId = 1;

      const { thunk } = thunkTester({
        createThunk: () =>
          _fetchAndLoadComments({ _getAllComments, addonId, versionId }),
        store,
      });

      await thunk();

      expect(_getAllComments).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        versionId,
      });
    });

    it('loads comments', async () => {
      const versionId = 1;
      const comments = [1, 2, 3].map((id) => createFakeExternalComment({ id }));

      const _getAllComments = jest
        .fn()
        .mockResolvedValue(createFakeCommentsResponse(comments));

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          _fetchAndLoadComments({ _getAllComments, versionId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.setComments({ versionId, comments }),
      );
    });
  });

  describe('abortDeleteComment', () => {
    it('resets state after beginDeleteComment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      state = reducer(state, actions.beginDeleteComment({ commentId }));
      state = reducer(state, actions.abortDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        beginDelete: false,
      });
    });

    it('resets state after considerDeleteComment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      state = reducer(state, actions.considerDeleteComment({ commentId }));
      state = reducer(state, actions.abortDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        considerDelete: false,
      });
    });
  });

  describe('beginDeleteComment', () => {
    it('begins deleting a comment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        beginDelete: false,
      });

      state = reducer(state, actions.beginDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        beginDelete: true,
      });
    });

    it('resets state after considerDeleteComment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      state = reducer(state, actions.considerDeleteComment({ commentId }));
      state = reducer(state, actions.beginDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        considerDelete: false,
      });
    });
  });

  describe('considerDeleteComment', () => {
    it('considers deleting a comment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        considerDelete: false,
      });

      state = reducer(state, actions.considerDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        considerDelete: true,
      });
    });

    it('resets state after beginDeleteComment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      state = reducer(state, actions.beginDeleteComment({ commentId }));
      state = reducer(state, actions.considerDeleteComment({ commentId }));

      expect(selectComment({ comments: state, id: commentId })).toMatchObject({
        beginDelete: false,
      });
    });
  });

  describe('unsetComment', () => {
    it('removes a comment', () => {
      const commentId = 1;
      let state = stateWithComment({ id: commentId });

      state = reducer(state, actions.unsetComment({ commentId }));

      expect(state.byId[commentId]).toBeUndefined();
    });

    it('removes a comment from the comment list', () => {
      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      const comment = (id: number) => {
        return createFakeExternalComment({
          filename: fileName,
          id,
          lineno: line,
        });
      };

      const comment1 = comment(12345);
      const comment2 = comment(54322);

      let state;
      state = reducer(
        state,
        actions.setComments({ comments: [comment1, comment2], versionId }),
      );
      state = reducer(state, actions.unsetComment({ commentId: comment1.id }));

      expect(
        selectCommentInfo({ comments: state, fileName, line, versionId }),
      ).toMatchObject({
        commentIds: [comment2.id],
      });
    });

    it('preserves comment lists for unrelated keys', () => {
      const versionId = 1;
      const line = 123;

      const file1 = 'manifest.json';
      const file2 = 'background-script.js';

      const comment = (id: number, fileName: string) => {
        return createFakeExternalComment({
          filename: fileName,
          id,
          lineno: line,
        });
      };

      const comment1 = comment(12345, file1);
      const comment2 = comment(54322, file2);

      let state;
      state = reducer(
        state,
        actions.setComments({ comments: [comment1, comment2], versionId }),
      );

      // Delete the comment associated with file1.
      state = reducer(state, actions.unsetComment({ commentId: comment1.id }));

      // Make sure the comment associated with file2 is still there.
      expect(
        selectCommentInfo({
          comments: state,
          fileName: file2,
          line,
          versionId,
        }),
      ).toMatchObject({
        commentIds: [comment2.id],
      });
    });
  });

  describe('deleteComment', () => {
    const _deleteComment = ({
      _apiDeleteComment = jest.fn().mockResolvedValue(''),
      addonId = 123,
      commentId = 321,
      versionId = 567,
    }) => {
      return deleteComment({
        _apiDeleteComment,
        addonId,
        commentId,
        versionId,
      });
    };

    it('requests comment deletion', async () => {
      const _apiDeleteComment = jest.fn().mockResolvedValue('');
      const addonId = 987;
      const versionId = 3321;
      const commentId = 675;

      const { store, thunk } = thunkTester({
        createThunk: () =>
          _deleteComment({
            _apiDeleteComment,
            addonId,
            commentId,
            versionId,
          }),
      });

      await thunk();

      expect(_apiDeleteComment).toHaveBeenCalledWith({
        addonId,
        apiState: store.getState().api,
        commentId,
        versionId,
      });
    });

    it('begins deleting a comment', async () => {
      const commentId = 675;

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _deleteComment({ commentId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginDeleteComment({ commentId }),
      );
    });

    it('unsets a comment', async () => {
      const commentId = 675;

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _deleteComment({ commentId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.unsetComment({ commentId }),
      );
    });

    it('dispatches abortDeleteComment(), addError() on error', async () => {
      const commentId = 987;
      const errorResponse = createErrorResponse({
        error: new Error('API Error'),
      });
      const _apiDeleteComment = jest.fn().mockResolvedValue(errorResponse);

      const { dispatch, thunk } = thunkTester({
        createThunk: () => _deleteComment({ _apiDeleteComment, commentId }),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortDeleteComment({ commentId }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        errorsActions.addError(errorResponse),
      );
    });
  });

  describe('selectComment', () => {
    it('returns a comment', () => {
      const comment = createFakeExternalComment({ id: 987 });
      const state = reducer(
        undefined,
        actions.setComments({
          versionId: 1,
          comments: [comment],
        }),
      );

      expect(selectComment({ comments: state, id: comment.id })).toEqual(
        createInternalComment(comment),
      );
    });

    it('returns undefined if the comment does not exist', () => {
      expect(
        selectComment({ comments: initialState, id: 7654 }),
      ).toBeUndefined();
    });
  });

  describe('adjustComment', () => {
    it('adjusts a comment', () => {
      const id = 234;
      const comment = createFakeExternalComment({
        comment: 'some content',
        id,
      });

      const state = reducer(
        undefined,
        actions.setComments({ versionId: 1, comments: [comment] }),
      );

      const newContent = 'some content (edited)';
      expect(
        adjustComment({ state, id, props: { content: newContent } }),
      ).toEqual({
        ...createInternalComment(comment),
        content: newContent,
      });
    });

    it('throws if the comment does not exist', () => {
      expect(() =>
        adjustComment({
          state: initialState,
          id: 54321,
          props: { content: 'new content' },
        }),
      ).toThrow(/Cannot adjust comment/);
    });
  });

  describe('selectFilePathHasComments', () => {
    const createCommentsStateForPath = ({
      commentId = 1234,
      path = 'any-file.js',
      versionId = 23,
    } = {}) => {
      const comments = reducer(
        undefined,
        actions.setComments({
          versionId,
          comments: [
            createFakeExternalComment({ id: commentId, filename: path }),
          ],
        }),
      );

      return { comments, path, versionId };
    };

    const _selectFilePathHasComments = ({
      comments = initialState,
      path = 'src',
      versionId = 1,
    } = {}) => {
      return selectFilePathHasComments({ comments, path, versionId });
    };

    it('returns false for zero comments', () => {
      expect(_selectFilePathHasComments({ comments: initialState })).toEqual(
        false,
      );
    });

    it('returns false for the wrong version', () => {
      const { comments, path, versionId } = createCommentsStateForPath();

      expect(
        _selectFilePathHasComments({
          comments,
          path,
          versionId: versionId + 1,
        }),
      ).toEqual(false);
    });

    it('returns false for the wrong file', () => {
      const path = 'manifest.json';
      const { comments, versionId } = createCommentsStateForPath({ path });

      expect(
        _selectFilePathHasComments({
          comments,
          path: 'not-manifest.json',
          versionId,
        }),
      ).toEqual(false);
    });

    it('returns false for the wrong directory', () => {
      const path = 'lib/manifest.json';
      const { comments, versionId } = createCommentsStateForPath({ path });

      expect(
        _selectFilePathHasComments({
          comments,
          path: 'not-lib',
          versionId,
        }),
      ).toEqual(false);
    });

    it('returns false for a partial directory prefix', () => {
      const prefix = 'lib';
      const path = `${prefix}-alt/manifest.json`;
      const { comments, versionId } = createCommentsStateForPath({ path });

      expect(
        _selectFilePathHasComments({
          comments,
          path: prefix,
          versionId,
        }),
      ).toEqual(false);
    });

    it('returns true for a file having comments', () => {
      const path = 'manifest.json';
      const { comments, versionId } = createCommentsStateForPath({ path });

      expect(
        _selectFilePathHasComments({
          comments,
          path,
          versionId,
        }),
      ).toEqual(true);
    });

    it('returns true for a directory having comments', () => {
      const dir = 'lib';
      const path = `${dir}/manifest.json`;
      const { comments, versionId } = createCommentsStateForPath({ path });

      expect(
        _selectFilePathHasComments({ comments, path: dir, versionId }),
      ).toEqual(true);
    });

    const someLongPath = 'lib/other/place/background-script.js';

    it.each(findAllSubpaths(someLongPath))(
      'returns true for subpath "%s"',
      (path) => {
        const { comments, versionId } = createCommentsStateForPath({
          path: someLongPath,
        });

        expect(
          _selectFilePathHasComments({ comments, path, versionId }),
        ).toEqual(true);
      },
    );

    it('returns false for a file after deleting its comment', () => {
      const commentId = 9876;
      const {
        comments: initialComments,
        path,
        versionId,
      } = createCommentsStateForPath({ commentId });

      const comments = reducer(
        initialComments,
        actions.unsetComment({ commentId }),
      );

      expect(_selectFilePathHasComments({ comments, path, versionId })).toEqual(
        false,
      );
    });

    it('returns false for a directory after deleting its comment', () => {
      const dir = 'lib';
      const path = `${dir}/manifest.json`;
      const commentId = 9876;

      const {
        comments: initialComments,
        versionId,
      } = createCommentsStateForPath({ commentId, path });

      const comments = reducer(
        initialComments,
        actions.unsetComment({ commentId }),
      );

      expect(
        _selectFilePathHasComments({ comments, path: dir, versionId }),
      ).toEqual(false);
    });

    it('returns true for a directory after deleting only one file comment', () => {
      const versionId = 1;
      const dir = 'lib';

      let comments = initialState;

      const _setComment = (comment: Partial<ExternalComment>) => {
        return reducer(
          comments,
          actions.setComments({
            versionId,
            comments: [createFakeExternalComment(comment)],
          }),
        );
      };

      // Comment on a file in the directory.
      comments = _setComment({ id: 1, filename: `${dir}/manifest.json` });

      const commentIdToDelete = 2;

      // Comment on another file in the same directory.
      comments = _setComment({
        id: commentIdToDelete,
        filename: `${dir}/background.js`,
      });

      // Delete only one comment for a file in the directory.
      comments = reducer(
        comments,
        actions.unsetComment({ commentId: commentIdToDelete }),
      );

      expect(
        _selectFilePathHasComments({ comments, path: dir, versionId }),
      ).toEqual(true);
    });

    it('ignores non-filename comments', () => {
      const versionId = 364;
      const comments = reducer(
        undefined,
        actions.setComments({
          versionId,
          comments: [
            createFakeExternalComment({ filename: null, lineno: null }),
          ],
        }),
      );

      expect(
        _selectFilePathHasComments({
          comments,
          path: 'any-file.js',
          versionId,
        }),
      ).toEqual(false);
    });
  });

  describe('findAllSubpaths', () => {
    it('handles a file without directories', () => {
      const path = 'file.js';
      expect(findAllSubpaths(path)).toEqual([path]);
    });

    it('finds all sub paths', () => {
      expect(findAllSubpaths('path/to/really/nested/file.js')).toEqual([
        'path',
        'path/to',
        'path/to/really',
        'path/to/really/nested',
        'path/to/really/nested/file.js',
      ]);
    });

    it('preserves leading slash when defined', () => {
      expect(findAllSubpaths('/absolute/path/to/file.js')).toEqual([
        '/absolute',
        '/absolute/path',
        '/absolute/path/to',
        '/absolute/path/to/file.js',
      ]);
    });

    it('ignores a trailing slash', () => {
      expect(findAllSubpaths('absolute/path/')).toEqual([
        'absolute',
        'absolute/path',
      ]);
    });
  });
});
