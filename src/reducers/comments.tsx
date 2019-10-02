import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';
import { actions as errorsActions } from './errors';
import {
  ExternalVersionWithContent,
  Version,
  createInternalVersion,
} from './versions';
import { createOrUpdateComment, getComments, isErrorResponse } from '../api';

type CommentBase = {
  filename: string | null;
  id: number;
  lineno: number | null;
};

export type ExternalCannedResponse = {
  id: number;
  title: string;
  response: string;
  category: string;
};

export type ExternalComment = CommentBase & {
  canned_response: ExternalCannedResponse | null;
  comment: string | null;
  user: {
    id: number;
    name: string | null;
    url: string | null;
    username: string;
  };
  version: ExternalVersionWithContent;
};

export type Comment = CommentBase & {
  content: string | null;
  userId: number;
  userName: string | null;
  userUrl: string | null;
  userUsername: string;
  version: Version;
};

export const createInternalComment = (comment: ExternalComment): Comment => {
  return {
    content: comment.comment,
    filename: comment.filename,
    id: comment.id,
    lineno: comment.lineno,
    userId: comment.user.id,
    userName: comment.user.name,
    userUrl: comment.user.url,
    userUsername: comment.user.username,
    version: createInternalVersion(comment.version),
  };
};

export type CommentInfo = {
  beginNewComment: boolean;
  pendingCommentText: string | null;
  savingComment: boolean;
  commentIds: number[];
};

export type CommentsByKey = {
  [key: string]: CommentInfo;
};

export type CommentsState = {
  byKey: CommentsByKey;
  byId: { [id: number]: Comment };
  forVersionId: undefined | number;
  isLoading: boolean;
};

export const initialState: CommentsState = {
  byKey: {},
  byId: {},
  forVersionId: undefined,
  isLoading: false,
};

export const createEmptyCommentInfo = (): CommentInfo => {
  return {
    beginNewComment: false,
    pendingCommentText: null,
    savingComment: false,
    commentIds: [],
  };
};

export type CommentKeyParams = {
  fileName: string | null;
  line: number | null;
};

export const createCommentKey = ({ fileName, line }: CommentKeyParams) => {
  const key = `fileName:${fileName};line:${line}`;

  if (line !== null && fileName === null) {
    // This wouldn't make sense because it's like saying "add a comment
    // on line N of file null."
    throw new Error(`Cannot create key "${key}" because fileName is empty`);
  }

  return key;
};

type CommonPayload = CommentKeyParams & { versionId: number };

export const actions = {
  abortFetchVersionComments: createAction(
    'ABORT_FETCH_VERSION_COMMENTS',
    (resolve) => {
      return (payload: { versionId: number }) => resolve(payload);
    },
  ),
  abortSaveComment: createAction('ABORT_SAVE_COMMENT', (resolve) => {
    return (payload: CommonPayload) => resolve(payload);
  }),
  beginComment: createAction('BEGIN_COMMENT', (resolve) => {
    return (payload: CommonPayload) => resolve(payload);
  }),
  beginFetchVersionComments: createAction(
    'BEGIN_FETCH_VERSION_COMMENTS',
    (resolve) => {
      return (payload: { versionId: number }) => resolve(payload);
    },
  ),
  beginSaveComment: createAction('BEGIN_SAVE_COMMENT', (resolve) => {
    return (payload: CommonPayload & { pendingCommentText: string | null }) =>
      resolve(payload);
  }),
  finishComment: createAction('FINISH_COMMENT', (resolve) => {
    return (payload: CommonPayload) => resolve(payload);
  }),
  setComments: createAction('SET_COMMENTS', (resolve) => {
    return (payload: CommonPayload & { comments: ExternalComment[] }) =>
      resolve(payload);
  }),
};

export const selectCommentInfo = ({
  comments,
  fileName,
  line,
  versionId,
}: { comments: CommentsState; versionId: number } & CommentKeyParams):
  | undefined
  | CommentInfo => {
  if (comments.forVersionId !== versionId) {
    return undefined;
  }
  return comments.byKey[createCommentKey({ fileName, line })];
};

export const selectVersionHasComments = ({
  comments,
  versionId,
}: {
  comments: CommentsState;
  versionId: number;
}): undefined | boolean => {
  if (comments.forVersionId !== versionId) {
    return undefined;
  }
  return Object.keys(comments.byId).length > 0;
};

export const fetchAndLoadComments = ({
  _getComments = getComments,
  addonId,
  versionId,
}: {
  _getComments?: typeof getComments;
  addonId: number;
  versionId: number;
}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState, comments } = getState();

    if (comments.isLoading) {
      return;
    }

    dispatch(actions.beginFetchVersionComments({ versionId }));

    // TODO: fetch all pages to get all comments.
    // https://github.com/mozilla/addons-code-manager/issues/1093
    const response = await _getComments({ addonId, apiState, versionId });

    if (isErrorResponse(response)) {
      dispatch(actions.abortFetchVersionComments({ versionId }));
      dispatch(errorsActions.addError({ error: response.error }));
      return;
    }

    const map: { [key: string]: ExternalComment[] } = {};

    for (const comment of response.results) {
      let key = '';
      if (comment.filename) {
        key = comment.filename;
      }
      if (comment.lineno) {
        key = `${key}:${comment.lineno}`;
      }
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(comment);
    }

    for (const key of Object.keys(map)) {
      let line = null;
      let fileName = null;
      if (key) {
        const parts = key.split(':');
        fileName = parts[0];
        if (parts[1]) {
          line = parseInt(parts[1], 10);
        }
      }

      dispatch(
        actions.setComments({
          fileName,
          line,
          versionId,
          comments: map[key],
        }),
      );
    }
  };
};

export const manageComment = ({
  /* istanbul ignore next */
  _createOrUpdateComment = createOrUpdateComment,
  addonId,
  cannedResponseId,
  comment,
  commentId,
  fileName,
  line,
  versionId,
}: {
  _createOrUpdateComment?: typeof createOrUpdateComment;
  addonId: number;
  cannedResponseId?: number;
  comment?: string;
  commentId: number | undefined;
  fileName: string | null;
  line: number | null;
  versionId: number;
}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    dispatch(
      actions.beginSaveComment({
        versionId,
        fileName,
        line,
        pendingCommentText: comment || null,
      }),
    );

    const response = await _createOrUpdateComment({
      addonId,
      apiState,
      cannedResponseId,
      comment,
      commentId,
      fileName,
      line,
      versionId,
    });

    if (isErrorResponse(response)) {
      dispatch(actions.abortSaveComment({ versionId, fileName, line }));
      dispatch(errorsActions.addError({ error: response.error }));
    } else {
      dispatch(actions.finishComment({ versionId, fileName, line }));
      dispatch(
        actions.setComments({
          versionId,
          fileName,
          line,
          comments: [response],
        }),
      );
    }
  };
};

export const stateForVersion = ({
  state,
  versionId,
}: {
  state: CommentsState;
  versionId: number;
}): CommentsState => {
  const reset = state.forVersionId !== versionId;
  return {
    ...state,
    byId: reset ? {} : state.byId,
    byKey: reset ? {} : state.byKey,
    forVersionId: versionId,
  };
};

const prepareStateForKeyChange = ({
  state,
  keyParams,
  versionId,
}: {
  state: CommentsState;
  keyParams: CommentKeyParams;
  versionId: number;
}) => {
  const newState = stateForVersion({ state, versionId });
  const key = createCommentKey(keyParams);
  const info = newState.byKey[key] || createEmptyCommentInfo();
  return { key, info, newState };
};

const reducer: Reducer<CommentsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): CommentsState => {
  switch (action.type) {
    case getType(actions.abortFetchVersionComments): {
      const { versionId } = action.payload;
      const newState = stateForVersion({ state, versionId });

      return { ...newState, isLoading: false };
    }
    case getType(actions.beginComment): {
      const { versionId, ...keyParams } = action.payload;
      const { key, info, newState } = prepareStateForKeyChange({
        state,
        keyParams,
        versionId,
      });

      return {
        ...newState,
        byKey: {
          ...newState.byKey,
          [key]: {
            ...info,
            beginNewComment: true,
            pendingCommentText: null,
            savingComment: false,
          },
        },
      };
    }
    case getType(actions.beginSaveComment): {
      const { pendingCommentText, versionId, ...keyParams } = action.payload;
      const { key, info, newState } = prepareStateForKeyChange({
        state,
        keyParams,
        versionId,
      });

      return {
        ...newState,
        byKey: {
          ...newState.byKey,
          [key]: {
            ...info,
            pendingCommentText,
            savingComment: true,
          },
        },
      };
    }
    case getType(actions.abortSaveComment): {
      const { versionId, ...keyParams } = action.payload;
      const { key, info, newState } = prepareStateForKeyChange({
        state,
        keyParams,
        versionId,
      });

      return {
        ...newState,
        byKey: {
          ...newState.byKey,
          [key]: {
            ...info,
            savingComment: false,
          },
        },
      };
    }
    case getType(actions.finishComment): {
      const { versionId, ...keyParams } = action.payload;
      const { key, info, newState } = prepareStateForKeyChange({
        state,
        keyParams,
        versionId,
      });

      return {
        ...newState,
        byKey: {
          ...newState.byKey,
          [key]: {
            ...info,
            beginNewComment: false,
            pendingCommentText: null,
            savingComment: false,
          },
        },
      };
    }
    case getType(actions.setComments): {
      const { comments, versionId, ...keyParams } = action.payload;
      const { key, info, newState } = prepareStateForKeyChange({
        state,
        keyParams,
        versionId,
      });

      const byId = { ...newState.byId };
      for (const comment of comments) {
        byId[comment.id] = createInternalComment(comment);
      }

      return {
        ...newState,
        byKey: {
          ...newState.byKey,
          [key]: {
            ...info,
            commentIds: info.commentIds.concat(comments.map((c) => c.id)),
          },
        },
        byId,
        isLoading: false,
      };
    }
    case getType(actions.beginFetchVersionComments): {
      const { versionId } = action.payload;
      const newState = stateForVersion({ state, versionId });

      return { ...newState, isLoading: true };
    }
    default:
      return state;
  }
};

export default reducer;
