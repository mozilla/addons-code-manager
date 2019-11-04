import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';
import { actions as errorsActions } from './errors';
import {
  ExternalVersionWithContent,
  Version,
  createInternalVersion,
} from './versions';
import {
  createOrUpdateComment,
  deleteComment as apiDeleteComment,
  getAllComments,
  isErrorResponse,
} from '../api';

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
  beginDelete: boolean;
  considerDelete: boolean;
  content: string | null;
  userId: number;
  userName: string | null;
  userUrl: string | null;
  userUsername: string;
  version: Version;
};

export const createInternalComment = (comment: ExternalComment): Comment => {
  return {
    beginDelete: false,
    considerDelete: false,
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

type CommentsById = { [id: number]: Comment | undefined };

type FilePathsHavingComments = { [path: string]: boolean };

export type CommentsState = {
  byKey: CommentsByKey;
  byId: CommentsById;
  filePathsHavingComments: FilePathsHavingComments;
  forVersionId: undefined | number;
  isLoading: boolean;
  showSummaryOverlay: boolean;
};

export const initialState: CommentsState = {
  byKey: {},
  byId: {},
  filePathsHavingComments: {},
  forVersionId: undefined,
  isLoading: false,
  showSummaryOverlay: false,
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
  abortDeleteComment: createAction('ABORT_DELETE_COMMENT', (resolve) => {
    return (payload: { commentId: number }) => resolve(payload);
  }),
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
  beginDeleteComment: createAction('BEGIN_DELETE_COMMENT', (resolve) => {
    return (payload: { commentId: number }) => resolve(payload);
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
  considerDeleteComment: createAction('CONSIDER_DELETE_COMMENT', (resolve) => {
    return (payload: { commentId: number }) => resolve(payload);
  }),
  finishComment: createAction('FINISH_COMMENT', (resolve) => {
    return (payload: CommonPayload) => resolve(payload);
  }),
  hideSummaryOverlay: createAction('HIDE_COMMENTS_SUMMARY_OVERLAY'),
  setComments: createAction('SET_COMMENTS', (resolve) => {
    return (payload: { versionId: number; comments: ExternalComment[] }) =>
      resolve(payload);
  }),
  showSummaryOverlay: createAction('SHOW_COMMENTS_SUMMARY_OVERLAY'),
  toggleSummaryOverlay: createAction('TOGGLE_COMMENTS_SUMMARY_OVERLAY'),
  unsetComment: createAction('UNSET_COMMENT', (resolve) => {
    return (payload: { commentId: number }) => resolve(payload);
  }),
};

export type SelectCommentInfoParams = {
  comments: CommentsState;
  versionId: number;
} & CommentKeyParams;

export const selectCommentInfo = ({
  comments,
  fileName,
  line,
  versionId,
}: SelectCommentInfoParams): undefined | CommentInfo => {
  if (comments.forVersionId !== versionId) {
    return undefined;
  }
  return comments.byKey[createCommentKey({ fileName, line })];
};

export const selectComment = ({
  comments,
  id,
}: {
  comments: CommentsState;
  id: number;
}): Comment | undefined => {
  return comments.byId[id];
};

export const selectVersionComments = ({
  comments,
  versionId,
}: {
  comments: CommentsState;
  versionId: number;
}): Comment[] | undefined => {
  if (comments.forVersionId !== versionId) {
    return undefined;
  }
  return Object.keys(comments.byId).reduce((all: Comment[], id) => {
    const comment = selectComment({ comments, id: parseInt(id, 10) });
    if (comment) {
      all.push(comment);
    }
    return all;
  }, []);
};

export const selectVersionHasComments = ({
  _selectVersionComments = selectVersionComments,
  comments,
  versionId,
}: {
  _selectVersionComments?: typeof selectVersionComments;
  comments: CommentsState;
  versionId: number;
}): undefined | boolean => {
  const all = _selectVersionComments({ comments, versionId });
  return all ? all.length > 0 : undefined;
};

export const selectFilePathHasComments = ({
  comments,
  path,
  versionId,
}: {
  comments: CommentsState;
  path: string;
  versionId: number;
}): boolean => {
  if (comments.forVersionId !== versionId) {
    return false;
  }

  return comments.filePathsHavingComments[path] || false;
};

export const fetchAndLoadComments = ({
  _getAllComments = getAllComments,
  addonId,
  versionId,
}: {
  _getAllComments?: typeof getAllComments;
  addonId: number;
  versionId: number;
}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState, comments: commentsState } = getState();

    if (commentsState.isLoading) {
      return;
    }

    dispatch(actions.beginFetchVersionComments({ versionId }));

    // TODO: fetch all pages to get all comments.
    // https://github.com/mozilla/addons-code-manager/issues/1093
    const response = await _getAllComments({ addonId, apiState, versionId });

    if (isErrorResponse(response)) {
      dispatch(actions.abortFetchVersionComments({ versionId }));
      dispatch(errorsActions.addError({ error: response.error }));
    } else {
      dispatch(
        actions.setComments({
          versionId,
          comments: response.results,
        }),
      );
    }
  };
};

export const deleteComment = ({
  _apiDeleteComment = apiDeleteComment,
  addonId,
  commentId,
  versionId,
}: {
  _apiDeleteComment?: typeof apiDeleteComment;
  addonId: number;
  commentId: number;
  versionId: number;
}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState } = getState();

    dispatch(actions.beginDeleteComment({ commentId }));

    const response = await _apiDeleteComment({
      addonId,
      apiState,
      commentId,
      versionId,
    });

    if (isErrorResponse(response)) {
      dispatch(actions.abortDeleteComment({ commentId }));
      dispatch(errorsActions.addError({ error: response.error }));
    } else {
      dispatch(actions.unsetComment({ commentId }));
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
      dispatch(actions.setComments({ versionId, comments: [response] }));
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

const getKeyAndInfo = ({
  byKey,
  ...keyParams
}: { byKey: CommentsByKey } & CommentKeyParams) => {
  const key = createCommentKey(keyParams);
  const info = byKey[key] || createEmptyCommentInfo();
  return { key, info };
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
  const { key, info } = getKeyAndInfo({
    byKey: newState.byKey,
    ...keyParams,
  });
  return { key, info, newState };
};

export const adjustComment = ({
  state,
  id,
  props,
}: {
  state: CommentsState;
  id: number;
  props: Partial<Comment>;
}): Comment => {
  const comment = selectComment({ comments: state, id });
  if (!comment) {
    throw new Error(
      `Cannot adjust comment by ID=${id} because it does not exist`,
    );
  }

  return {
    ...comment,
    ...props,
  };
};

export const findAllSubpaths = (path: string): string[] => {
  const parts = [];
  const subpaths = [];

  const normPath = path.endsWith('/')
    ? path.substring(0, path.length - 1)
    : path;

  for (const part of normPath.split('/')) {
    parts.push(part);
    const subpath = parts.join('/');
    if (subpath) {
      subpaths.push(subpath);
    }
  }
  return subpaths;
};

const findFilePathsHavingComments = (byId: CommentsById) => {
  const map: FilePathsHavingComments = {};

  for (const id of Object.keys(byId)) {
    const comment = byId[parseInt(id, 10)];

    if (comment && comment.filename) {
      for (const part of findAllSubpaths(comment.filename)) {
        map[part] = true;
      }
    }
  }

  return map;
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
      const { comments, versionId } = action.payload;
      const newState = stateForVersion({ state, versionId });

      const byKey = { ...newState.byKey };
      const byId = { ...newState.byId };

      for (const comment of comments) {
        byId[comment.id] = createInternalComment(comment);

        const { key, info } = getKeyAndInfo({
          byKey,
          fileName: comment.filename || null,
          line: comment.lineno || null,
        });

        byKey[key] = {
          ...info,
          commentIds: info.commentIds.concat(comment.id),
        };
      }

      return {
        ...newState,
        byKey,
        byId,
        filePathsHavingComments: findFilePathsHavingComments(byId),
        isLoading: false,
      };
    }
    case getType(actions.beginFetchVersionComments): {
      const { versionId } = action.payload;
      const newState = stateForVersion({ state, versionId });

      return { ...newState, isLoading: true };
    }
    case getType(actions.abortDeleteComment): {
      const { commentId } = action.payload;

      return {
        ...state,
        byId: {
          ...state.byId,
          [commentId]: adjustComment({
            state,
            id: commentId,
            props: {
              beginDelete: false,
              considerDelete: false,
            },
          }),
        },
      };
    }
    case getType(actions.beginDeleteComment): {
      const { commentId } = action.payload;

      return {
        ...state,
        byId: {
          ...state.byId,
          [commentId]: adjustComment({
            state,
            id: commentId,
            props: {
              beginDelete: true,
              considerDelete: false,
            },
          }),
        },
      };
    }
    case getType(actions.considerDeleteComment): {
      const { commentId } = action.payload;

      return {
        ...state,
        byId: {
          ...state.byId,
          [commentId]: adjustComment({
            state,
            id: commentId,
            props: {
              beginDelete: false,
              considerDelete: true,
            },
          }),
        },
      };
    }
    case getType(actions.unsetComment): {
      const { commentId } = action.payload;

      const byId = { ...state.byId, [commentId]: undefined };

      const byKey = { ...state.byKey };
      for (const key of Object.keys(byKey)) {
        const info = byKey[key];
        byKey[key] = {
          ...info,
          commentIds: info.commentIds.filter((id) => id !== commentId),
        };
      }

      return {
        ...state,
        byId,
        byKey,
        filePathsHavingComments: findFilePathsHavingComments(byId),
      };
    }
    case getType(actions.hideSummaryOverlay): {
      return { ...state, showSummaryOverlay: false };
    }
    case getType(actions.showSummaryOverlay): {
      return { ...state, showSummaryOverlay: true };
    }
    case getType(actions.toggleSummaryOverlay): {
      return {
        ...state,
        showSummaryOverlay: !state.showSummaryOverlay,
      };
    }
    default:
      return state;
  }
};

export default reducer;
