import purify from 'dompurify';
import log from 'loglevel';
import * as React from 'react';

import styles from './styles.module.scss';

export type PublicProps = {
  _btoa?: typeof btoa;
  _log?: typeof log;
  _sanitize?: typeof purify.sanitize;
  mimeType: string;
  content: string;
};

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
  if (!mimeTypeCased.startsWith('image')) {
    throw new Error(`Unexpected mimeType: "${mimeType}"`);
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
  return imageData ? (
    <div className={styles.ImageView}>
      <img alt="" src={`data:${mimeType};base64,${imageData}`} />
    </div>
  ) : null;
};

export default ImageViewBase;
