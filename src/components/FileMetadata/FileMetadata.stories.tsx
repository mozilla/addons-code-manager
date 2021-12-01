import React from 'react';
import { Meta } from '@storybook/react';

import {
  actions as versionActions,
  getVersionFile,
  VersionFileWithContent,
} from '../../reducers/versions';
import {
  createStoreWithVersion,
  fakeVersionWithContent,
} from '../../test-helpers';

import FileMetadata from '.';

const loadVersionFile = (version = fakeVersionWithContent) => {
  const store = createStoreWithVersion({ version });
  store.dispatch(
    versionActions.loadVersionFile({
      path: version.file.selected_file,
      version,
    }),
  );

  const versionFile = getVersionFile(
    store.getState().versions,
    version.id,
    version.file.selected_file,
  ) as VersionFileWithContent;
  return versionFile;
};

export default {
  title: 'Components/FileMetadata',
  component: FileMetadata,
} as Meta;

export const WithListsOfVersionsLoaded = () => {
  const versionFile = loadVersionFile();

  return <FileMetadata file={versionFile} />;
};

export const WithAConstrainedWidth = () => {
  const path = 'very-long-file-name.json';
  const version = {
    ...fakeVersionWithContent,
    file: {
      ...fakeVersionWithContent.file,
      filename: path,
      sha256:
        '521fce5b388cd8f06d7fbf35bf4988b16a3a465fd3f1af92727eeaf5b6ab8ca6',
      selected_file: path,
    },
  };

  const versionFile = loadVersionFile(version);

  return (
    <div style={{ width: '200px' }}>
      <FileMetadata file={versionFile} />
    </div>
  );
};
