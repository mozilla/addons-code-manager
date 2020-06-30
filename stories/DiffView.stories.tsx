/* eslint-disable @typescript-eslint/camelcase */
import { Location } from 'history';
import queryString from 'query-string';
import React from 'react';
import { storiesOf } from '@storybook/react';
import { parseDiff } from 'react-diff-view';

import configureStore from '../src/configureStore';
import FullscreenGrid, { Header } from '../src/components/FullscreenGrid';
import ContentShell from '../src/components/FullscreenGrid/ContentShell';
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
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionFileWithContent,
} from '../src/test-helpers';
import { allowSlowPagesParam } from '../src/utils';
import longUnbrokenMinifiedDiff from './fixtures/long-unbroken-minified-diff';
import {
  newLinterMessageUID,
  renderWithStoreAndRouter,
  rootAttributeParams,
} from './utils';

const getParams = () => rootAttributeParams({ fullscreen: true });

const render = (
  moreProps: Partial<DiffViewProps> & { location?: Location } = {},
  store = configureStore(),
) => {
  const { location, ...remainingProps } = moreProps;

  const props: DiffViewProps = {
    diff: parseDiff(basicDiff)[0],
    isMinified: false,
    mimeType: 'application/javascript',
    version: createInternalVersion(fakeVersionWithContent),
    ...remainingProps,
  };

  return renderWithStoreAndRouter(
    <FullscreenGrid>
      <Header />
      <ContentShell>
        <DiffView {...props} />
      </ContentShell>
    </FullscreenGrid>,
    { store, location },
  );
};

const renderWithMessages = (
  messages: Partial<LinterMessage>[],
  { diff = parseDiff(basicDiff)[0], ...moreProps }: Partial<DiffViewProps> = {},
) => {
  const path = 'lib/some-file.js';
  const result = createFakeExternalLinterResult({
    messages: messages.map((msg) => {
      return { uid: newLinterMessageUID(), ...msg, file: path };
    }),
  });

  const store = configureStore();
  const version = createInternalVersion({
    ...fakeVersionWithContent,
    file: {
      ...fakeVersionFileWithContent,
      selected_file: path,
    },
    file_entries: { [path]: { ...fakeVersionEntry, path } },
  });

  store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));

  const props: DiffViewProps = {
    diff,
    isMinified: false,
    mimeType: 'application/javascript',
    version,
    ...moreProps,
  };

  return render(props, store);
};

storiesOf('DiffView', module)
  .add(
    'diff with additions and deletions',
    () => {
      return render({ diff: parseDiff(diffWithDeletions)[0] });
    },
    getParams(),
  )
  .add(
    'no differences',
    () => {
      return render({ diff: null });
    },
    getParams(),
  )
  .add(
    'one global linter message',
    () => {
      return renderWithMessages([
        {
          line: null,
          message: 'The &#34;update_url&#34; property is not used by Firefox.',
          description: [
            'The &#34;update_url&#34; is not used by Firefox in the root of a manifest; your add-on will be updated via the Add-ons site and not your &#34;update_url&#34;.',
          ],
          type: 'warning',
        },
      ]);
    },
    getParams(),
  )
  .add(
    'multiple global linter messages',
    () => {
      return renderWithMessages([
        {
          line: null,
          message: 'The &#34;update_url&#34; property is not used by Firefox.',
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
    getParams(),
  )
  .add(
    'one linter message on one line',
    () => {
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
    getParams(),
  )
  .add(
    'multiple linter messages on one line',
    () => {
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
          description: ['Calling expect() like this is unsafe but not really.'],
          type: 'error',
        },
      ]);
    },
    getParams(),
  )
  .add(
    'multiple linter messages on multiple lines',
    () => {
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
    getParams(),
  )
  .add(
    'slow syntax highlighting warning',
    () => {
      return render({ diff: parseDiff(minifiedDiff)[0] });
    },
    getParams(),
  )
  .add(
    'slow syntax highlighting warning w/ linter message',
    () => {
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
    getParams(),
  )
  .add(
    'slow diff warning',
    () => {
      return render({
        diff: parseDiff(largeDiff)[0],
        location: createFakeLocation({
          search: queryString.stringify({ [allowSlowPagesParam]: false }),
        }),
      });
    },
    getParams(),
  )
  .add(
    'slow diff warning (overridden)',
    () => {
      return render({
        diff: parseDiff(largeDiff)[0],
        location: createFakeLocation({
          search: queryString.stringify({ [allowSlowPagesParam]: true }),
        }),
      });
    },
    getParams(),
  )
  .add(
    'long unbroken minified diff',
    () => {
      return renderWithMessages(
        [
          {
            line: 1,
            message: 'Minified diff detected',
            description: ['You do not need to minify add-on code.'],
            type: 'warning',
          },
        ],
        {
          diff: parseDiff(`diff --git a/src/components/DiffView.test.tsx b/src/components/DiffView.test.tsx
index 5ca1a30..4e2c90f 100644
--- a/src/components/DiffView.test.tsx
+++ b/src/components/DiffView.test.tsx
@@ -1,1 +1,1 @@
-
+${longUnbrokenMinifiedDiff}`)[0],
        },
      );
    },
    getParams(),
  );
