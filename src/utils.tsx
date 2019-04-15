import filesize from 'filesize';
import purify from 'dompurify';
import { History } from 'history';
import queryString from 'query-string';

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
  const { path } = queryString.parse(history.location.search);

  return typeof path === 'string' && path.length ? path : null;
};
