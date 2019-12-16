import urlUtils from 'url';

import filesize from 'filesize';
import purify from 'dompurify';
import { History, Location } from 'history';
import queryString from 'query-string';
import { ChangeInfo } from 'react-diff-view';

import { getCodeLineAnchor } from './components/CodeView/utils';
import { ForwardComparisonMap } from './pages/Compare/utils';
import { CompareInfo } from './reducers/versions';

// Querystring params used by the app.
export const messageUidQueryParam = 'messageUid';
export const pathQueryParam = 'path';
export const allowSlowPagesParam = 'allowSlowPages';

// Lengths for disabling highlighting.
// This is the total line count that we consider too long.
export const HIGHLIGHT_HIGH_LINE_COUNT = 3000;
// This is a single line width that would make code too wide.
export const HIGHLIGHT_WIDE_LINE_LENGTH = 500;

export type LocalizedStringMap = {
  [lang: string]: string;
};

export const gettext = (text: string) => text;

export const getLocalizedString = (
  localizedStringMap: LocalizedStringMap,
  lang = process.env.REACT_APP_DEFAULT_API_LANG as string,
) => {
  const stringForCurrentLang = localizedStringMap[lang];
  const langs = Object.keys(localizedStringMap);

  return (
    stringForCurrentLang || (langs.length && localizedStringMap[langs[0]]) || ''
  );
};

export const getLanguageFromMimeType = (mimeType: string) => {
  switch (mimeType) {
    case 'application/javascript':
    case 'text/javascript':
      return 'js';
    case 'application/json':
      return 'json';
    case 'application/xml':
      return 'xml';
    case 'text/css':
      return 'css';
    case 'text/html':
      return 'html';
    default:
      return 'text';
  }
};

export const sanitizeHTML = (
  text: string,
  allowTags: string[] = [],
  _purify = purify,
) => {
  return {
    __html: _purify.sanitize(text, { ALLOWED_TAGS: allowTags }),
  };
};

export const nl2br = (text: string | null) => {
  return (text || '').replace(/(\r\n|\r|\n)(?!<\/?(li|ul|ol)>)/g, '<br />');
};

export const formatFilesize = (size: number): string => {
  return filesize(size, { standard: 'iec' });
};

export const getPathFromQueryString = (history: History) => {
  const path = queryString.parse(history.location.search)[pathQueryParam];

  return typeof path === 'string' && path.length ? path : null;
};

/*
 * This adds a param to an existing location and return a new query string.
 */
export const createAdjustedQueryString = (
  location: Location,
  newParams: { [key: string]: string | number | boolean | undefined },
) => {
  const query = queryString.parse(location.search);
  return `?${queryString.stringify({ ...query, ...newParams })}`;
};

export const createCodeLineAnchorGetter = ({
  compareInfo,
}: {
  compareInfo: CompareInfo | null | undefined;
}) => {
  if (compareInfo && compareInfo.diff) {
    const map = new ForwardComparisonMap(compareInfo.diff);
    return map.createCodeLineAnchorGetter();
  }
  return getCodeLineAnchor;
};

export const extractNumber = (text: string): number | null => {
  const matches = text.match(/\d+/);
  if (Array.isArray(matches)) {
    return parseInt(matches[0], 10);
  }
  return null;
};

type MakReviewersURLParams = {
  apiHost?: string | null;
  reviewersHost?: string | null;
  url: string;
  useInsecureProxy?: boolean;
};

export const makeReviewersURL = ({
  reviewersHost = process.env.REACT_APP_REVIEWERS_HOST,
  url,
  useInsecureProxy = process.env.REACT_APP_USE_INSECURE_PROXY === 'true',
}: MakReviewersURLParams) => {
  const { path } = urlUtils.parse(url);
  if (reviewersHost && !useInsecureProxy) {
    return `${reviewersHost}${path}`;
  }

  return path;
};

export const shouldAllowSlowPages = ({
  allowByDefault = false,
  location,
}: {
  allowByDefault?: boolean;
  location: Location;
}) => {
  const shouldAllowQueryParam = queryString.parse(location.search)[
    allowSlowPagesParam
  ];
  return shouldAllowQueryParam !== undefined
    ? shouldAllowQueryParam === 'true'
    : allowByDefault;
};

export const codeCanBeHighlighted = ({
  code,
  // This is the total line count that we consider too long.
  highLineCount = HIGHLIGHT_WIDE_LINE_LENGTH,
  // This is a single line width that would make code too wide.
  wideLineLength = HIGHLIGHT_WIDE_LINE_LENGTH,
}: {
  code: string[] | ChangeInfo[];
  wideLineLength?: number;
  highLineCount?: number;
}) => {
  for (let index = 0; index < code.length; index++) {
    const codeLineOrChange = code[index];
    const line =
      typeof codeLineOrChange === 'string'
        ? codeLineOrChange
        : codeLineOrChange.content;

    if (line.length > wideLineLength) {
      return false;
    }
    if (index >= highLineCount) {
      return false;
    }
  }

  return true;
};
