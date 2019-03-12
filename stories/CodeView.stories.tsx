import * as React from 'react';
import { storiesOf } from '@storybook/react';

import CodeView, {
  PublicProps as CodeViewProps,
} from '../src/components/CodeView';
import { LinterMessage, getMessageMap } from '../src/reducers/linter';
import { renderWithStoreAndRouter } from './utils';
import { createFakeExternalLinterResult } from '../src/test-helpers';

const JS = `/**
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

const render = (moreProps = {}) => {
  const props = {
    content: JS,
    linterMessagesByLine: undefined,
    mimeType: 'application/javascript',
    ...moreProps,
  };
  return renderWithStoreAndRouter(<CodeView {...props} />);
};

const renderJSWithMessages = (
  messages: Partial<LinterMessage>[],
  moreProps: Partial<CodeViewProps> = {},
) => {
  const stubFile = 'lib/some-file.js';
  const map = getMessageMap(
    createFakeExternalLinterResult({
      messages: messages.map((msg) => {
        return {
          ...msg,
          file: stubFile,
        };
      }),
    }),
  );

  return render({
    content: JS,
    mimeType: 'application/javascript',
    linterMessagesByLine: map[stubFile].byLine,
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
            sectionFn: () => render({ mimeType: '', content: JS }),
          },
          {
            title: 'application/javascript',
            sectionFn: () =>
              render({ mimeType: 'application/javascript', content: JS }),
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
