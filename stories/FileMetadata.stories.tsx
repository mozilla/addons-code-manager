import React from 'react';
import { storiesOf } from '@storybook/react';

import FileMetadata from '../src/components/FileMetadata';
import configureStore from '../src/configureStore';
import {
  actions as versionActions,
  getVersionFile,
  VersionFile,
} from '../src/reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../src/test-helpers';

const loadVersionFile = (version = fakeVersion) => {
  const store = configureStore();
  store.dispatch(versionActions.loadVersionInfo({ version }));
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
  ) as VersionFile;
  return versionFile;
};

storiesOf('FileMetadata', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'with lists of versions loaded',
          sectionFn: () => {
            const versionFile = loadVersionFile();

            return <FileMetadata file={versionFile} />;
          },
        },
        {
          title: 'with a constrained width',
          sectionFn: () => {
            const path = 'very-long-file-name.json';
            const version = {
              ...fakeVersion,
              file: {
                ...fakeVersion.file,
                entries: {
                  [path]: {
                    ...fakeVersionEntry,
                    filename: path,
                    path,
                    sha256:
                      '521fce5b388cd8f06d7fbf35bf4988b16a3a465fd3f1af92727eeaf5b6ab8ca6',
                  },
                },
                selected_file: path,
              },
            };

            const versionFile = loadVersionFile(version);

            return (
              <div style={{ width: '200px' }}>
                <FileMetadata file={versionFile} />
              </div>
            );
          },
        },
      ],
    },
  ],
});
