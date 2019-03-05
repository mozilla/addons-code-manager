/* eslint-disable react/jsx-curly-brace-presence */
import * as React from 'react';
import { storiesOf } from '@storybook/react';

import LinterMessage from '../src/components/LinterMessage';
import { createInternalMessage } from '../src/linter';
import { fakeExternalLinterMessage } from '../src/test-helpers';

const createMessage = (attributes = {}) => {
  return createInternalMessage({
    ...fakeExternalLinterMessage,
    ...attributes,
  });
};

storiesOf('LinterMessage', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'Error',
          sectionFn: () => (
            <LinterMessage
              message={createMessage({
                type: 'error',
                message: 'The value of &lt;em:id&gt; is invalid',
                description: [
                  'The values supplied for &lt;em:id&gt; in the install.rdf file is not a valid UUID string.',
                ],
              })}
            />
          ),
        },
        {
          title: 'Warning',
          sectionFn: () => (
            <LinterMessage
              message={createMessage({
                type: 'warning',
                message:
                  'The manifest contains a dictionary but no id property.',
                description: [
                  'A dictionary was found in the manifest, but there was no id set.',
                ],
              })}
            />
          ),
        },
        {
          title: 'Notice',
          sectionFn: () => (
            <LinterMessage
              message={createMessage({
                type: 'notice',
                message: 'Known JS library detected',
                description: [
                  `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                ],
              })}
            />
          ),
        },
        {
          title: 'Multi-line description',
          sectionFn: () => (
            <LinterMessage
              message={createMessage({
                type: 'error',
                message: 'Markup parsing error',
                description: [
                  'There was an error parsing the markup document.',
                  'malformed start tag, at line 1, column 26',
                ],
              })}
            />
          ),
        },
        {
          title: 'Message with a link',
          sectionFn: () => (
            <LinterMessage
              message={createMessage({
                type: 'error',
                message: 'Banned 3rd-party JS library',
                description: [
                  `Your add-on uses a JavaScript library we
                consider unsafe. Read more: https://bit.ly/1TRIyZY`,
                ],
              })}
            />
          ),
        },
      ],
    },
  ],
});
