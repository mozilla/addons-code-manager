/*  eslint-disable @typescript-eslint/camelcase */
import { Location } from 'history';
import queryString from 'query-string';
import React from 'react';
import { storiesOf } from '@storybook/react';
import { parseDiff } from 'react-diff-view';

import configureStore from '../src/configureStore';
import DiffView, {
  PublicProps as DiffViewProps,
} from '../src/components/DiffView';
import basicDiff from '../src/components/DiffView/fixtures/basicDiff';
import minifiedDiff from '../src/components/DiffView/fixtures/minifiedDiff';
import diffWithDeletions from '../src/components/DiffView/fixtures/diffWithDeletions';
import largeDiff from '../src/components/DiffView/fixtures/largeDiff';
import { LinterMessage, actions } from '../src/reducers/linter';
import { createInternalVersion } from '../src/reducers/versions';
import {
  createFakeExternalLinterResult,
  createFakeLocation,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
} from '../src/test-helpers';
import { allowSlowPagesParam } from '../src/utils';
import { newLinterMessageUID, renderWithStoreAndRouter } from './utils';

const render = (
  moreProps: Partial<DiffViewProps> & { location?: Location } = {},
  store = configureStore(),
) => {
  const { location, ...remainingProps } = moreProps;

  const props: DiffViewProps = {
    diff: parseDiff(basicDiff)[0],
    mimeType: 'application/javascript',
    selectedPath: fakeVersion.file.selected_file,
    version: createInternalVersion(fakeVersion),
    ...remainingProps,
  };

  return renderWithStoreAndRouter(
    <div className="DiffViewStory-panel">
      <DiffView {...props} />
    </div>,
    { store, location },
  );
};

const renderWithMessages = (
  messages: Partial<LinterMessage>[],
  moreProps: Partial<DiffViewProps> = {},
) => {
  const path = 'lib/some-file.js';
  const result = createFakeExternalLinterResult({
    messages: messages.map((msg) => {
      return { uid: newLinterMessageUID(), ...msg, file: path };
    }),
  });

  const store = configureStore();
  const version = createInternalVersion({
    ...fakeVersion,
    file: {
      ...fakeVersionFile,
      entries: { [path]: { ...fakeVersionEntry, path } },
    },
  });

  store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));

  const props: DiffViewProps = {
    diff: parseDiff(basicDiff)[0],
    mimeType: 'application/javascript',
    version,
    selectedPath: path,
    ...moreProps,
  };

  return render(props, store);
};

storiesOf('DiffView', module)
  .addWithChapters('all diffs', {
    chapters: [
      {
        sections: [
          {
            title: 'diff with additions and deletions',
            sectionFn: () => {
              return render({ diff: parseDiff(diffWithDeletions)[0] });
            },
          },
          {
            title: 'no differences',
            sectionFn: () => {
              return render({ diff: null });
            },
          },
        ],
      },
    ],
  })
  .addWithChapters('linter messages', {
    chapters: [
      {
        sections: [
          {
            title: 'one global message',
            sectionFn: () => {
              return renderWithMessages([
                {
                  line: null,
                  message:
                    'The &#34;update_url&#34; property is not used by Firefox.',
                  description: [
                    'The &#34;update_url&#34; is not used by Firefox in the root of a manifest; your add-on will be updated via the Add-ons site and not your &#34;update_url&#34;.',
                  ],
                  type: 'warning',
                },
              ]);
            },
          },
          {
            title: 'multiple global messages',
            sectionFn: () => {
              return renderWithMessages([
                {
                  line: null,
                  message:
                    'The &#34;update_url&#34; property is not used by Firefox.',
                  description: [
                    'The &#34;update_url&#34; is not used by Firefox in the root of a manifest; your add-on will be updated via the Add-ons site and not your &#34;update_url&#34;.',
                  ],
                  type: 'warning',
                },
                {
                  line: null,
                  message:
                    '/permissions: Unknown permissions &#34;unlimitedStorage&#34; at 8.',
                  description: ['See ... for more information.'],
                  type: 'notice',
                },
              ]);
            },
          },
          {
            title: 'one message on one line',
            sectionFn: () => {
              return renderWithMessages([
                {
                  line: 39,
                  message: 'expect().toHaveProp() detected',
                  description: [
                    'Calls to expect().toHaveProp() might lead to your add-on getting approved.',
                  ],
                  type: 'warning',
                },
              ]);
            },
          },
          {
            title: 'multiple messages on one line',
            sectionFn: () => {
              return renderWithMessages([
                {
                  line: 39,
                  message: 'expect().toHaveProp() detected',
                  description: [
                    'Calls to expect().toHaveProp() might lead to your add-on getting approved.',
                  ],
                  type: 'warning',
                },
                {
                  line: 39,
                  message: 'Unsafe call to expect()',
                  description: [
                    'Calling expect() like this is unsafe but not really.',
                  ],
                  type: 'error',
                },
              ]);
            },
          },
          {
            title: 'multiple messages on multiple lines',
            sectionFn: () => {
              return renderWithMessages(
                [
                  {
                    line: 9,
                    message: 'Third party library detected',
                    description: ['This add-on may require additional review.'],
                    type: 'warning',
                  },
                  {
                    line: 24,
                    message: 'Unsafe call to console.log()',
                    description: [
                      'Calling console.log() like this is unsafe but not really.',
                    ],
                    type: 'error',
                  },
                ],
                { diff: parseDiff(diffWithDeletions)[0] },
              );
            },
          },
        ],
      },
    ],
  })
  .addWithChapters('syntax highlighting disabled', {
    chapters: [
      {
        sections: [
          {
            title: 'warning',
            sectionFn: () => {
              return render({ diff: parseDiff(minifiedDiff)[0] });
            },
          },
          {
            title: 'warning with a global message',
            sectionFn: () => {
              return renderWithMessages(
                [
                  {
                    line: null,
                    message: 'There is a problem with this file.',
                    description: ['This file has a problem'],
                    type: 'warning',
                  },
                ],
                { diff: parseDiff(minifiedDiff)[0] },
              );
            },
          },
        ],
      },
    ],
  })
  .add('slow diff warning', () => {
    return render({ diff: parseDiff(largeDiff)[0] });
  })
  .add('slow diff warning (overridden)', () => {
    return render({
      diff: parseDiff(largeDiff)[0],
      location: createFakeLocation({
        search: queryString.stringify({ [allowSlowPagesParam]: true }),
      }),
    });
  });
