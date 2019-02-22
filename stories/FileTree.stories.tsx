/* eslint @typescript-eslint/camelcase: 0 */
import React from 'react';
import { storiesOf } from '@storybook/react';

import FileTree from '../src/components/FileTree';
import { createInternalVersion } from '../src/reducers/versions';
import { fakeVersion, fakeVersionEntry } from '../src/test-helpers';

const version = createInternalVersion({
  ...fakeVersion,
  file: {
    ...fakeVersion.file,
    entries: {
      'manifest.json': { ...fakeVersionEntry, filename: 'manifest.json' },
      'background-scripts': {
        ...fakeVersionEntry,
        filename: 'background-scripts',
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
      },
    },
  },
});

// We display an alert when a file has been selected.
const onSelectFile = (path: string) => {
  // eslint-disable-next-line no-alert
  alert(`Selected file: ${path}`);
};

storiesOf('FileTree', module).add('default', () => (
  <FileTree version={version} onSelect={onSelectFile} />
));
