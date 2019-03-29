/* eslint @typescript-eslint/camelcase: 0 */
import React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import FileTree, {
  PublicProps as FileTreeProps,
} from '../src/components/FileTree';
import {
  Version,
  VersionEntryType,
  getVersionInfo,
  actions as versionActions,
} from '../src/reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const version = {
  ...fakeVersion,
  file: {
    ...fakeVersion.file,
    entries: {
      'manifest.json': {
        ...fakeVersionEntry,
        filename: 'manifest.json',
        path: 'manifest.json',
      },
      'background-scripts': {
        ...fakeVersionEntry,
        filename: 'background-scripts',
        path: 'background-scripts',
        mime_category: 'directory' as VersionEntryType,
      },
      'background-scripts/index.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'index.js',
        path: 'background-scripts/index.js',
      },
      'background-scripts/libs': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'libs',
        mime_category: 'directory' as VersionEntryType,
        path: 'background-scripts/libs',
      },
      'background-scripts/libs/jquery.min.js': {
        ...fakeVersionEntry,
        depth: 2,
        filename: 'jquery.min.js',
        path: 'background-scripts/libs/jquery.min.js',
      },
      'background-scripts/extra': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'extra',
        mime_category: 'directory' as VersionEntryType,
        path: 'background-scripts/extra',
      },
      'styles.css': {
        ...fakeVersionEntry,
        filename: 'styles.css',
        path: 'styles.css',
      },
    },
  },
};

// We display an alert when a file has been selected.
const onSelectFile = (path: string) => {
  // eslint-disable-next-line no-alert
  alert(`Selected file: ${path}`);
};

const render = ({ ...moreProps }: Partial<FileTreeProps> = {}) => {
  const store = configureStore();
  store.dispatch(versionActions.loadVersionInfo({ version }));

  const internalVersion = getVersionInfo(
    store.getState().versions,
    version.id,
  ) as Version;

  const props: FileTreeProps = {
    onSelect: onSelectFile,
    version: internalVersion,
    ...moreProps,
  };
  return renderWithStoreAndRouter(<FileTree {...props} />, store);
};

storiesOf('FileTree', module).add('default', () => render());
