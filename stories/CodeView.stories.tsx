import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import ContentShell from '../src/components/FullscreenGrid/ContentShell';
import FullscreenGrid, { Header } from '../src/components/FullscreenGrid';
import CodeView, {
  PublicProps as CodeViewProps,
} from '../src/components/CodeView';
import { LinterMessage, actions } from '../src/reducers/linter';
import { createInternalVersion } from '../src/reducers/versions';
import longUnbrokenMinifiedDiff from './fixtures/long-unbroken-minified-diff';
import {
  loremIpsum,
  newLinterMessageUID,
  rootAttributeParams,
  renderWithStoreAndRouter,
} from './utils';
import {
  createFakeExternalLinterResult,
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionFileWithContent,
} from '../src/test-helpers';

const getParams = () => rootAttributeParams({ fullscreen: true });

export const JS_SAMPLE = `/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(\`Failed to execute beastify content script: \${
    error.message
  }\`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/beastify.js"})
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
`;

const CSS = `html, body {
  width: 100px;
}

.hidden {
  display: none;
}`;

type RenderParams = { content?: string; store?: Store } & Partial<
  CodeViewProps
>;

const render = ({
  content = JS_SAMPLE,
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
    content = JS_SAMPLE,
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

storiesOf('CodeView', module)
  .add(
    'Mime type: (unsupported)',
    () => render({ mimeType: '', content: JS_SAMPLE }),
    getParams(),
  )
  .add(
    'Mime type: application/javascript',
    () =>
      render({
        mimeType: 'application/javascript',
        content: JS_SAMPLE,
      }),
    getParams(),
  )
  .add(
    'Mime type: text/css',
    () => render({ mimeType: 'text/css', content: CSS }),
    getParams(),
  )
  .add(
    'One global linter message',
    () => {
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
    },
    getParams(),
  )
  .add(
    'Multiple global linter messages',
    () => {
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
    },
    getParams(),
  )
  .add(
    'One linter message on one line',
    () => {
      return renderJSWithMessages([
        {
          line: 7,
          message: 'document.querySelector() detected',
          description: ['Pretty sweet call to document.querySelector(). Nice.'],
          type: 'notice',
        },
      ]);
    },
    getParams(),
  )
  .add(
    'Multiple linter messages on one line',
    () => {
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
    },
    getParams(),
  )
  .add(
    'Multiple linter messages on multiple lines',
    () => {
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
    },
    getParams(),
  )
  .add(
    'Long line with a linter message',
    () => {
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
          content: `const message = "${loremIpsum
            .trim()
            .replace(/\n/g, ' ')}";`,
        },
      );
    },
    getParams(),
  )
  .add(
    'Code with tab characters',
    () =>
      render({
        mimeType: 'application/javascript',
        content: `
          \t// This should be indented for each code level.
          \tfunction log(msg, debug = false) {
          \t\tif (debug) {
          \t\t\tconsole.log(msg);
          \t\t}
          \t}`,
      }),
    getParams(),
  )
  .add(
    'Long line without any line breaks + linter message',
    () => {
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
    },
    getParams(),
  );
