import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import {
  ExternalVersionWithContent,
  Version,
  createInternalVersion,
} from './versions';

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
  commentIds: number[];
};

export type CommentsByKey = {
  [key: string]: CommentInfo;
};

export type CommentsState = {
  byKey: CommentsByKey;
  byId: {
    [id: number]: Comment;
  };
};

export const initialState: CommentsState = {
  byKey: {},
  byId: {},
};

export const createEmptyCommentInfo = (): CommentInfo => {
  return {
    beginNewComment: false,
    commentIds: [],
  };
};

type CommentKeyParams = {
  fileName: string | null;
  line: number | null;
  versionId: number;
};

export const createCommentKey = ({
  versionId,
  fileName,
  line,
}: CommentKeyParams) => {
  const key = [
    `version:${versionId}`,
    fileName && `file:${fileName}`,
    line && `line:${line}`,
  ]
    .filter(Boolean)
    .join(';');

  if (line !== null && fileName === null) {
    throw new Error(`Cannot create key "${key}" because fileName is empty`);
  }

  return key;
};

export const actions = {
  beginComment: createAction('BEGIN_COMMENT', (resolve) => {
    return (payload: CommentKeyParams) => resolve(payload);
  }),
  finishComment: createAction('FINISH_COMMENT', (resolve) => {
    return (payload: CommentKeyParams) => resolve(payload);
  }),
  setComment: createAction('SET_COMMENT', (resolve) => {
    return (
      payload: CommentKeyParams & {
        comment: ExternalComment;
      },
    ) => resolve(payload);
  }),
};

const reducer: Reducer<CommentsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): CommentsState => {
  switch (action.type) {
    case getType(actions.beginComment): {
      const key = createCommentKey(action.payload);
      const info = state.byKey[key] || createEmptyCommentInfo();

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            ...info,
            beginNewComment: true,
          },
        },
      };
    }
    case getType(actions.finishComment): {
      const key = createCommentKey(action.payload);
      const info = state.byKey[key] || createEmptyCommentInfo();

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            ...info,
            beginNewComment: false,
          },
        },
      };
    }
    case getType(actions.setComment): {
      const { comment, ...keyParams } = action.payload;

      const key = createCommentKey(keyParams);
      const info = state.byKey[key] || createEmptyCommentInfo();

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            ...info,
            commentIds: [...info.commentIds, comment.id],
          },
        },
        byId: {
          ...state.byId,
          [comment.id]: createInternalComment(comment),
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
