import * as React from 'react';

import { VersionFile } from '../../reducers/versions';
import styles from './styles.module.scss';
import { gettext } from '../../utils';

type PublicProps = {
  file: VersionFile;
};

const FileMetadataBase = ({ file }: PublicProps) => {
  return (
    <div className={styles.FileMetadata}>
      <dl>
        <dt>{gettext('Version')}</dt>
        <dd className={styles.version}>{file.version}</dd>
        <dt>{gettext('Size')}</dt>
        <dd className={styles.size}>{file.size}</dd>
        <dt>{gettext('SHA256 hash')}</dt>
        <dd className={styles.sha256}>{file.sha256}</dd>
        <dt>{gettext('Mimetype')}</dt>
        <dd className={styles.mimeType}>{file.mimeType}</dd>
      </dl>
    </div>
  );
};

export default FileMetadataBase;
