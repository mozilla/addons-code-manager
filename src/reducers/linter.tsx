import log from 'loglevel';
import { Reducer } from 'redux';
import { ActionType, deprecated, getType } from 'typesafe-actions';

import { ThunkActionCreator } from '../configureStore';
import { actions as errorsActions } from './errors';
import { getValidation, isErrorResponse } from '../api';
import { Version } from './versions';

// See: https://github.com/piotrwitek/typesafe-actions/issues/143
const { createAction } = deprecated;

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
  // Global messages apply to the entire file.
  global: LinterMessage[];
  byLine: LinterMessagesByLine;
};

export type LinterMessageMap = {
  byPath: {
    // The 'path' key matches the key of ExternalVersionFile['entries']
    [path: string]: LinterMessagesByPath;
  };
  // General messages apply to the entire add-on.
  general: LinterMessage[];
};

export const getMessageMap = (result: ExternalLinterResult) => {
  const msgMap: LinterMessageMap = {
    byPath: {},
    general: [],
  };

  result.validation.messages.forEach((message) => {
    const internalMessage = createInternalMessage(message);

    if (!message.file) {
      msgMap.general.push(internalMessage);
      return;
    }
    if (!msgMap.byPath[message.file]) {
      msgMap.byPath[message.file] = { global: [], byLine: {} };
    }

    const map = msgMap.byPath[message.file];

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

export const findMostSevereType = (
  messages: LinterMessage[],
): LinterMessage['type'] => {
  if (!messages.length) {
    throw new Error('"messages" cannot be empty');
  }
  const allTypes = messages.map((msg) => msg.type);
  const orderedTypes: LinterMessage['type'][] = ['error', 'warning', 'notice'];

  for (const type of orderedTypes) {
    if (allTypes.includes(type)) {
      return type;
    }
  }

  // This is unlikely but it's still possible if, say, the API
  // was out of sync with our type definitions.
  throw new Error(
    `Linter messages all have unknown types: ${allTypes.join(', ')}`,
  );
};

export const getMessagesForPath = (
  messages: LinterMessagesByPath,
): LinterMessage[] => {
  // This is useful to make sure we do not miss linter messages if
  // `LinterMessageMap` is updated with new maps of messages.
  const allowedKeys = ['global', 'byLine'];
  Object.keys(messages).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unexpected key "${key}" found.`);
    }
  });

  const allMessages = [...messages.global];

  Object.keys(messages.byLine).forEach((key) => {
    allMessages.push(...messages.byLine[parseInt(key, 10)]);
  });

  return allMessages;
};

export type LinterState = {
  forVersionId: undefined | number;
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

export const fetchLinterMessagesIfNeeded = ({
  _getValidation = getValidation,
  version,
}: {
  _getValidation?: typeof getValidation;
  version: Version;
}): ThunkActionCreator => {
  return async (dispatch, getState) => {
    const { api: apiState, linter } = getState();
    const versionId = version.id;
    // See: https://github.com/mozilla/addons-code-manager/issues/591
    if (linter.isLoading && linter.forVersionId === version.id) {
      log.debug('Aborting because linter messages are already being fetched');
      return;
    }

    dispatch(actions.beginFetchLinterResult({ versionId }));

    const response = await _getValidation({
      apiState,
      addonId: version.addon.id,
      fileId: version.fileId,
    });

    if (isErrorResponse(response)) {
      dispatch(actions.abortFetchLinterResult({ versionId }));
      dispatch(errorsActions.addError({ error: response.error }));
    }

    dispatch(
      actions.loadLinterResult({
        versionId,
        result: response as ExternalLinterResult,
      }),
    );
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
        messageMap: { byPath: {}, general: [] },
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
