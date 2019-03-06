import {
  fakeExternalLinterResult,
  fakeExternalLinterMessage,
} from '../test-helpers';
import {
  createInternalMessage,
  ExternalLinterMessage,
  getMessageMap,
} from './linter';

describe(__filename, () => {
  const _getMessageMap = (messages: Partial<ExternalLinterMessage>[]) => {
    return getMessageMap({
      ...fakeExternalLinterResult,
      validation: {
        ...fakeExternalLinterResult.validation,
        messages: messages.map((msg) => {
          return { ...fakeExternalLinterMessage, ...msg };
        }),
      },
    });
  };

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
          column,
          description,
          file,
          line,
          message,
          type,
          uid,
        }),
      ).toEqual({
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
});
