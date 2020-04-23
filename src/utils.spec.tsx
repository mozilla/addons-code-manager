/* eslint @typescript-eslint/camelcase: 0 */
import filesize from 'filesize';
import queryString from 'query-string';
import { parseDiff } from 'react-diff-view';

import diffWithDeletions from './components/DiffView/fixtures/diffWithDeletions';
import {
  ExternalChange,
  ExternalHunk,
  createInternalDiff,
} from './reducers/versions';
import { getCodeLineAnchor } from './components/CodeView/utils';
import {
  ForwardComparisonMap,
  allowSlowPagesParam,
  codeCanBeHighlighted,
  codeShouldBeTrimmed,
  createAdjustedQueryString,
  createCodeLineAnchorGetter,
  extractNumber,
  formatFilesize,
  getAllHunkChanges,
  getLanguageFromMimeType,
  getLocalizedString,
  getPathFromQueryString,
  makeReviewersURL,
  nl2br,
  sanitizeHTML,
  sendPerfTiming,
  shouldAllowSlowPages,
} from './utils';
import {
  createFakeCompareInfo,
  createFakeHistory,
  createFakeLocation,
  fakeChange,
  fakeExternalDiff,
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

    it('returns an empty string when localized string map does not contain any languages', () => {
      const lang = 'fr';
      const localizedStringMap = {};

      expect(getLocalizedString(localizedStringMap, lang)).toEqual('');
    });

    it('defaults to REACT_APP_DEFAULT_API_LANG', () => {
      const lang = process.env.REACT_APP_DEFAULT_API_LANG as string;
      const value = 'some content';
      const localizedStringMap = {
        [`not-${lang}`]: 'other content',
        [lang]: value,
      };

      expect(getLocalizedString(localizedStringMap)).toEqual(value);
    });

    it('returns a localized string for a the first language if the requested language is missing', () => {
      const value = 'first language content';
      const localizedStringMap = {
        en: value,
        fr: 'French content',
      };

      expect(getLocalizedString(localizedStringMap, 'de')).toEqual(value);
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

  it('can use a allowByDefault prop', () => {
    expect(
      shouldAllowSlowPages({
        allowByDefault: true,
        location: createFakeLocation({
          search: '',
        }),
      }),
    ).toEqual(true);
  });
});

describe('codeCanBeHighlighted', () => {
  it('returns true for a diff with short line lengths', () => {
    expect(
      codeCanBeHighlighted({
        code: Array(3).fill({
          ...fakeChange,
          content: '// example of short line',
        }),
        wideLineLength: 80,
      }),
    ).toEqual(true);
  });

  it('returns false for a diff with wide line lengths', () => {
    const wideLine = '// example of a really wide line';
    expect(
      codeCanBeHighlighted({
        code: [
          { ...fakeChange, content: '// example of short line' },
          { ...fakeChange, content: wideLine },
        ],
        wideLineLength: wideLine.length - 1,
      }),
    ).toEqual(false);
  });

  it('returns true for a diff with a low line count', () => {
    const highLineCount = 8;
    expect(
      codeCanBeHighlighted({
        code: Array(highLineCount - 1).fill({
          content: '// example content',
        }),
        highLineCount,
      }),
    ).toEqual(true);
  });

  it('returns false for a diff with a high line count', () => {
    const highLineCount = 8;
    expect(
      codeCanBeHighlighted({
        code: Array(highLineCount + 1).fill({
          content: '// example content',
        }),
        highLineCount,
      }),
    ).toEqual(false);
  });
});

describe('getAllHunkChanges', () => {
  it('returns a flattened list of all changes', () => {
    const diff = parseDiff(diffWithDeletions)[0];
    const changes = getAllHunkChanges(diff.hunks);

    // Check a line from the first hunk:
    expect(changes.filter((c) => c.lineNumber === 2)[0].content).toEqual(
      "import { Diff, DiffProps, parseDiff } from 'react-diff-view';",
    );
    // Check a line from the second hunk:
    expect(changes.filter((c) => c.lineNumber === 24)[0].content).toEqual(
      '    console.log({ hunk });',
    );
    // Check a line from the third hunk:
    expect(changes.filter((c) => c.lineNumber === 50)[0].content).toEqual(
      '          </Diff>',
    );
  });
});

describe('ForwardComparisonMap', () => {
  const createFakeExternalChange = (
    change: Partial<ExternalChange>,
  ): ExternalChange => {
    return {
      ...fakeExternalDiff.hunks[0].changes[0],
      ...change,
    };
  };

  const newForwardComparisonMap = ({
    changes = fakeExternalDiff.hunks[0].changes,
    hunks = [
      {
        ...fakeExternalDiff.hunks[0],
        changes,
      },
    ],
  }: {
    changes?: ExternalChange[];
    hunks?: ExternalHunk[];
  } = {}) => {
    const fakeVersion = {
      ...fakeVersionWithDiff,
      file: {
        ...fakeVersionWithDiff.file,
        diff: {
          ...fakeExternalDiff,
          hunks,
        },
      },
    };

    const diffInfo = createInternalDiff({
      baseVersionId: 1,
      headVersionId: 2,
      version: fakeVersion,
    });
    if (!diffInfo) {
      throw new Error('diffInfo was unexpectedly empty');
    }

    return new ForwardComparisonMap(diffInfo);
  };

  it('maps normal changes', () => {
    const change = createFakeExternalChange({
      old_line_number: 1,
      new_line_number: 1,
      type: 'normal',
    });

    expect(
      newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(1),
    ).toEqual('#N1');
  });

  it('maps delete changes', () => {
    const change = createFakeExternalChange({
      old_line_number: 2,
      new_line_number: -1,
      type: 'delete',
    });

    expect(
      newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(2),
    ).toEqual('#D2');
  });

  it('maps insert changes', () => {
    const change = createFakeExternalChange({
      old_line_number: -1,
      new_line_number: 2,
      type: 'insert',
    });

    expect(
      newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(2),
    ).toEqual('#I2');
  });

  it('merges changes', () => {
    const changes = [
      createFakeExternalChange({
        old_line_number: 1,
        new_line_number: 1,
        type: 'normal',
      }),
      createFakeExternalChange({
        old_line_number: -1,
        new_line_number: 2,
        type: 'insert',
      }),
    ];

    const map = newForwardComparisonMap({ changes });
    expect(map.getCodeLineAnchor(1)).toEqual('#N1');
    expect(map.getCodeLineAnchor(2)).toEqual('#I2');
  });

  it('merges changes for all hunks', () => {
    const hunks = [
      {
        ...fakeExternalDiff.hunks[0],
        changes: [
          createFakeExternalChange({
            old_line_number: 1,
            new_line_number: 1,
            type: 'normal',
          }),
        ],
      },
      {
        ...fakeExternalDiff.hunks[0],
        changes: [
          createFakeExternalChange({
            old_line_number: -1,
            new_line_number: 2,
            type: 'insert',
          }),
        ],
      },
    ];

    const map = newForwardComparisonMap({ hunks });
    expect(map.getCodeLineAnchor(1)).toEqual('#N1');
    expect(map.getCodeLineAnchor(2)).toEqual('#I2');
  });

  it('favors inserts', () => {
    const changes = [
      createFakeExternalChange({
        old_line_number: 2,
        new_line_number: -1,
        type: 'delete',
      }),
      createFakeExternalChange({
        old_line_number: -1,
        new_line_number: 2,
        type: 'insert',
      }),
      createFakeExternalChange({
        old_line_number: 2,
        new_line_number: 2,
        type: 'normal',
      }),
    ];

    expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(2)).toEqual(
      '#I2',
    );
  });

  it('favors normal lines over deletes', () => {
    const changes = [
      createFakeExternalChange({
        old_line_number: 1,
        new_line_number: 1,
        type: 'normal',
      }),
      createFakeExternalChange({
        old_line_number: 1,
        new_line_number: -1,
        type: 'delete',
      }),
    ];

    expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(1)).toEqual(
      '#N1',
    );
  });

  it('handles unknown lines', () => {
    const changes = [
      createFakeExternalChange({
        old_line_number: 1,
        new_line_number: 1,
        type: 'normal',
      }),
    ];

    expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(2)).toEqual(
      '',
    );
  });

  it('lets you create a bound getCodeLineAnchor callback', () => {
    const line = 1;
    const change = createFakeExternalChange({
      old_line_number: line,
      new_line_number: line,
      type: 'normal',
    });

    const map = newForwardComparisonMap({ changes: [change] });
    const codeLineAnchorGetter = map.createCodeLineAnchorGetter();

    expect(codeLineAnchorGetter(line)).toEqual(
      map.getCodeLineAnchor.bind(map)(line),
    );
  });
});

describe('codeShouldBeTrimmed', () => {
  const _codeShouldBeTrimmed = ({
    codeCharLength = 0,
    codeLineLength = 0,
    isMinified = false,
    trimmedCharCount = 1,
    slowLoadingLineCount = 1,
  }) => {
    return codeShouldBeTrimmed({
      codeCharLength,
      codeLineLength,
      isMinified,
      trimmedCharCount,
      slowLoadingLineCount,
    });
  };

  it('returns true if the code line length >= slowLoadingLineCount', () => {
    expect(
      _codeShouldBeTrimmed({
        codeLineLength: 2,
        slowLoadingLineCount: 2,
      }),
    ).toEqual(true);
    expect(
      _codeShouldBeTrimmed({
        codeLineLength: 2,
        slowLoadingLineCount: 1,
      }),
    ).toEqual(true);
  });

  it('returns false if the code line length < slowLoadingLineCount', () => {
    expect(
      _codeShouldBeTrimmed({
        codeLineLength: 1,
        slowLoadingLineCount: 2,
      }),
    ).toEqual(false);
  });

  it('returns true if isMinified is true and the code length > trimmedCharCount', () => {
    expect(
      _codeShouldBeTrimmed({
        codeCharLength: 2,
        isMinified: true,
        trimmedCharCount: 1,
      }),
    ).toEqual(true);
  });

  it('returns false if isMinified is true but the code length <= trimmedCharCount', () => {
    expect(
      _codeShouldBeTrimmed({
        codeCharLength: 1,
        isMinified: true,
        trimmedCharCount: 2,
      }),
    ).toEqual(false);
    expect(
      _codeShouldBeTrimmed({
        codeCharLength: 2,
        isMinified: true,
        trimmedCharCount: 2,
      }),
    ).toEqual(false);
  });
});

describe('sendPerfTiming', () => {
  it('sends a renderPerf timing via tracking', () => {
    const _tracking = { timing: jest.fn() };
    const actualDuration = 19;
    const id = 'some-id';
    const href = 'https://example.org/en-US/browse/4913/versions/1527/';
    const _window = {
      ...window,
      location: {
        ...window.location,
        href,
      },
    } as typeof window;

    sendPerfTiming({ _tracking, _window, actualDuration, id });
    expect(_tracking.timing).toHaveBeenCalledWith({
      category: 'renderPerf',
      label: href,
      value: actualDuration,
      variable: id,
    });
  });
});
