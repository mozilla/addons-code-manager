import * as React from 'react';

import {
  VersionFileWithContent,
  VersionFileWithDiff,
} from '../../reducers/versions';
import styles from './styles.module.scss';
import { formatFilesize, gettext } from '../../utils';
import { makeApiURL } from '../../api';

type PublicProps = {
  file: VersionFileWithContent | VersionFileWithDiff;
  versionString: string;
};

const FileMetadataBase = ({ file, versionString }: PublicProps) => {
  return (
    <div className={styles.FileMetadata}>
      <dl>
        <dt>{gettext('Version')}</dt>
        <dd className={styles.version}>{versionString}</dd>
        <dt>{gettext('Size')}</dt>
        <dd className={styles.size}>{formatFilesize(file.size)}</dd>
        <dt>{gettext('SHA256 hash')}</dt>
        <dd className={styles.sha256}>
          <code>{file.sha256}</code>
        </dd>
        <dt>{gettext('MIME type')}</dt>
        <dd className={styles.mimeType}>{file.mimeType}</dd>
        {file.downloadURL && (
          <>
            <dt>{gettext('Download link')}</dt>
            <dd className={styles.downloadURL}>
              <a href={makeApiURL({ url: file.downloadURL })}>
                {file.filename}
              </a>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
};

export default FileMetadataBase;
