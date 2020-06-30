/* eslint @typescript-eslint/camelcase: 0 */
import React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import FileTree, {
  PublicProps as FileTreeProps,
} from '../src/components/FileTree';
import {
  VersionEntryType,
  actions as versionsActions,
} from '../src/reducers/versions';
import {
  ExternalLinterMessage,
  actions as linterActions,
} from '../src/reducers/linter';
import {
  createFakeExternalComment,
  createStoreWithVersion,
  createFakeExternalLinterResult,
  dispatchComments,
  fakeExternalLinterMessage,
  fakeVersionWithContent,
  fakeVersionEntry,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const fakeDirectoryEntry = {
  ...fakeVersionEntry,
  mime_category: 'directory' as VersionEntryType,
};

const defaultVersion = {
  ...fakeVersionWithContent,
  id: 456,
  file: {
    ...fakeVersionWithContent.file,
    entries: {
      'manifest.json': {
        ...fakeVersionEntry,
        filename: 'manifest.json',
        path: 'manifest.json',
      },
      'background-scripts': {
        ...fakeDirectoryEntry,
        filename: 'background-scripts',
        path: 'background-scripts',
      },
      'background-scripts/index.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'index.js',
        path: 'background-scripts/index.js',
      },
      'background-scripts/libs': {
        ...fakeDirectoryEntry,
        depth: 1,
        filename: 'libs',
        path: 'background-scripts/libs',
      },
      'background-scripts/libs/jquery.min.js': {
        ...fakeVersionEntry,
        depth: 2,
        filename: 'jquery.min.js',
        path: 'background-scripts/libs/jquery.min.js',
      },
      'background-scripts/extra': {
        ...fakeDirectoryEntry,
        depth: 1,
        filename: 'extra',
        path: 'background-scripts/extra',
      },
      'styles.css': {
        ...fakeVersionEntry,
        filename: 'styles.css',
        path: 'styles.css',
      },
      'jquery-ui': {
        ...fakeDirectoryEntry,
        depth: 0,
        filename: 'jquery-ui',
        path: 'jquery-ui',
      },
      'jquery-ui/css': {
        ...fakeDirectoryEntry,
        depth: 1,
        filename: 'css',
        path: 'jquery-ui/css',
      },
      'jquery-ui/js': {
        ...fakeDirectoryEntry,
        depth: 1,
        filename: 'js',
        path: 'jquery-ui/js',
      },
      'jquery-ui/js/jquery-1.7.1.min.js': {
        ...fakeVersionEntry,
        depth: 2,
        filename: 'jquery-1.7.1.min.js',
        path: 'jquery-ui/js/jquery-1.7.1.min.js',
      },
      'jquery-ui/js/jquery-ui-1.8.16.custom.min.js': {
        ...fakeVersionEntry,
        depth: 2,
        filename: 'jquery-ui-1.8.16.custom.min.js',
        path: 'jquery-ui/js/jquery-ui-1.8.16.custom.min.js',
      },
      lib: {
        ...fakeDirectoryEntry,
        depth: 0,
        filename: 'lib',
        path: 'lib',
      },
      'lib/adblockplus.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'adblockplus.js',
        path: 'lib/adblockplus.js',
      },
      'lib/compat.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'compat.js',
        path: 'lib/compat.js',
      },
      'lib/info.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'info.js',
        path: 'lib/info.js',
      },
      'lib/publicSuffixList.js': {
        ...fakeVersionEntry,
        depth: 1,
        filename: 'publicSuffixList.js',
        path: 'lib/publicSuffixList.js',
      },
    },
  },
};

const messages: ExternalLinterMessage[] = [
  {
    ...fakeExternalLinterMessage,
    type: 'error',
    file: 'jquery-ui/js/jquery-1.7.1.min.js',
  },
  { ...fakeExternalLinterMessage, type: 'warning', file: 'lib/compat.js' },
  { ...fakeExternalLinterMessage, type: 'notice', file: 'lib/info.js' },
];

// We display an alert when a file has been selected.
const onSelectFile = (path: string) => {
  // eslint-disable-next-line no-alert
  alert(`Selected file: ${path}`);
};

const render = ({
  version = defaultVersion,
  store = createStoreWithVersion({ version }),
  ...moreProps
}: { store?: Store; version?: typeof defaultVersion } & Partial<
  FileTreeProps
> = {}) => {
  store.dispatch(
    linterActions.loadLinterResult({
      versionId: version.id,
      result: createFakeExternalLinterResult({ messages }),
    }),
  );

  const props: FileTreeProps = {
    onSelect: onSelectFile,
    versionId: version.id,
    comparedToVersionId: null,
    ...moreProps,
  };
  return renderWithStoreAndRouter(<FileTree {...props} />, { store });
};

storiesOf('FileTree', module)
  .add('fluid width', () => render())
  .add('small width', () => (
    <div className="FileTreeStory-smallWidth"> {render()}</div>
  ))
  .add('files with comments', () => {
    const version = defaultVersion;
    const store = createStoreWithVersion({ version });
    store.dispatch(versionsActions.expandTree({ versionId: version.id }));
    dispatchComments({
      store,
      versionId: version.id,
      comments: [
        createFakeExternalComment({
          filename: version.file.entries['manifest.json'].path,
        }),
        createFakeExternalComment({
          filename:
            version.file.entries['jquery-ui/js/jquery-1.7.1.min.js'].path,
        }),
        createFakeExternalComment({
          filename:
            version.file.entries['background-scripts/libs/jquery.min.js'].path,
        }),
        createFakeExternalComment({
          filename: version.file.entries['lib/compat.js'].path,
        }),
      ],
    });
    return <div className="FileTreeStory-halfWidth">{render({ store })}</div>;
  });
