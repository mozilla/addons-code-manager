import purify from 'dompurify';
import log from 'loglevel';
import * as React from 'react';

import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _btoa?: typeof btoa;
  _log?: typeof log;
  _sanitize?: typeof purify.sanitize;
  mimeType: string;
  content: string;
};

// From https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Firefox.
const supportedImageMimeTypes = [
  'image/jpeg',
  'image/gif',
  'image/png',
  'image/svg+xml',
  'image/bmp',
  'image/vnd.microsoft.icon',
  // webp isn't listed in the MDN article, but is documented elsewhere.
  // e.g., https://caniuse.com/#search=webp
  'image/webp',
];

type ConvertImageDataParams = {
  _btoa?: typeof btoa;
  _log?: typeof log;
  _sanitize?: typeof purify.sanitize;
  content: string;
  mimeType: string;
};

const convertImageData = ({
  _btoa = btoa,
  _log = log,
  _sanitize = purify.sanitize,
  content,
  mimeType,
}: ConvertImageDataParams): string | null => {
  const mimeTypeCased = mimeType.toLowerCase();
  if (!supportedImageMimeTypes.includes(mimeTypeCased)) {
    _log.error('Unrecognized mimeType :', mimeType);
    return null;
  }

  try {
    return _btoa(
      // Run sanitize on svg files.
      mimeTypeCased === 'image/svg+xml' ? _sanitize(content) : content,
    );
  } catch (error) {
    _log.error('Error converting image data to ascii:', error);
    return null;
  }
};

const ImageViewBase = ({
  _btoa,
  _log,
  _sanitize,
  content,
  mimeType,
}: PublicProps) => {
  const imageData = convertImageData({
    _btoa,
    _log,
    _sanitize,
    content,
    mimeType,
  });
  return (
    <div className={styles.ImageView}>
      {imageData ? (
        <img alt="" src={`data:${mimeType};base64,${imageData}`} />
      ) : (
        <p>{gettext('Unrecognized image format')}</p>
      )}
    </div>
  );
};

export default ImageViewBase;
