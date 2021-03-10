import { Location } from 'history';
import queryString from 'query-string';
import React from 'react';
import { Meta } from '@storybook/react';
import { parseDiff } from 'react-diff-view';

import configureStore from '../../configureStore';
import FullscreenGrid, { Header } from '../FullscreenGrid';
import ContentShell from '../FullscreenGrid/ContentShell';
import basicDiff from './fixtures/basicDiff';
import minifiedDiff from './fixtures/minifiedDiff';
import diffWithDeletions from './fixtures/diffWithDeletions';
import largeDiff from './fixtures/largeDiff';
import { LinterMessage, actions } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import {
  createFakeExternalLinterResult,
  createFakeLocation,
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionFileWithContent,
} from '../../test-helpers';
import { allowSlowPagesParam } from '../../utils';
import longUnbrokenMinifiedDiff from '../../stories/fixtures/long-unbroken-minified-diff';
import {
  newLinterMessageUID,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import DiffView, { PublicProps as DiffViewProps, DiffViewBase } from '.';

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

export default {
  title: 'Components/DiffView',
  component: DiffViewBase,
} as Meta;

export const DiffWithAdditionsAndDeletions = () => {
  return render({ diff: parseDiff(diffWithDeletions)[0] });
};

export const NoDifferences = () => {
  return render({ diff: null });
};

export const OneGlobalLinterMessage = () => {
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
};

export const MultipleGlobalLinterMessages = () => {
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
};

export const OneLinterMessageOnOneLine = () => {
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
};

export const MultipleLinterMessagesOnOneLine = () => {
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
};

export const MmultipleLinterMessagesOnMultipleLines = () => {
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
};

export const SlowSyntaxHighlightingWarning = () => {
  return render({ diff: parseDiff(minifiedDiff)[0] });
};

export const SlowSyntaxHighlightingWarningWithLinterMessage = () => {
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
};

export const SlowDiffWarning = () => {
  return render({
    diff: parseDiff(largeDiff)[0],
    location: createFakeLocation({
      search: queryString.stringify({ [allowSlowPagesParam]: false }),
    }),
  });
};

export const SlowDiffWarningOverridden = () => {
  return render({
    diff: parseDiff(largeDiff)[0],
    location: createFakeLocation({
      search: queryString.stringify({ [allowSlowPagesParam]: true }),
    }),
  });
};

export const LongUnbrokenMinifiedDiff = () => {
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
};
