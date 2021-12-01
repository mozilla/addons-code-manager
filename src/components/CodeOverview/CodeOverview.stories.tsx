import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import { LinterMessage, actions } from '../../reducers/linter';
import longFileSample from './fixtures/long-file-sample';
import FullscreenGrid, { Header } from '../FullscreenGrid';
import ContentShell from '../FullscreenGrid/ContentShell';
import CodeView from '../CodeView';
import configureStore from '../../configureStore';
import { createInternalVersion } from '../../reducers/versions';
import jsSample from '../../stories/fixtures/js-sample';
import {
  createFakeExternalLinterResult,
  fakeVersionWithContent,
  fakeVersionFileWithContent,
  fakeVersionEntry,
} from '../../test-helpers';
import {
  newLinterMessageUID,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import CodeOverview from '.';

const render = ({
  content = jsSample,
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

export default {
  title: 'Components/CodeOverview',
  component: CodeOverview,
} as Meta;

export const ShortFile = () => {
  return render({ content: jsSample });
};

export const LongFile = () => {
  return render({ content: longFileSample });
};

export const LongFileWithMessages = () => {
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
        description: ['Calls to queryTabs() will not work in a future version'],
      },
    ],
  });
};
