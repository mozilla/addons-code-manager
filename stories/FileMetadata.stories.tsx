import React from 'react';
import { storiesOf } from '@storybook/react';

import FileMetadata from '../src/components/FileMetadata';
import configureStore from '../src/configureStore';
import {
  actions as versionActions,
  getVersionFile,
  VersionFile,
} from '../src/reducers/versions';
import { fakeVersion } from '../src/test-helpers';

storiesOf('FileMetadata', module).add('default', () => {
  const version = fakeVersion;
  const store = configureStore();
  store.dispatch(versionActions.loadVersionInfo({ version }));

  const versionFile = getVersionFile(
    store.getState().versions,
    version.id,
    version.file.selected_file,
  ) as VersionFile;

  return <FileMetadata file={versionFile} />;
});
