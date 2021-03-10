import * as React from 'react';
import { Store } from 'redux';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import FullscreenGrid, { Header } from '../FullscreenGrid';
import ContentShell from '../FullscreenGrid/ContentShell';
import { LinterMessage, actions } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import jsSample from '../../stories/fixtures/js-sample';
import longUnbrokenMinifiedDiff from '../../stories/fixtures/long-unbroken-minified-diff';
import {
  loremIpsum,
  newLinterMessageUID,
  renderWithStoreAndRouter,
} from '../../storybook-utils';
import {
  createFakeExternalLinterResult,
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionFileWithContent,
} from '../../test-helpers';

import CodeView, { PublicProps as CodeViewProps } from '.';

const CSS = `html, body {
  width: 100px;
}

.hidden {
  display: none;
}`;

type RenderParams = {
  content?: string;
  store?: Store;
} & Partial<CodeViewProps>;

const render = ({
  content = jsSample,
  store = configureStore(),
  ...moreProps
}: RenderParams = {}) => {
  const props: CodeViewProps = {
    content,
    isMinified: false,
    mimeType: 'application/javascript',
    version: createInternalVersion(fakeVersionWithContent),
    ...moreProps,
  };
  return renderWithStoreAndRouter(
    <FullscreenGrid>
      <Header />
      <ContentShell>
        <CodeView {...props} />
      </ContentShell>
    </FullscreenGrid>,
    { store },
  );
};

const renderJSWithMessages = (
  messages: Partial<LinterMessage>[],
  {
    content = jsSample,
    store = configureStore(),
    ...moreProps
  }: RenderParams = {},
) => {
  const path = 'lib/some-file.js';
  const version = createInternalVersion({
    ...fakeVersionWithContent,
    file: {
      ...fakeVersionFileWithContent,
      selected_file: path,
    },
    file_entries: { [path]: { ...fakeVersionEntry, path } },
  });

  const result = createFakeExternalLinterResult({
    messages: messages.map((msg) => {
      return { uid: newLinterMessageUID(), ...msg, file: path };
    }),
  });

  store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));

  return render({
    store,
    content,
    mimeType: 'application/javascript',
    version,
    ...moreProps,
  });
};

export default {
  title: 'Components/CodeView',
  component: CodeView,
} as Meta;

export const MimeTypeUnsupported = () => {
  return render({ mimeType: '', content: jsSample });
};

export const MimeTypeJavascript = () => {
  return render({ mimeType: 'application/javascript', content: jsSample });
};

export const MimeTypeCss = () => {
  return render({ mimeType: 'text/css', content: CSS });
};

export const OneGlobalLinterMessage = () => {
  return renderJSWithMessages([
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
  return renderJSWithMessages([
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
  return renderJSWithMessages([
    {
      line: 7,
      message: 'document.querySelector() detected',
      description: ['Pretty sweet call to document.querySelector(). Nice.'],
      type: 'notice',
    },
  ]);
};

export const MultipleLinterMessagesOnOneLine = () => {
  const line = 7;
  return renderJSWithMessages([
    {
      line,
      message: 'document.querySelector() detected',
      description: ['Pretty sweet call to document.querySelector(). Nice.'],
      type: 'notice',
    },
    {
      line,
      message: 'classList.remove() considered harmful',
      description: [
        'Calling element.classList.remove() is harmful but not really.',
      ],
      type: 'error',
    },
  ]);
};

export const MultipleLinterMessagesOnMultipleLines = () => {
  return renderJSWithMessages([
    {
      line: 7,
      message: 'document.querySelector() detected',
      description: ['Pretty sweet call to document.querySelector(). Nice.'],
      type: 'notice',
    },
    {
      line: 18,
      message: 'browser.tabs.executeScript() is deprecated',
      description: [
        'browser.tabs.executeScript() will not be supported in the near future. Just kidding.',
      ],
      type: 'warning',
    },
  ]);
};

export const LongLineWithALinterMessage = () => {
  return renderJSWithMessages(
    [
      {
        line: 1,
        message: 'Long line detected',
        description: ['This is a long line of code.'],
        type: 'notice',
      },
    ],
    {
      content: `const message = "${loremIpsum.trim().replace(/\n/g, ' ')}";`,
    },
  );
};

export const CodeWithTabCharacters = () => {
  return render({
    mimeType: 'application/javascript',
    content: `
          \t// This should be indented for each code level.
          \tfunction log(msg, debug = false) {
          \t\tif (debug) {
          \t\t\tconsole.log(msg);
          \t\t}
          \t}`,
  });
};

export const LongLineWithoutAnyLineBreaksAndALinterMessage = () => {
  return renderJSWithMessages(
    [
      {
        line: 1,
        message: 'Minified code detected',
        description: ['You do not need to minify add-on code.'],
        type: 'notice',
      },
    ],
    {
      content: longUnbrokenMinifiedDiff,
    },
  );
};
