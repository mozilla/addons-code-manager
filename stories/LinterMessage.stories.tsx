import queryString from 'query-string';
import * as React from 'react';
import { storiesOf } from '@storybook/react';

import LinterMessage from '../src/components/LinterMessage';
import { createInternalMessage } from '../src/reducers/linter';
import {
  createFakeLocation,
  fakeExternalLinterMessage,
} from '../src/test-helpers';
import { renderWithStoreAndRouter } from './utils';

const createMessage = (attributes = {}) => {
  return createInternalMessage({
    ...fakeExternalLinterMessage,
    ...attributes,
  });
};

const render = (children: JSX.Element) => {
  return renderWithStoreAndRouter(children);
};

const renderWithMessageUid = (children: JSX.Element, messageUid: string) => {
  return renderWithStoreAndRouter(children, undefined, [
    createFakeLocation({
      search: queryString.stringify({ messageUid }),
    }),
  ]);
};

storiesOf('LinterMessage', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'Error',
          sectionFn: () => {
            return render(
              <LinterMessage
                message={createMessage({
                  type: 'error',
                  message: 'The value of &lt;em:id&gt; is invalid',
                  description: [
                    'The values supplied for &lt;em:id&gt; in the install.rdf file is not a valid UUID string.',
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Error highlighted',
          sectionFn: () => {
            const messageUid = 'some-uid';
            return renderWithMessageUid(
              <LinterMessage
                message={createMessage({
                  type: 'error',
                  message: 'The value of &lt;em:id&gt; is invalid',
                  description: [
                    'The values supplied for &lt;em:id&gt; in the install.rdf file is not a valid UUID string.',
                  ],
                  uid: messageUid,
                })}
              />,
              messageUid,
            );
          },
        },
        {
          title: 'Warning',
          sectionFn: () => {
            return render(
              <LinterMessage
                message={createMessage({
                  type: 'warning',
                  message:
                    'The manifest contains a dictionary but no id property.',
                  description: [
                    'A dictionary was found in the manifest, but there was no id set.',
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Warning highlighted',
          sectionFn: () => {
            const messageUid = 'some-uid';
            return renderWithMessageUid(
              <LinterMessage
                message={createMessage({
                  type: 'warning',
                  message:
                    'The manifest contains a dictionary but no id property.',
                  description: [
                    'A dictionary was found in the manifest, but there was no id set.',
                  ],
                  uid: messageUid,
                })}
              />,
              messageUid,
            );
          },
        },
        {
          title: 'Notice',
          sectionFn: () => {
            return render(
              <LinterMessage
                message={createMessage({
                  type: 'notice',
                  message: 'Known JS library detected',
                  description: [
                    `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Notice highlighted',
          sectionFn: () => {
            const messageUid = 'some-uid';
            return renderWithMessageUid(
              <LinterMessage
                message={createMessage({
                  type: 'notice',
                  message: 'Known JS library detected',
                  description: [
                    `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                  ],
                  uid: messageUid,
                })}
              />,
              messageUid,
            );
          },
        },
        {
          title: 'Multi-line description',
          sectionFn: () => {
            return render(
              <LinterMessage
                message={createMessage({
                  type: 'error',
                  message: 'Markup parsing error',
                  description: [
                    'There was an error parsing the markup document.',
                    'malformed start tag, at line 1, column 26',
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Message with a link',
          sectionFn: () => {
            return render(
              <LinterMessage
                message={createMessage({
                  type: 'error',
                  message: 'Banned 3rd-party JS library',
                  description: [
                    `Your add-on uses a JavaScript library we
                  consider unsafe. Read more:
                  <a href="https://bit.ly/1TRIyZY">https://bit.ly/1TRIyZY</a>`,
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Inlined error',
          sectionFn: () => {
            return render(
              <LinterMessage
                inline
                message={createMessage({
                  type: 'error',
                  message: 'The value of &lt;em:id&gt; is invalid',
                  description: [
                    'The values supplied for &lt;em:id&gt; in the install.rdf file is not a valid UUID string.',
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Inlined warning',
          sectionFn: () => {
            return render(
              <LinterMessage
                inline
                message={createMessage({
                  type: 'warning',
                  message:
                    'The manifest contains a dictionary but no id property.',
                  description: [
                    'A dictionary was found in the manifest, but there was no id set.',
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Inlined notice',
          sectionFn: () => {
            return render(
              <LinterMessage
                inline
                message={createMessage({
                  type: 'notice',
                  message: 'Known JS library detected',
                  description: [
                    `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                  ],
                })}
              />,
            );
          },
        },
        {
          title: 'Two inline messages stacked',
          sectionFn: () => {
            return render(
              <React.Fragment>
                <LinterMessage
                  inline
                  message={createMessage({
                    type: 'notice',
                    message: 'Known JS library detected',
                    description: [
                      `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                    ],
                  })}
                />
                <LinterMessage
                  inline
                  message={createMessage({
                    type: 'error',
                    message: 'Markup parsing error',
                    description: [
                      'There was an error parsing the markup document.',
                      'malformed start tag, at line 1, column 26',
                    ],
                  })}
                />
              </React.Fragment>,
            );
          },
        },
        {
          title: 'Two inline messages stacked with one highlighted',
          sectionFn: () => {
            const messageUid = 'some-uid';
            return renderWithMessageUid(
              <React.Fragment>
                <LinterMessage
                  inline
                  message={createMessage({
                    type: 'notice',
                    message: 'Known JS library detected',
                    description: [
                      `JavaScript libraries are discouraged for
                simple add-ons, but are generally accepted.`,
                    ],
                  })}
                />
                <LinterMessage
                  inline
                  message={createMessage({
                    type: 'error',
                    message: 'Markup parsing error',
                    description: [
                      'There was an error parsing the markup document.',
                      'malformed start tag, at line 1, column 26',
                    ],
                    uid: messageUid,
                  })}
                />
              </React.Fragment>,
              messageUid,
            );
          },
        },
      ],
    },
  ],
});
