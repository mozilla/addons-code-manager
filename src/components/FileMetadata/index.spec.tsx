import { shallow } from 'enzyme';
import * as React from 'react';

import configureStore from '../../configureStore';
import {
  actions as versionActions,
  getVersionFile as _getVersionFile,
  VersionFile,
} from '../../reducers/versions';
import { fakeVersion } from '../../test-helpers';
import styles from './styles.module.scss';
import { formatFilesize } from '../../utils';

import FileMetadata from '.';

describe(__filename, () => {
  const getVersionFile = () => {
    const store = configureStore();
    const version = fakeVersion;
    store.dispatch(versionActions.loadVersionInfo({ version }));

    return _getVersionFile(
      store.getState().versions,
      version.id,
      version.file.selected_file,
    ) as VersionFile;
  };

  it('renders metadata for a file', () => {
    const file = getVersionFile();
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.version}`)).toHaveText(file.version);
    expect(root.find(`.${styles.sha256}`)).toHaveText(file.sha256);
    expect(root.find(`.${styles.mimeType}`)).toHaveText(file.mimeType);
  });

  it('renders a formatted filesize', () => {
    const file = { ...getVersionFile(), size: 12345 };
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.size}`)).toHaveText(formatFilesize(file.size));
  });
});
