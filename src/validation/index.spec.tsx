/* eslint-disable @typescript-eslint/camelcase */

import { ExternalMessage, getMessageMap } from '.';

describe(__filename, () => {
  const validationSample = {
    error: null,
    full_report_url: '/upload/d5d993a5a2fa4b759ae2fa3b2eda2a38',
    upload: 'd5d993a5a2fa4b759ae2fa3b2eda2a38',
    url: '/upload/d5d993a5a2fa4b759ae2fa3b2eda2a38/json',
    validation: {
      detected_type: 'extension',
      ending_tier: 5,
      errors: 0,
      message_tree: {},
      messages: [],
      metadata: {},
      notices: 2,
      success: false,
      warnings: 5,
    },
  };

  const externalMessageSample: ExternalMessage = {
    column: 2,
    context: ['<code>'],
    description: 'To prevent vulnerabilities...',
    file: 'chrome/content/youtune.js',
    for_appversions: {
      '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}': ['4.0b1'],
    },
    id: [],
    line: 226,
    message: 'on* attribute being set using setAttribute',
    tier: 3,
    type: 'notice',
    uid: '9a07163bb74e476c96a2bd467a2bbe52',
  };

  const _getMessageMap = (messages: Partial<ExternalMessage>[]) => {
    return getMessageMap({
      ...validationSample,
      validation: {
        ...validationSample.validation,
        messages: messages.map((msg) => {
          return { ...externalMessageSample, ...msg };
        }),
      },
    });
  };

  describe('getMessageMap', () => {
    it('maps a message to a file and line', () => {
      const uid = '9a07163bb74e476c96a2bd467a2bbe52';
      const type = 'notice';
      const message = 'on* attribute being set using setAttribute';
      const description = 'To prevent vulnerabilities...';

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
      const description = 'To prevent vulnerabilities...';

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
});
