import { ONE_SPACE, Token, generateLineShapes } from './utils';

describe(__filename, () => {
  describe('generateLineShapes', () => {
    it('collects token counts', () => {
      const use = 'use';
      const strict = 'strict;';
      const line = `${use}${ONE_SPACE}${strict}`;

      expect(generateLineShapes([line])).toEqual([
        {
          line: 1,
          tokens: [
            expect.objectContaining({ token: Token.code, count: use.length }),
            expect.objectContaining({
              token: Token.whitespace,
              count: ONE_SPACE.length,
            }),
            expect.objectContaining({
              token: Token.code,
              count: strict.length,
            }),
            // This is the trailing whitespace
            expect.any(Object),
          ],
        },
      ]);
    });

    it('collects trailing whitespace', () => {
      const maxLineLength = 80;
      const line = 'use strict;';

      const allShapes = generateLineShapes([line], { maxLineLength });
      expect(allShapes[0].tokens.pop()).toEqual(
        expect.objectContaining({
          token: Token.whitespace,
          // This is a count of the trailing whitespace in relation to the
          // window size (i.e. maxLineLength)
          count: maxLineLength - line.length,
        }),
      );
    });

    it('collects leading whitespace', () => {
      const leadingSpace = '    ';
      const line = `${leadingSpace}use strict;`;

      const allShapes = generateLineShapes([line]);
      expect(allShapes[0].tokens[0]).toEqual(
        expect.objectContaining({
          token: Token.whitespace,
          count: leadingSpace.length,
        }),
      );
    });

    it('calculates width percentages', () => {
      const line = 'AAAA  BB';

      expect(
        generateLineShapes([line], { maxLineLength: line.length }),
      ).toEqual([
        {
          line: 1,
          tokens: [
            // Check 'AAAA', the first 50%
            expect.objectContaining({ token: Token.code, percentOfWidth: 50 }),
            // Check ' ', the next 25%
            expect.objectContaining({
              token: Token.whitespace,
              percentOfWidth: 25,
            }),
            // Check 'BB', the final 25%
            expect.objectContaining({ token: Token.code, percentOfWidth: 25 }),
          ],
        },
      ]);
    });

    it('respects maxLineLength when counting tokens', () => {
      const line = 'AA  BBB ; the rest will be ignored';

      expect(generateLineShapes([line], { maxLineLength: 8 })).toEqual([
        {
          line: 1,
          tokens: [
            // Expect 'AA' to be 2
            expect.objectContaining({ token: Token.code, count: 2 }),
            // Expect '  ' to be 2
            expect.objectContaining({ token: Token.whitespace, count: 2 }),
            // Expect 'BBB' to be 3
            expect.objectContaining({ token: Token.code, count: 3 }),
            // Expect ' ' to be 1
            expect.objectContaining({ token: Token.whitespace, count: 1 }),
          ],
        },
      ]);
    });

    it('respects maxLineLength when calculating width', () => {
      const line = 'AA  BB  ; the rest should be ignored';

      expect(generateLineShapes([line], { maxLineLength: 8 })).toEqual([
        {
          line: 1,
          tokens: [
            // Expect 'AA' to be 25%
            expect.objectContaining({ token: Token.code, percentOfWidth: 25 }),
            // Expect '  ' to be 25%
            expect.objectContaining({
              token: Token.whitespace,
              percentOfWidth: 25,
            }),
            // Expect 'BB' to be 25%
            expect.objectContaining({ token: Token.code, percentOfWidth: 25 }),
            // Expect '  ' to be 25%
            expect.objectContaining({
              token: Token.whitespace,
              percentOfWidth: 25,
            }),
          ],
        },
      ]);
    });

    it('handles multiple lines', () => {
      const lines = ['first', '', '', 'fourth'];

      expect(generateLineShapes(lines, { maxLineLength: 4 })).toEqual([
        {
          line: 1,
          tokens: [expect.objectContaining({ token: Token.code, count: 4 })],
        },
        {
          line: 2,
          tokens: [
            expect.objectContaining({ token: Token.whitespace, count: 4 }),
          ],
        },
        {
          line: 3,
          tokens: [
            expect.objectContaining({ token: Token.whitespace, count: 4 }),
          ],
        },
        {
          line: 4,
          tokens: [expect.objectContaining({ token: Token.code, count: 4 })],
        },
      ]);
    });

    it('treats any non-space character as code', () => {
      const line = '12345^#{}()_-+?!abc';
      expect(
        generateLineShapes([line], { maxLineLength: line.length }),
      ).toEqual([
        {
          line: 1,
          tokens: [
            expect.objectContaining({
              token: Token.code,
              count: line.length,
            }),
          ],
        },
      ]);
    });

    it('converts tabs to spaces', () => {
      const line = `\tdebugger;`;
      expect(
        generateLineShapes([line], { maxLineLength: line.length }),
      ).toEqual([
        {
          line: 1,
          tokens: [
            expect.objectContaining({ token: Token.whitespace, count: 2 }),
            expect.objectContaining({ token: Token.code, count: 8 }),
          ],
        },
      ]);
    });
  });
});
