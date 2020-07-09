import urlUtils from 'url';

import filesize from 'filesize';
import purify from 'dompurify';
import { History, Location } from 'history';
import queryString from 'query-string';
import log from 'loglevel';
import { Hunks, ChangeInfo, DiffInfo, getChangeKey } from 'react-diff-view';

import {
  VersionFileWithContent,
  VersionFileWithDiff,
  changeTypes,
  isFileWithDiff,
} from './reducers/versions';
import { getCodeLineAnchor } from './components/CodeView/utils';
import tracking from './tracking';

// This is how many lines of code it takes to slow down the UI.
export const SLOW_LOADING_LINE_COUNT = 5000;
// This is how many characters we will include in trimmed content.
export const TRIMMED_CHAR_COUNT = 300;
export const contentAddedByTrimmer = '/* truncated by code-manager */';

// Querystring params used by the app.
export const messageUidQueryParam = 'messageUid';
export const pathQueryParam = 'path';
export const allowSlowPagesParam = 'allowSlowPages';

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
  // This is a single line width that would make code too wide.
  wideLineLength = 500,
  // This is the total line count that we consider too long.
  highLineCount = 3000,
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

export const getAllHunkChanges = (hunks: Hunks): ChangeInfo[] => {
  return hunks.reduce(
    (result: ChangeInfo[], { changes }) => [...result, ...changes],
    [],
  );
};

export const flattenDiffChanges = (diff: DiffInfo): string => {
  return getAllHunkChanges(diff.hunks)
    .map((change) => change.content)
    .join('\n');
};

type ForwardChangeMap = {
  [line: string]: ChangeInfo[];
};

const appendChangesInPlace = (
  changeMap: ForwardChangeMap,
  line: string,
  change: ChangeInfo,
) => {
  // This destructively appends changes to the line's ChangeInfo array
  // (when it exists).
  // eslint-disable-next-line no-param-reassign
  changeMap[line] = changeMap[line] || [];
  changeMap[line].push(change);
};

// This is a map of an old vs. new file comparison, giving preference to the
// "forward" file, i.e. the newer file.
export class ForwardComparisonMap {
  private changeMap: ForwardChangeMap;

  constructor(diff: DiffInfo) {
    this.changeMap = {};
    for (const change of getAllHunkChanges(diff.hunks)) {
      appendChangesInPlace(
        this.changeMap,
        String(change.oldLineNumber),
        change,
      );
      appendChangesInPlace(
        this.changeMap,
        String(change.newLineNumber),
        change,
      );
    }

    const relevantTypes = [
      changeTypes.insert,
      changeTypes.normal,
      changeTypes.delete,
    ];

    // Sort changes per line, ordered by relevantTypes.
    Object.keys(this.changeMap).forEach((line) => {
      this.changeMap[line].sort((firstChange, secondChange) => {
        if (firstChange.type === secondChange.type) {
          return 0;
        }

        for (const type of relevantTypes) {
          if (firstChange.type === type) {
            return -1;
          }
          if (secondChange.type === type) {
            return 1;
          }
        }

        // This isn't possible but it needs to return a value to satisfy the
        // sort() interface
        /* istanbul ignore next */
        return 0;
      });
    });
  }

  createCodeLineAnchorGetter() {
    return this.getCodeLineAnchor.bind(this);
  }

  getCodeLineAnchor(line: number) {
    const lineChanges = this.changeMap[line];
    if (!lineChanges || lineChanges.length === 0) {
      log.warn(`No changes were mapped for line ${line}`);
      return '';
    }

    return `#${getChangeKey(lineChanges[0])}`;
  }
}

export const createCodeLineAnchorGetter = (
  file: VersionFileWithContent | VersionFileWithDiff | null | undefined,
) => {
  if (file && isFileWithDiff(file) && file.diff) {
    const map = new ForwardComparisonMap(file.diff);
    return map.createCodeLineAnchorGetter();
  }
  return getCodeLineAnchor;
};

export const codeShouldBeTrimmed = ({
  codeCharLength,
  codeLineLength,
  isMinified,
  trimmedCharCount,
  slowLoadingLineCount,
}: {
  codeCharLength: number;
  codeLineLength: number;
  isMinified: boolean;
  trimmedCharCount: number;
  slowLoadingLineCount: number;
}) => {
  return (
    codeLineLength >= slowLoadingLineCount ||
    (isMinified && codeCharLength > trimmedCharCount)
  );
};

export const sendPerfTiming = ({
  _tracking = tracking,
  _window = window,
  actualDuration,
  id,
}: {
  _tracking?: typeof tracking;
  _window?: typeof window;
  actualDuration: number;
  id: string;
}) => {
  _tracking.timing({
    category: 'renderPerf',
    label: _window.location.href,
    value: actualDuration,
    variable: id,
  });
};
