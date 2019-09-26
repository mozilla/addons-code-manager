import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';
import { actions as errorsActions } from './errors';
import {
  ExternalVersionWithContent,
  Version,
  createInternalVersion,
} from './versions';
import { createOrUpdateComment, isErrorResponse } from '../api';

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
  hasComments: undefined | boolean;
};

export const initialState: CommentsState = {
  byKey: {},
  byId: {},
  forVersionId: undefined,
  hasComments: undefined,
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

export const actions = {
  abortSaveComment: createAction('ABORT_SAVE_COMMENT', (resolve) => {
    return (payload: CommentKeyParams & { versionId: number }) =>
      resolve(payload);
  }),
  beginComment: createAction('BEGIN_COMMENT', (resolve) => {
    return (payload: CommentKeyParams & { versionId: number }) =>
      resolve(payload);
  }),
  beginSaveComment: createAction('BEGIN_SAVE_COMMENT', (resolve) => {
    return (
      payload: CommentKeyParams & {
        pendingCommentText: string | null;
        versionId: number;
      },
    ) => resolve(payload);
  }),
  finishComment: createAction('FINISH_COMMENT', (resolve) => {
    return (payload: CommentKeyParams & { versionId: number }) =>
      resolve(payload);
  }),
  setComments: createAction('SET_COMMENTS', (resolve) => {
    return (
      payload: CommentKeyParams & {
        comments: ExternalComment[];
        versionId: number;
      },
    ) => resolve(payload);
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
  return comments.hasComments;
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

const getKeyAndInfo = (state: CommentsState, keyParams: CommentKeyParams) => {
  const key = createCommentKey(keyParams);
  const info = state.byKey[key] || createEmptyCommentInfo();
  return { key, info };
};

const reducer: Reducer<CommentsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): CommentsState => {
  switch (action.type) {
    case getType(actions.beginComment): {
      const { versionId, ...keyParams } = action.payload;
      const { key, info } = getKeyAndInfo(state, keyParams);

      return {
        ...state,
        forVersionId: versionId,
        byKey: {
          ...state.byKey,
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
      const { key, info } = getKeyAndInfo(state, keyParams);

      return {
        ...state,
        forVersionId: versionId,
        byKey: {
          ...state.byKey,
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
      const { key, info } = getKeyAndInfo(state, keyParams);

      return {
        ...state,
        forVersionId: versionId,
        byKey: {
          ...state.byKey,
          [key]: {
            ...info,
            savingComment: false,
          },
        },
      };
    }
    case getType(actions.finishComment): {
      const { versionId, ...keyParams } = action.payload;
      const { key, info } = getKeyAndInfo(state, keyParams);

      return {
        ...state,
        forVersionId: versionId,
        byKey: {
          ...state.byKey,
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
      const { key, info } = getKeyAndInfo(state, keyParams);

      const byId = { ...state.byId };
      for (const comment of comments) {
        byId[comment.id] = createInternalComment(comment);
      }

      const {
        forVersionId: lastVersionId,
        hasComments: lastStateHadComments,
      } = state;

      let hasComments = lastStateHadComments;
      if (hasComments === undefined || lastVersionId !== versionId) {
        hasComments = comments.length > 0;
      }

      return {
        ...state,
        forVersionId: versionId,
        byKey: {
          ...state.byKey,
          [key]: {
            ...info,
            commentIds: info.commentIds.concat(comments.map((c) => c.id)),
          },
        },
        byId,
        hasComments,
      };
    }
    default:
      return state;
  }
};

export default reducer;
