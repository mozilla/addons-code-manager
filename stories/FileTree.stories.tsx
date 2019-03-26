/* eslint @typescript-eslint/camelcase: 0 */
import React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import FileTree, {
  PublicProps as FileTreeProps,
} from '../src/components/FileTree';
import { createInternalVersion } from '../src/reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const version = createInternalVersion({
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
        mime_category: 'directory',
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
        mime_category: 'directory',
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
        mime_category: 'directory',
        path: 'background-scripts/extra',
      },
      'styles.css': {
        ...fakeVersionEntry,
        filename: 'styles.css',
        path: 'styles.css',
      },
    },
  },
});

// We display an alert when a file has been selected.
const onSelectFile = (path: string) => {
  // eslint-disable-next-line no-alert
  alert(`Selected file: ${path}`);
};

const render = ({
  store = configureStore(),
  ...moreProps
}: { store?: Store } & Partial<FileTreeProps> = {}) => {
  const props: FileTreeProps = {
    onSelect: onSelectFile,
    version,
    ...moreProps,
  };
  return renderWithStoreAndRouter(<FileTree {...props} />, store);
};

storiesOf('FileTree', module).add('default', () => render());
