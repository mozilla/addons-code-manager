import * as React from 'react';
import { storiesOf } from '@storybook/react';

import CodeView from '../src/components/CodeView';

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
}
`;

storiesOf('CodeView', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'unsupported mime type',
          sectionFn: () => <CodeView mimeType="" content={JS} />,
        },
        {
          title: 'application/javascript',
          sectionFn: () => (
            <CodeView mimeType="application/javascript" content={JS} />
          ),
        },
        {
          title: 'text/css',
          sectionFn: () => <CodeView mimeType="text/css" content={CSS} />,
        },
      ],
    },
  ],
});
