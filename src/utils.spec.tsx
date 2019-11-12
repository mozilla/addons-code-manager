import filesize from 'filesize';
import queryString from 'query-string';

import { getCodeLineAnchor } from './components/CodeView/utils';
import {
  allowSlowPagesParam,
  createAdjustedQueryString,
  createCodeLineAnchorGetter,
  extractNumber,
  formatFilesize,
  getLanguageFromMimeType,
  getLocalizedString,
  getPathFromQueryString,
  makeReviewersURL,
  nl2br,
  sanitizeHTML,
  shouldAllowSlowPages,
} from './utils';
import {
  createFakeCompareInfo,
  createFakeHistory,
  createFakeLocation,
  fakeVersionWithDiff,
} from './test-helpers';

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

  describe('createAdjustedQueryString', () => {
    it('adds a param to an empty query string', () => {
      const location = createFakeLocation({ search: '' });

      const newQuery = { color: 'red' };
      const adjusted = createAdjustedQueryString(location, newQuery);

      expect(adjusted).urlWithTheseParams(newQuery);
    });

    it('adds a param to an existing query string', () => {
      const existing = { count: '1' };
      const newQuery = { color: 'red' };

      const location = createFakeLocation({
        search: queryString.stringify(existing),
      });

      const adjusted = createAdjustedQueryString(location, newQuery);

      expect(adjusted).urlWithTheseParams({
        ...existing,
        ...newQuery,
      });
    });

    it('replaces a param in an existing query string', () => {
      const location = createFakeLocation({
        search: queryString.stringify({ color: 'red' }),
      });

      const newColor = 'purple';
      const adjusted = createAdjustedQueryString(location, { color: newColor });

      expect(adjusted).urlWithTheseParams({ color: newColor });
    });

    it('handles booleans', () => {
      const location = createFakeLocation();

      const adjusted = createAdjustedQueryString(location, { awesome: true });

      expect(adjusted).urlWithTheseParams({ awesome: 'true' });
    });

    it('handles numbers', () => {
      const location = createFakeLocation();

      const amountOfAwesome = 100000;
      const adjusted = createAdjustedQueryString(location, { amountOfAwesome });

      expect(adjusted).urlWithTheseParams({
        amountOfAwesome: String(amountOfAwesome),
      });
    });

    it('handles undefined values', () => {
      const location = createFakeLocation();

      const adjusted = createAdjustedQueryString(location, {
        color: undefined,
      });

      // Undefined values should not be added to the query string.
      expect(adjusted).toEqual('?');
    });
  });

  describe('createCodeLineAnchorGetter', () => {
    it('returns getCodeLineAnchor if compareInfo is null', () => {
      expect(createCodeLineAnchorGetter({ compareInfo: null })).toEqual(
        getCodeLineAnchor,
      );
    });

    it('returns getCodeLineAnchor if compareInfo is undefined', () => {
      expect(createCodeLineAnchorGetter({ compareInfo: undefined })).toEqual(
        getCodeLineAnchor,
      );
    });

    it('returns getCodeLineAnchor if compareInfo.diff is falsey', () => {
      expect(
        createCodeLineAnchorGetter({
          compareInfo: createFakeCompareInfo({
            version: {
              ...fakeVersionWithDiff,
              file: {
                ...fakeVersionWithDiff.file,
                diff: null,
              },
            },
          }),
        }),
      ).toEqual(getCodeLineAnchor);
    });

    it('returns getCodeLineAnchor from ForwardComparisonMap if compareInfo.diff exists', () => {
      const compareInfo = createFakeCompareInfo();
      if (!compareInfo.diff) {
        throw new Error('compareInfo.diff was unexpectedly empty');
      }

      const getterFromFactory = createCodeLineAnchorGetter({ compareInfo });

      // Generate a getter without compareInfo to verify that it is different.
      const getterFromFactoryWithoutCompareInfo = createCodeLineAnchorGetter({
        compareInfo: null,
      });

      expect(getterFromFactory).not.toEqual(
        getterFromFactoryWithoutCompareInfo,
      );
    });
  });

  describe('makeReviewersURL', () => {
    it('returns a relative url if reviewersHost is falsey', () => {
      const host = 'https://example.org';
      const path = '/foo/';
      const url = `${host}${path}`;

      expect(makeReviewersURL({ reviewersHost: null, url })).toEqual(path);
    });

    it('returns a relative url when useInsecureProxy is true', () => {
      const host = 'https://example.org';
      const path = '/foo/';
      const url = `${host}${path}`;

      expect(makeReviewersURL({ url, useInsecureProxy: true })).toEqual(path);
    });

    it('replaces the host with reviewersHost when useInsecureProxy is false', () => {
      const host = 'https://example.org';
      const reviewersHost = 'https://example.com';
      const path = '/foo/';
      const url = `${host}${path}`;
      const expectedUrl = `${reviewersHost}${path}`;

      expect(
        makeReviewersURL({
          reviewersHost,
          url,
          useInsecureProxy: false,
        }),
      ).toEqual(expectedUrl);
    });

    it('maintains query parameters', () => {
      const host = 'https://example.org';
      const path = '/foo/?abc=def';
      const url = `${host}${path}`;

      expect(makeReviewersURL({ url, useInsecureProxy: true })).toEqual(path);
    });
  });
});

describe('extractNumber', () => {
  it('returns a number from a string', () => {
    expect(extractNumber('D12')).toEqual(12);
  });
  it('returns the first number from a string', () => {
    expect(extractNumber('D12A13')).toEqual(12);
  });
  it('returns null if there are no numbers', () => {
    expect(extractNumber('ABC')).toEqual(null);
  });
});

describe('shouldAllowSlowPages', () => {
  it('returns false without any query param', () => {
    expect(
      shouldAllowSlowPages({ location: createFakeLocation({ search: '' }) }),
    ).toEqual(false);
  });

  it('returns true with a true query param', () => {
    expect(
      shouldAllowSlowPages({
        location: createFakeLocation({
          search: queryString.stringify({ [allowSlowPagesParam]: true }),
        }),
      }),
    ).toEqual(true);
  });

  it('returns false with a false query param', () => {
    expect(
      shouldAllowSlowPages({
        location: createFakeLocation({
          search: queryString.stringify({ [allowSlowPagesParam]: false }),
        }),
      }),
    ).toEqual(false);
  });

  it('can use a defaultToTrue prop', () => {
    expect(
      shouldAllowSlowPages({
        defaultToTrue: true,
        location: createFakeLocation({
          search: '',
        }),
      }),
    ).toEqual(true);
  });
});
