import filesize from 'filesize';
import queryString from 'query-string';

import {
  formatFilesize,
  getLanguageFromMimeType,
  getLocalizedString,
  getPathFromQueryString,
  nl2br,
  sanitizeHTML,
} from './utils';
import { createFakeHistory, createFakeLocation } from './test-helpers';

describe(__filename, () => {
  describe('getLocalizedString', () => {
    it('returns a localized string for a given language', () => {
      const lang = 'fr';
      const value = 'un peu de contenu';
      const localizedStringMap = {
        en: 'some content',
        [lang]: value,
      };

      expect(getLocalizedString(localizedStringMap, lang)).toEqual(value);
    });

    it('returns undefined when localized string map does not contain the specified language', () => {
      const lang = 'fr';
      const localizedStringMap = {};

      expect(getLocalizedString(localizedStringMap, lang)).toEqual(undefined);
    });

    it('defaults to REACT_APP_DEFAULT_API_LANG', () => {
      const lang = process.env.REACT_APP_DEFAULT_API_LANG as string;
      const value = 'some content';
      const localizedStringMap = {
        [lang]: value,
      };

      expect(getLocalizedString(localizedStringMap)).toEqual(value);
    });
  });

  describe('getLanguageFromMimeType', () => {
    it('returns "text" when mime type is unsupported', () => {
      expect(getLanguageFromMimeType('unknown/mimetype')).toEqual('text');
    });

    it.each([
      ['application/javascript', 'js'],
      ['text/javascript', 'js'],
      ['application/json', 'json'],
      ['application/xml', 'xml'],
      ['text/css', 'css'],
      ['text/html', 'html'],
    ])('supports %s', (mimeType, language) => {
      expect(getLanguageFromMimeType(mimeType)).toEqual(language);
    });
  });

  describe('sanitizeHTML', () => {
    it('does not change links', () => {
      const html = '<a href="http://example.org">link</a>';

      expect(sanitizeHTML(html, ['a'])).toEqual({
        __html: html,
      });
    });

    it('removes all HTML tags by default', () => {
      const html = 'foo<br>bar';

      expect(sanitizeHTML(html)).toEqual({
        __html: 'foobar',
      });
    });

    // This is a built-in feature of dompurify.
    it('removes `target` attribute on links', () => {
      const html = '<a href="http://example.org" target="_blank">link</a>';

      expect(sanitizeHTML(html, ['a'])).toEqual({
        __html: '<a href="http://example.org">link</a>',
      });
    });
  });

  describe('nl2br', () => {
    it('converts \n to <br/>', () => {
      expect(nl2br('\n')).toEqual('<br />');
    });

    it('converts \r to <br/>', () => {
      expect(nl2br('\r')).toEqual('<br />');
    });

    it('converts \r\n to <br/>', () => {
      expect(nl2br('\r\n')).toEqual('<br />');
    });

    it('converts multiple new lines to multiple breaks', () => {
      expect(nl2br('\n\n')).toEqual('<br /><br />');
    });

    it('converts multiple new lines (Windows) to multiple breaks', () => {
      expect(nl2br('\r\n\r\n')).toEqual('<br /><br />');
    });

    it('handles null text', () => {
      expect(nl2br(null)).toEqual('');
    });

    it('preserves line breaks between ul/li tags', () => {
      const htmlValue = '<ul>\n<li><strong></strong>\n</li>\n</ul>';

      expect(nl2br(htmlValue)).toEqual(
        '<ul>\n<li><strong></strong>\n</li>\n</ul>',
      );
    });

    it('preserves line breaks between ol/li tags', () => {
      const htmlValue = '<ol>\n<li><strong></strong>\n</li>\n</ol>';

      expect(nl2br(htmlValue)).toEqual(
        '<ol>\n<li><strong></strong>\n</li>\n</ol>',
      );
    });

    it('converts line breaks in tag content', () => {
      const htmlValue = '<strong>foo\nbar</strong>';

      expect(nl2br(htmlValue)).toEqual('<strong>foo<br />bar</strong>');
    });

    it('returns valid HTML', () => {
      const htmlValue = 'ul\nli<strong>foo\nbar</strong>';

      expect(nl2br(htmlValue)).toEqual(
        'ul<br />li<strong>foo<br />bar</strong>',
      );
    });

    it('converts line breaks between tags', () => {
      const htmlValue =
        '<strong>A title:</strong>\n<a href="something">A link</a>\nSome text';

      expect(nl2br(htmlValue)).toEqual(
        '<strong>A title:</strong><br /><a href="something">A link</a><br />Some text',
      );
    });
  });

  describe('formatFilesize', () => {
    it('returns a size formatted using the iec standard', () => {
      const size = 12345;
      expect(formatFilesize(size)).toEqual(filesize(size, { standard: 'iec' }));
    });
  });

  describe('getPathFromQueryString', () => {
    it('returns the `path` if it exists in the query string', () => {
      const path = 'some/path/to/file.js';
      const history = createFakeHistory({
        location: createFakeLocation({
          search: queryString.stringify({ path }),
        }),
      });

      expect(getPathFromQueryString(history)).toEqual(path);
    });

    it('returns `null` if there is no `path` in the query string', () => {
      const history = createFakeHistory({
        location: createFakeLocation({ search: '' }),
      });

      expect(getPathFromQueryString(history)).toEqual(null);
    });

    it('returns `null` if `path` is empty in the query string', () => {
      const history = createFakeHistory({
        location: createFakeLocation({
          search: queryString.stringify({ path: '' }),
        }),
      });

      expect(getPathFromQueryString(history)).toEqual(null);
    });
  });
});
