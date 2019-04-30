import * as React from 'react';
import { Store } from 'redux';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import CodeView, {
  PublicProps as CodeViewProps,
} from '../src/components/CodeView';
import { LinterMessage, actions } from '../src/reducers/linter';
import { createInternalVersion } from '../src/reducers/versions';
import { newLinterMessageUID, renderWithStoreAndRouter } from './utils';
import {
  createFakeExternalLinterResult,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
} from '../src/test-helpers';

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

const render = ({
  store = configureStore(),
  ...moreProps
}: { store?: Store } & Partial<CodeViewProps> = {}) => {
  const props: CodeViewProps = {
    content: JS_SAMPLE,
    mimeType: 'application/javascript',
    version: createInternalVersion(fakeVersion),
    ...moreProps,
  };
  return renderWithStoreAndRouter(<CodeView {...props} />, store);
};

const renderJSWithMessages = (
  messages: Partial<LinterMessage>[],
  moreProps: Partial<CodeViewProps> = {},
) => {
  const store = configureStore();

  const path = 'lib/some-file.js';
  const version = createInternalVersion({
    ...fakeVersion,
    file: {
      ...fakeVersionFile,
      entries: { [path]: { ...fakeVersionEntry, path } },
      // eslint-disable-next-line @typescript-eslint/camelcase
      selected_file: path,
    },
  });

  const result = createFakeExternalLinterResult({
    messages: messages.map((msg) => {
      return { uid: newLinterMessageUID(), ...msg, file: path };
    }),
  });

  store.dispatch(actions.loadLinterResult({ versionId: version.id, result }));

  return render({
    store,
    content: JS_SAMPLE,
    mimeType: 'application/javascript',
    version,
    ...moreProps,
  });
};

storiesOf('CodeView', module)
  .addWithChapters('mime types', {
    chapters: [
      {
        sections: [
          {
            title: 'unsupported mime type',
            sectionFn: () => render({ mimeType: '', content: JS_SAMPLE }),
          },
          {
            title: 'application/javascript',
            sectionFn: () =>
              render({
                mimeType: 'application/javascript',
                content: JS_SAMPLE,
              }),
          },
          {
            title: 'text/css',
            sectionFn: () => render({ mimeType: 'text/css', content: CSS }),
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
              return renderJSWithMessages([
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
              return renderJSWithMessages([
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
              return renderJSWithMessages([
                {
                  line: 7,
                  message: 'document.querySelector() detected',
                  description: [
                    'Pretty sweet call to document.querySelector(). Nice.',
                  ],
                  type: 'notice',
                },
              ]);
            },
          },
          {
            title: 'multiple messages on one line',
            sectionFn: () => {
              const line = 7;
              return renderJSWithMessages([
                {
                  line,
                  message: 'document.querySelector() detected',
                  description: [
                    'Pretty sweet call to document.querySelector(). Nice.',
                  ],
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
          },
          {
            title: 'multiple messages on multiple lines',
            sectionFn: () => {
              return renderJSWithMessages([
                {
                  line: 7,
                  message: 'document.querySelector() detected',
                  description: [
                    'Pretty sweet call to document.querySelector(). Nice.',
                  ],
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
          },
        ],
      },
    ],
  });
