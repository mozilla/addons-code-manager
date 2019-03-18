import React from 'react';
import { storiesOf } from '@storybook/react';
import { parseDiff } from 'react-diff-view';

import configureStore from '../src/configureStore';
import DiffView, {
  PublicProps as DiffViewProps,
} from '../src/components/DiffView';
import basicDiff from '../src/components/DiffView/fixtures/basicDiff';
import diffWithDeletions from '../src/components/DiffView/fixtures/diffWithDeletions';
import { LinterMessage, actions } from '../src/reducers/linter';
import { createInternalVersion } from '../src/reducers/versions';
import {
  createFakeExternalLinterResult,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

let uid = 0;

const newUID = () => {
  // This helps make message keys for the storybook React page.
  uid++;
  return `msg-${uid}`;
};

const render = (
  moreProps: Partial<DiffViewProps> = {},
  store = configureStore(),
) => {
  const props: DiffViewProps = {
    diffs: parseDiff(basicDiff),
    mimeType: 'application/javascript',
    version: createInternalVersion(fakeVersion),
    ...moreProps,
  };

  return renderWithStoreAndRouter(<DiffView {...props} />, store);
};

const renderWithMessages = (
  messages: Partial<LinterMessage>[],
  moreProps: Partial<DiffViewProps> = {},
) => {
  const path = 'lib/some-file.js';
  const result = createFakeExternalLinterResult({
    messages: messages.map((msg) => {
      return { uid: newUID(), ...msg, file: path };
    }),
  });

  const store = configureStore();
  const version = createInternalVersion({
    ...fakeVersion,
    file: {
      ...fakeVersionFile,
      entries: { [path]: { ...fakeVersionEntry, path } },
      // eslint-disable-next-line @typescript-eslint/camelcase
      selected_file: path,
    },
  });

  store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));

  const props: DiffViewProps = {
    diffs: parseDiff(basicDiff),
    mimeType: 'application/javascript',
    version,
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
              return render({ diffs: parseDiff(diffWithDeletions) });
            },
          },
          {
            title: 'no differences',
            sectionFn: () => {
              return render({ diffs: [] });
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
        ],
      },
    ],
  });
