import filesize from 'filesize';
import purify from 'dompurify';

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

export const splitArrayIntoChunks = <ItemType extends {}>(
  array: ItemType[],
  chunkSize: number,
): ItemType[][] => {
  if (chunkSize <= 0) {
    // This would create an infinite loop.
    throw new Error(`chunkSize must be greater than 0; it was ${chunkSize}`);
  }
  if (chunkSize !== Math.round(chunkSize)) {
    throw new Error(`chunkSize must be an integer; it was ${chunkSize}`);
  }
  const chunked = [];

  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, index + chunkSize));
    index += chunkSize;
  }

  return chunked;
};
