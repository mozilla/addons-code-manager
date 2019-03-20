import * as React from 'react';
import { shallow } from 'enzyme';

import configureStore from '../../configureStore';
import {
  actions as versionActions,
  getVersionFile,
  VersionFile,
} from '../../reducers/versions';
import { fakeVersion } from '../../test-helpers';
import styles from './styles.module.scss';
import { formatFilesize } from '../../utils';

import FileMetadata from '.';

describe(__filename, () => {
  const _getVersionFile = (props = {}) => {
    const store = configureStore();
    const version = fakeVersion;
    store.dispatch(versionActions.loadVersionInfo({ version }));
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
    expect(root.find(`.${styles.mimeType}`)).toHaveText(file.mimeType);
    expect(root.find(`.${styles.downloadURL}`).html()).toContain(
      `<a href="${file.downloadURL}">${file.filename}</a>`,
    );
  });

  it('renders a formatted filesize', () => {
    const size = 12345;
    const file = _getVersionFile({ size });
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.size}`)).toHaveText(formatFilesize(size));
  });
});
