import { getLanguage, getLines } from './utils';

describe(__filename, () => {
  describe('getLanguage', () => {
    it('returns "text" when mime type is unsupported', () => {
      expect(getLanguage('unknown/mimetype')).toEqual('text');
    });

    it.each([
      ['application/javascript', 'js'],
      ['text/javascript', 'js'],
      ['application/json', 'json'],
      ['application/xml', 'xml'],
      ['text/css', 'css'],
      ['text/html', 'html'],
    ])('supports %s', (mimeType, language) => {
      expect(getLanguage(mimeType)).toEqual(language);
    });
  });

  describe('getLines', () => {
    it('splits a content into lines', () => {
      const lines = ['foo', 'bar'];
      const content = lines.join('\n');

      expect(getLines(content)).toEqual(lines);
    });

    it('supports Windnows line endings', () => {
      const lines = ['foo', 'bar'];
      const content = `${lines.join('\r\n')}`;

      expect(getLines(content)).toEqual(lines);
    });
  });
});
