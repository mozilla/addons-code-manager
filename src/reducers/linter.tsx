import log from 'loglevel';
import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';

type LinterMessageBase = {
  column: number | null;
  file: string | null;
  line: number | null;
  message: string;
  type: 'notice' | 'error' | 'warning';
  uid: string;
};

export type LinterMessage = LinterMessageBase & {
  // See: https://github.com/mozilla/addons-linter/blob/dfbc613cbbae4e7e3cf6dc1bdbea120a5de105af/docs/rules.md
  code: string[];
  description: string[];
};

export type ExternalLinterMessage = LinterMessageBase & {
  description: string | string[];
  // These are some extra properties that we don't need to work with.
  context: string[];
  for_appversions: object;
  id: string[];
  tier: number;
};

export type ExternalLinterResult = {
  error: null | string;
  full_report_url: string;
  upload: string;
  url: string;
  validation: {
    detected_type: string;
    ending_tier: number;
    errors: number;
    message_tree: object;
    messages: ExternalLinterMessage[];
    metadata: object;
    notices: number;
    success: boolean;
    warnings: number;
  };
};

export const createInternalMessage = (
  message: ExternalLinterMessage,
): LinterMessage => {
  return {
    code: message.id,
    column: message.column,
    description: Array.isArray(message.description)
      ? message.description
      : [message.description],
    file: message.file,
    line: message.line,
    message: message.message,
    type: message.type,
    uid: message.uid,
  };
};

export type LinterMessagesByLine = {
  [line: number]: LinterMessage[];
};

export type LinterMessagesByPath = {
  global: LinterMessage[];
  byLine: LinterMessagesByLine;
};

export type LinterMessageMap = {
  // The 'path' key matches the key of ExternalVersionFile['entries']
  [path: string]: LinterMessagesByPath;
};

export const getMessageMap = (
  result: ExternalLinterResult,
  { _log = log }: { _log?: typeof log } = {},
) => {
  const msgMap: LinterMessageMap = {};

  result.validation.messages.forEach((message) => {
    if (!message.file) {
      // In reality, this will probably never happen but it's
      // possible since errors like this do exist. Let's log an
      // error to Sentry to alert us about it.
      _log.error(
        `Unexpectedly received a message not mapped to a file: ${
          message.message
        }`,
      );
      return;
    }
    if (!msgMap[message.file]) {
      msgMap[message.file] = { global: [], byLine: {} };
    }

    const internalMessage = createInternalMessage(message);
    const map = msgMap[message.file];

    if (message.line) {
      if (!map.byLine[message.line]) {
        map.byLine[message.line] = [];
      }
      map.byLine[message.line].push(internalMessage);
    } else {
      map.global.push(internalMessage);
    }
  });

  return msgMap;
};

export type LinterState = {
  forVersionId: void | number;
  isLoading: boolean;
  messageMap: undefined | LinterMessageMap;
};

export const initialState: LinterState = {
  forVersionId: undefined,
  isLoading: false,
  messageMap: undefined,
};

export const actions = {
  abortFetchLinterResult: createAction(
    'ABORT_FETCH_LINTER_RESULT',
    (resolve) => {
      return (payload: { versionId: number }) => resolve(payload);
    },
  ),
  beginFetchLinterResult: createAction(
    'BEGIN_FETCH_LINTER_RESULT',
    (resolve) => {
      return (payload: { versionId: number }) => resolve(payload);
    },
  ),
  loadLinterResult: createAction('LOAD_LINTER_RESULT', (resolve) => {
    return (payload: { versionId: number; result: ExternalLinterResult }) =>
      resolve(payload);
  }),
};

export const fetchLinterMessages = ({
  _log = log,
  url,
  versionId,
}: {
  _log?: typeof log;
  url: string;
  versionId: number;
}): ThunkActionCreator => {
  return async (dispatch) => {
    dispatch(actions.beginFetchLinterResult({ versionId }));

    // This is a special URL and returns a non-standard JSON response.
    const response = await fetch(url);

    try {
      if (!response.ok) {
        throw new Error(`Got status ${response.status} for URL ${url}`);
      }
      const result = await response.json();
      dispatch(actions.loadLinterResult({ versionId, result }));
    } catch (error) {
      _log.error(`TODO: handle this error: ${error}`);
      dispatch(actions.abortFetchLinterResult({ versionId }));
    }
  };
};

export const selectMessageMap = (
  linterState: LinterState,
  versionId: number,
): undefined | LinterMessageMap => {
  if (linterState.forVersionId !== versionId) {
    return undefined;
  }
  return linterState.messageMap;
};

const reducer: Reducer<LinterState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): LinterState => {
  switch (action.type) {
    case getType(actions.beginFetchLinterResult):
      return {
        ...state,
        forVersionId: action.payload.versionId,
        messageMap: undefined,
        isLoading: true,
      };
    case getType(actions.abortFetchLinterResult):
      return {
        ...state,
        forVersionId: action.payload.versionId,
        // TODO: when we have proper error handling, this can
        // set { messageMap: undefined } so that the component
        // knows it's OK to try fetching it again.
        messageMap: {},
        isLoading: false,
      };
    case getType(actions.loadLinterResult):
      return {
        ...state,
        forVersionId: action.payload.versionId,
        messageMap: getMessageMap(action.payload.result),
        isLoading: false,
      };
    default:
      return state;
  }
};

export default reducer;
