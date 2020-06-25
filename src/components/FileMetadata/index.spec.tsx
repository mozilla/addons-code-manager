import * as React from 'react';
import { shallow } from 'enzyme';

import {
  actions as versionActions,
  getVersionFile,
  VersionFileWithContent,
} from '../../reducers/versions';
import {
  fakeVersionWithContent,
  createStoreWithVersion,
} from '../../test-helpers';
import styles from './styles.module.scss';
import { formatFilesize } from '../../utils';
import { makeApiURL } from '../../api';

import FileMetadata from '.';

describe(__filename, () => {
  const _getVersionFile = (props = {}) => {
    const version = fakeVersionWithContent;
    const store = createStoreWithVersion({ version });
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
      ) as VersionFileWithContent),
      ...props,
    };
  };

  it('renders metadata for a file', () => {
    const file = _getVersionFile();
    const versionString = '1.2';
    const root = shallow(
      <FileMetadata file={file} versionString={versionString} />,
    );

    expect(root.find(`.${styles.version}`)).toHaveText(versionString);
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
    const root = shallow(<FileMetadata file={file} versionString="1.2" />);

    expect(root.find(`.${styles.size}`)).toHaveText(formatFilesize(size));
  });
});
