import * as React from 'react';
import { shallow } from 'enzyme';

import {
  actions as versionActions,
  getVersionFile,
  VersionFile,
} from '../../reducers/versions';
import { fakeVersion, createStoreWithVersion } from '../../test-helpers';
import styles from './styles.module.scss';
import { formatFilesize } from '../../utils';
import { makeApiURL } from '../../api';

import FileMetadata from '.';

describe(__filename, () => {
  const _getVersionFile = (props = {}) => {
    const version = fakeVersion;
    const store = createStoreWithVersion({ makeCurrent: true });
    store.dispatch(
      versionActions.loadVersionFile({
        path: version.file.selected_file,
        version,
      }),
    );

    return {
      ...(getVersionFile(
        store.getState().versions,
        version.id,
        version.file.selected_file,
      ) as VersionFile),
      ...props,
    };
  };

  it('renders metadata for a file', () => {
    const file = _getVersionFile();
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.version}`)).toHaveText(file.version);
    expect(root.find(`.${styles.sha256}`)).toHaveText(file.sha256);

    const downloadLink = root.find(`.${styles.downloadURL}`).find('a');
    expect(downloadLink).toHaveLength(1);
    expect(downloadLink).toHaveText(file.filename);
    expect(downloadLink).toHaveProp(
      'href',
      // `downloadURL` can only be `null` when `file` is a directory.
      makeApiURL({ url: file.downloadURL as string }),
    );
  });

  it('renders a formatted filesize', () => {
    const size = 12345;
    const file = _getVersionFile({ size });
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.size}`)).toHaveText(formatFilesize(size));
  });
});
