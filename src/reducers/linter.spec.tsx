/* global fetchMock */
import log from 'loglevel';

import {
  createFakeExternalLinterResult,
  fakeExternalLinterResult,
  fakeExternalLinterMessage,
  createFakeLogger,
  thunkTester,
} from '../test-helpers';
import linterReducer, {
  ExternalLinterMessage,
  ExternalLinterResult,
  actions,
  createInternalMessage,
  fetchLinterMessages,
  getMessageMap,
  initialState,
  selectMessageMap,
} from './linter';

describe(__filename, () => {
  const createExternalLinterResult = (
    messages: Partial<ExternalLinterMessage>[] = [fakeExternalLinterMessage],
  ) => {
    return createFakeExternalLinterResult({ messages });
  };

  const _getMessageMap = (
    messages: Partial<ExternalLinterMessage>[],
    { _log }: { _log?: typeof log } = {},
  ) => {
    return getMessageMap(createExternalLinterResult(messages), { _log });
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
        [file]: { global: [{ uid: uid1 }, { uid: uid2 }] },
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
        [file]: { byLine: { [line]: [{ uid: uid1 }, { uid: uid2 }] } },
      });
    });

    it('maps zero messages', () => {
      expect(_getMessageMap([])).toEqual({});
    });

    it('logs an error about messages not mapped to any file', () => {
      const fakeLog = createFakeLogger();

      const message = 'manifest.json not found';
      const description = ['No manifest.json file was found'];

      expect(
        _getMessageMap(
          [
            {
              column: null,
              description,
              file: null,
              line: null,
              message,
            },
          ],
          { _log: fakeLog },
        ),
      ).toEqual({});

      expect(fakeLog.error).toHaveBeenCalled();
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

  describe('fetchLinterMessages', () => {
    const _fetchLinterMessages = ({
      _log,
      versionId = 123,
      url = '/validation/1234/validation.json',
      result = createExternalLinterResult(),
      respondWithResult = true,
    }: {
      _log?: typeof log;
      versionId?: number;
      url?: string;
      result?: ExternalLinterResult;
      respondWithResult?: boolean;
    } = {}) => {
      if (respondWithResult) {
        fetchMock.mockResponse(JSON.stringify(result));
      }

      return thunkTester({
        createThunk: () => fetchLinterMessages({ _log, url, versionId }),
      });
    };

    it('fetches the URL', async () => {
      const url = 'validation/3215/validation.json';

      const { thunk } = _fetchLinterMessages({ url });
      await thunk();

      expect(fetchMock).toHaveBeenCalledWith(url);
    });

    it('dispatches beginFetchLinterResult', async () => {
      const versionId = 124;

      const { dispatch, thunk } = _fetchLinterMessages({ versionId });
      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.beginFetchLinterResult({ versionId }),
      );
    });

    it('dispatches loadLinterResult', async () => {
      const result = createExternalLinterResult();
      const versionId = 124;

      const { dispatch, thunk } = _fetchLinterMessages({
        versionId,
        result: createExternalLinterResult(),
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.loadLinterResult({ versionId, result }),
      );
    });

    it('handles a bad response status', async () => {
      fetchMock.mockResponse('', { status: 400 });
      const versionId = 124;
      const fakeLog = createFakeLogger();

      const { dispatch, thunk } = _fetchLinterMessages({
        _log: fakeLog,
        versionId,
        respondWithResult: false,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortFetchLinterResult({ versionId }),
      );
      expect(fakeLog.error).toHaveBeenCalled();
    });

    it('handles an invalid JSON response', async () => {
      fetchMock.mockResponse('_this is not ^& valid JSON');
      const versionId = 124;
      const fakeLog = createFakeLogger();

      const { dispatch, thunk } = _fetchLinterMessages({
        _log: fakeLog,
        versionId,
        respondWithResult: false,
      });

      await thunk();

      expect(dispatch).toHaveBeenCalledWith(
        actions.abortFetchLinterResult({ versionId }),
      );
      expect(fakeLog.error).toHaveBeenCalledWith(
        expect.stringMatching(/FetchError/),
      );
    });
  });
});
