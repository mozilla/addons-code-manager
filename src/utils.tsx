import urlUtils from 'url';

import filesize from 'filesize';
import purify from 'dompurify';
import { History } from 'history';
import queryString from 'query-string';

import { getCodeLineAnchor } from './components/CodeView/utils';
import { ForwardComparisonMap } from './pages/Compare/utils';
import { CompareInfo } from './reducers/versions';

// Querystring params used by the app.
export const messageUidQueryParam = 'messageUid';
export const pathQueryParam = 'path';

export type LocalizedStringMap = {
  [lang: string]: string;
};

export const gettext = (text: string) => text;

export const getLocalizedString = (
  localizedStringMap: LocalizedStringMap,
  lang = process.env.REACT_APP_DEFAULT_API_LANG as string,
) => {
  return localizedStringMap[lang];
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

export const createCodeLineAnchorGetter = ({
  compareInfo,
}: {
  compareInfo: CompareInfo | null | void;
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
