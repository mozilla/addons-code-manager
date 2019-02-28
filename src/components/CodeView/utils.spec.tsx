import { getLines } from './utils';

describe(__filename, () => {
  describe('getLines', () => {
    it('splits a content into lines', () => {
      const lines = ['foo', 'bar'];
      const content = lines.join('\n');

      expect(getLines(content)).toEqual(lines);
    });

    it('supports Windows line endings', () => {
      const lines = ['foo', 'bar'];
      const content = `${lines.join('\r\n')}`;

      expect(getLines(content)).toEqual(lines);
    });
  });
});
