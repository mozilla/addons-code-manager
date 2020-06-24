import {
  createFakeExternalLinterResult,
  createFakeLinterMessagesByPath,
  createErrorResponse,
  fakeExternalLinterResult,
  fakeExternalLinterMessage,
  setMockFetchResponseJSON,
  thunkTester,
  nextUniqueId,
} from '../test-helpers';
import linterReducer, {
  ExternalLinterMessage,
  ExternalLinterResult,
  LinterMessage,
  actions,
  createInternalMessage,
  fetchLinterMessagesIfNeeded,
  findMostSevereType,
  getMessageMap,
  getMessagesForPath,
  initialState,
  selectMessageMap,
} from './linter';
import { actions as errorsActions } from './errors';
import { getValidation } from '../api';
import configureStore from '../configureStore';

describe(__filename, () => {
  const createExternalLinterResult = (
    messages: Partial<ExternalLinterMessage>[] = [fakeExternalLinterMessage],
  ) => {
    return createFakeExternalLinterResult({ messages });
  };

  const _getMessageMap = (messages: Partial<ExternalLinterMessage>[]) => {
    return getMessageMap(createExternalLinterResult(messages));
  };

  describe('linterReducer', () => {
    it('initializes state on beginFetchLinterResult', () => {
      const versionId = 1;

      let state;
      state = linterReducer(
        state,
        actions.loadLinterResult({
          versionId,
          result: fakeExternalLinterResult,
        }),
      );
      state = linterReducer(
        state,
        actions.beginFetchLinterResult({ versionId }),
      );

      expect(state).toEqual({
        forVersionId: versionId,
        messageMap: undefined,
        isLoading: true,
      });
    });

    it('resets versionId on beginFetchLinterResult', () => {
      const versionId = 1;
      let state;
      state = linterReducer(
        state,
        actions.beginFetchLinterResult({ versionId: versionId + 1 }),
      );
      state = linterReducer(
        state,
        actions.beginFetchLinterResult({ versionId }),
      );

      expect(state).toMatchObject({ forVersionId: versionId });
    });

    it('stores LinterMessageMap on loadLinterResult', () => {
      const versionId = 1;

      const result = createExternalLinterResult([
        { ...fakeExternalLinterMessage, uid: 'abc3321' },
        { ...fakeExternalLinterMessage, uid: 'bcd3322' },
      ]);

      let state;
      state = linterReducer(
        state,
        actions.beginFetchLinterResult({ versionId }),
      );
      state = linterReducer(
        state,
        actions.loadLinterResult({ versionId, result }),
      );

      expect(state).toEqual({
        forVersionId: versionId,
        messageMap: getMessageMap(result),
        isLoading: false,
      });
    });

    it('stores versionId on loadLinterResult', () => {
      const result = createExternalLinterResult();
      const versionId = 1;
      let state;

      state = linterReducer(
        state,
        actions.loadLinterResult({ versionId: versionId + 1, result }),
      );
      state = linterReducer(
        state,
        actions.loadLinterResult({ versionId, result }),
      );

      expect(state).toMatchObject({ forVersionId: versionId });
    });

    it('resets state on abortFetchLinterResult', () => {
      const versionId = 1;

      let state;
      state = linterReducer(
        state,
        actions.abortFetchLinterResult({ versionId: versionId + 1 }),
      );
      state = linterReducer(
        state,
        actions.abortFetchLinterResult({ versionId }),
      );

      expect(state).toMatchObject({ forVersionId: versionId });
    });

    it('stores versionId on abortFetchLinterResult', () => {
      const versionId = 1;
      let state;
      state = linterReducer(
        state,
        actions.beginFetchLinterResult({ versionId: versionId + 1 }),
      );
      state = linterReducer(
        state,
        actions.abortFetchLinterResult({ versionId }),
      );

      expect(state).toMatchObject({ forVersionId: versionId });
    });
  });

  describe('selectMessageMap', () => {
    it('returns a LinterMessageMap', () => {
      const versionId = 1;

      const result = createExternalLinterResult([
        { ...fakeExternalLinterMessage, uid: 'abc3321' },
        { ...fakeExternalLinterMessage, uid: 'bcd3322' },
      ]);

      const state = linterReducer(
        undefined,
        actions.loadLinterResult({ versionId, result }),
      );

      expect(selectMessageMap(state, versionId)).toEqual(getMessageMap(result));
    });

    it('only returns a LinterMessageMap for the right version', () => {
      const versionId = 1;
      const state = linterReducer(
        undefined,
        actions.loadLinterResult({
          versionId,
          result: createExternalLinterResult(),
        }),
      );

      expect(selectMessageMap(state, versionId + 1)).toEqual(undefined);
    });

    it('returns undefined when a LinterMessageMap does not exist', () => {
      const versionId = 1;
      expect(selectMessageMap(initialState, versionId)).toEqual(undefined);
    });
  });

  describe('getMessageMap', () => {
    it('maps a message to a file and line', () => {
      const uid = '9a07163bb74e476c96a2bd467a2bbe52';
      const type = 'notice';
      const message = 'on* attribute being set using setAttribute';
      const description = ['To prevent vulnerabilities...'];

      const file = 'chrome/content/youtune.js';
      const line = 226;
      const column = 2;

      expect(
        _getMessageMap([
          {
            column,
            description,
            file,
            line,
            message,
            type,
            uid,
          },
        ]),
      ).toMatchObject({
        byPath: {
          [file]: {
            byLine: {
              [line]: [
                {
                  column,
                  description,
                  file,
                  line,
                  message,
                  type,
                  uid,
                },
              ],
            },
          },
        },
      });
    });

    it('maps a global message to a file', () => {
      const uid = '9a07163bb74e476c96a2bd467a2bbe52';
      const type = 'notice';
      const message = 'on* attribute being set using setAttribute';
      const description = ['To prevent vulnerabilities...'];

      const file = 'chrome/content/youtune.js';
      const line = null;
      const column = null;

      expect(
        _getMessageMap([
          {
            column,
            description,
            file,
            line,
            message,
            type,
            uid,
          },
        ]),
      ).toMatchObject({
        byPath: {
          [file]: {
            global: [
              {
                column,
                description,
                file,
                line,
                message,
                type,
                uid,
              },
            ],
          },
        },
      });
    });

    it('maps a general message', () => {
      const uid = 'example-uid';
      const type = 'warning';
      const message = 'This extension appears to be invalid';
      const description = ['Longer description...'];

      const file = null;
      const line = null;
      const column = null;

      expect(
        _getMessageMap([
          {
            column,
            description,
            file,
            line,
            message,
            type,
            uid,
          },
        ]),
      ).toMatchObject({
        general: [
          {
            column,
            description,
            file,
            line,
            message,
            type,
            uid,
          },
        ],
      });
    });

    it('maps multiple global messages', () => {
      const uid1 = 'first';
      const uid2 = 'second';
      const file = 'chrome/content/youtune.js';

      expect(
        _getMessageMap([
          {
            column: null,
            file,
            line: null,
            uid: uid1,
          },
          {
            column: null,
            file,
            line: null,
            uid: uid2,
          },
        ]),
      ).toMatchObject({
        byPath: {
          [file]: { global: [{ uid: uid1 }, { uid: uid2 }] },
        },
      });
    });

    it('maps multiple messages at the same line', () => {
      const uid1 = 'first';
      const uid2 = 'second';
      const file = 'chrome/content/youtune.js';
      const line = 123;

      expect(
        _getMessageMap([
          {
            file,
            line,
            uid: uid1,
          },
          {
            file,
            line,
            uid: uid2,
          },
        ]),
      ).toMatchObject({
        byPath: {
          [file]: { byLine: { [line]: [{ uid: uid1 }, { uid: uid2 }] } },
        },
      });
    });

    it('maps zero messages', () => {
      expect(_getMessageMap([])).toEqual({ byPath: {}, general: [] });
    });
  });

  describe('createInternalMessage', () => {
    it('converts the description to an array', () => {
      const description = 'This is a detailed message about a code problem';
      expect(
        createInternalMessage({
          ...fakeExternalLinterMessage,
          description,
        }),
      ).toMatchObject({
        description: [description],
      });
    });

    it('does not convert descriptions already in array form', () => {
      const description = ['This is a detailed message about a code problem'];
      expect(
        createInternalMessage({
          ...fakeExternalLinterMessage,
          description,
        }),
      ).toMatchObject({
        description,
      });
    });

    it('maps a subset of external fields', () => {
      const id = ['SOME_CODE'];
      const column = 2;
      const description = ['To prevent vulnerabilities...'];
      const file = 'chrome/content/youtune.js';
      const line = 226;
      const message = 'on* attribute being set using setAttribute';
      const type = 'notice';
      const uid = '9a07163bb74e476c96a2bd467a2bbe52';

      expect(
        createInternalMessage({
          ...fakeExternalLinterMessage,
          id,
          column,
          description,
          file,
          line,
          message,
          type,
          uid,
        }),
      ).toEqual({
        code: id,
        column,
        description,
        file,
        line,
        message,
        type,
        uid,
      });
    });
  });

  describe('fetchLinterMessagesIfNeeded', () => {
    const store = configureStore();

    const _fetchLinterMessagesIfNeeded = ({
      _getValidation = undefined,
      versionId = 123,
      url = '/validation/1234/validation.json',
      result = createExternalLinterResult(),
      respondWithResult = true,
    }: {
      _getValidation?: typeof getValidation;
      versionId?: number;
      url?: string;
      result?: ExternalLinterResult;
      respondWithResult?: boolean;
    } = {}) => {
      if (respondWithResult) {
        setMockFetchResponseJSON(result);
      }

      return thunkTester({
        createThunk: () =>
          fetchLinterMessagesIfNeeded({ _getValidation, url, versionId }),
        store,
      });
    };

    it('calls getValidation', async () => {
      const validation = fakeExternalLinterResult;
      const _getValidation = jest
        .fn()
        .mockReturnValue(Promise.resolve(validation));
      const url = 'validation/3215/validation.json';

      const { thunk } = _fetchLinterMessagesIfNeeded({ _getValidation, url });
      await thunk();

      expect(_getValidation).toHaveBeenCalledWith({
        apiState: store.getState().api,
        url,
      });
    });

    it('dispatches beginFetchLinterResult', async () => {
      const versionId = 124;

      const { dispatch, thunk } = _fetchLinterMessagesIfNeeded({ versionId });
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginFetchLinterResult({ versionId }),
      );
    });

    it('dispatches loadLinterResult', async () => {
      const result = createExternalLinterResult();
      const versionId = 124;

      const { dispatch, thunk } = _fetchLinterMessagesIfNeeded({
        versionId,
        result: createExternalLinterResult(),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadLinterResult({ versionId, result }),
      );
    });

    it('handles a bad response status', async () => {
      const error = new Error('Bad Request');
      const _getValidation = jest
        .fn()
        .mockReturnValue(Promise.resolve(createErrorResponse({ error })));
      const versionId = nextUniqueId();

      const { dispatch, thunk } = _fetchLinterMessagesIfNeeded({
        _getValidation,
        versionId,
        respondWithResult: false,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        errorsActions.addError(
          createErrorResponse({
            error: expect.any(Error),
          }),
        ),
      );
      expect(dispatch).toHaveBeenCalledWith(
        actions.abortFetchLinterResult({ versionId }),
      );
    });

    it('early returns and does not do anything when linter messages are already being fetched', async () => {
      const url = '/some/url';
      const versionId = 123;
      store.dispatch(actions.beginFetchLinterResult({ versionId }));

      const { dispatch, thunk } = thunkTester({
        createThunk: () => fetchLinterMessagesIfNeeded({ url, versionId }),
        store,
      });

      await thunk();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not abort if linter messages are being fetched for a different version ID', async () => {
      const url = '/some/url';
      const versionId = 123;
      const anotherVersionId = versionId + 246;
      store.dispatch(actions.beginFetchLinterResult({ versionId }));

      const { dispatch, thunk } = thunkTester({
        createThunk: () =>
          fetchLinterMessagesIfNeeded({ url, versionId: anotherVersionId }),
        store,
      });

      await thunk();

      // Other actions will be dispatched but we're only interested in making
      // sure actions are dispatched for `anotherVersionId` here.
      expect(dispatch).toHaveBeenCalledWith(
        actions.beginFetchLinterResult({ versionId: anotherVersionId }),
      );
    });
  });

  describe('findMostSevereType', () => {
    const createMessageWithType = (type: LinterMessage['type']) => {
      return createInternalMessage({
        ...fakeExternalLinterMessage,
        type,
      });
    };

    it('finds an error type', () => {
      expect(
        findMostSevereType([
          createMessageWithType('warning'),
          createMessageWithType('error'),
          createMessageWithType('notice'),
        ]),
      ).toEqual('error');
    });

    it('finds a warning type', () => {
      expect(
        findMostSevereType([
          createMessageWithType('notice'),
          createMessageWithType('warning'),
          createMessageWithType('notice'),
        ]),
      ).toEqual('warning');
    });

    it('finds a notice type', () => {
      expect(
        findMostSevereType([
          createMessageWithType('notice'),
          createMessageWithType('notice'),
          createMessageWithType('notice'),
        ]),
      ).toEqual('notice');
    });

    it('handles a single message', () => {
      expect(findMostSevereType([createMessageWithType('error')])).toEqual(
        'error',
      );
    });

    it('requires a non-empty list of messages', () => {
      expect(() => findMostSevereType([])).toThrow(/cannot be empty/);
    });

    it('throws for unexpected message types', () => {
      expect(() => {
        findMostSevereType([
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          createMessageWithType('__unreal_type__'),
        ]);
      }).toThrow(/unknown types/);
    });
  });

  describe('getMessagesForPath', () => {
    const uid1 = 'global1';
    const uid2 = 'global2';
    const uid3 = 'line1-1';
    const uid4 = 'line1-2';
    const uid5 = 'line2';

    it('throws an error if an extra key is found in the linter message map', () => {
      const messages = createFakeLinterMessagesByPath({
        messages: [{ line: null, uid: '123' }],
      });

      const unexpectedKey = 'future';
      // Artifically inject a new key in the message map.
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      messages[unexpectedKey] = {};

      expect(() => {
        getMessagesForPath(messages);
      }).toThrow(new RegExp(`Unexpected key "${unexpectedKey}" found`));
    });

    it('aggregates global and byLine messages', () => {
      const externalMessages = [
        { line: null, uid: uid1 },
        { line: null, uid: uid2 },
        { line: 1, uid: uid3 },
        { line: 1, uid: uid4 },
        { line: 2, uid: uid5 },
      ];
      const messages = createFakeLinterMessagesByPath({
        messages: externalMessages,
      });

      const messagesForPath = getMessagesForPath(messages);
      expect(messagesForPath.length).toEqual(5);
      expect(messagesForPath[0]).toHaveProperty('uid', uid1);
      expect(messagesForPath[1]).toHaveProperty('uid', uid2);
      expect(messagesForPath[2]).toHaveProperty('uid', uid3);
      expect(messagesForPath[3]).toHaveProperty('uid', uid4);
      expect(messagesForPath[4]).toHaveProperty('uid', uid5);
    });

    it('returns with only global messages', () => {
      const externalMessages = [
        { line: null, uid: uid1 },
        { line: null, uid: uid2 },
      ];
      const messages = createFakeLinterMessagesByPath({
        messages: externalMessages,
      });

      const messagesForPath = getMessagesForPath(messages);
      expect(messagesForPath.length).toEqual(2);
      expect(messagesForPath[0]).toHaveProperty('uid', uid1);
      expect(messagesForPath[1]).toHaveProperty('uid', uid2);
    });

    it('returns with only byLine messages', () => {
      const externalMessages = [
        { line: 1, uid: uid3 },
        { line: 1, uid: uid4 },
        { line: 2, uid: uid5 },
      ];
      const messages = createFakeLinterMessagesByPath({
        messages: externalMessages,
      });

      const messagesForPath = getMessagesForPath(messages);
      expect(messagesForPath.length).toEqual(3);
      expect(messagesForPath[0]).toHaveProperty('uid', uid3);
      expect(messagesForPath[1]).toHaveProperty('uid', uid4);
      expect(messagesForPath[2]).toHaveProperty('uid', uid5);
    });
  });
});
