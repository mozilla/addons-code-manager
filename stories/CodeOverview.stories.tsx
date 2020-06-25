/* eslint-disable @typescript-eslint/camelcase */
import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import { LinterMessage, actions } from '../src/reducers/linter';
import longFileSample from './fixtures/long-file-sample';
import ContentShell from '../src/components/FullscreenGrid/ContentShell';
import FullscreenGrid, { Header } from '../src/components/FullscreenGrid';
import CodeOverview from '../src/components/CodeOverview';
import CodeView from '../src/components/CodeView';
import configureStore from '../src/configureStore';
import { JS_SAMPLE } from './CodeView.stories';
import { createInternalVersion } from '../src/reducers/versions';
import {
  createFakeExternalLinterResult,
  fakeVersionWithContent,
  fakeVersionFileWithContent,
  fakeVersionEntry,
} from '../src/test-helpers';
import {
  newLinterMessageUID,
  renderWithStoreAndRouter,
  rootAttributeParams,
} from './utils';

const render = ({
  content = JS_SAMPLE,
  messages = [],
  store = configureStore(),
}: {
  content?: string;
  messages?: Partial<LinterMessage>[];
  store?: Store;
} = {}) => {
  const path = 'background.js';
  const version = createInternalVersion({
    ...fakeVersionWithContent,
    file: {
      ...fakeVersionFileWithContent,
      selected_file: path,
    },
    file_entries: { [path]: { ...fakeVersionEntry, path } },
  });

  if (messages.length) {
    const result = createFakeExternalLinterResult({
      messages: messages.map((msg) => {
        return { uid: newLinterMessageUID(), ...msg, file: path };
      }),
    });

    store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));
  }

  return renderWithStoreAndRouter(
    <FullscreenGrid>
      <Header />
      <ContentShell
        altSidePanel={<CodeOverview content={content} version={version} />}
      >
        <CodeView
          content={content}
          isMinified={false}
          mimeType="application/javascript"
          version={version}
        />
      </ContentShell>
    </FullscreenGrid>,
    { store },
  );
};

const getParams = () => rootAttributeParams({ fullscreen: true });

storiesOf('CodeOverview', module)
  .add(
    'short file',
    () => {
      return render({ content: JS_SAMPLE });
    },
    getParams(),
  )
  .add(
    'long file',
    () => {
      return render({ content: longFileSample });
    },
    getParams(),
  )
  .add(
    'long file with messages',
    () => {
      return render({
        content: longFileSample,
        messages: [
          {
            line: 27,
            type: 'warning',
            message: 'Use of console.log() detected',
            description: ['This call to console.log() is pretty much Okay.'],
          },
          {
            line: 66,
            type: 'notice',
            message: 'Bizarre use of undefined',
            description: ["...but I guess it's fine"],
          },
          {
            line: 151,
            type: 'error',
            message: 'Use of queryTabs() is not permitted',
            description: [
              'Calls to queryTabs() will not work in a future version',
            ],
          },
        ],
      });
    },
    getParams(),
  );
