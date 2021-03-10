import queryString from 'query-string';
import * as React from 'react';
import { Meta } from '@storybook/react';

import { createInternalMessage } from '../../reducers/linter';
import {
  createFakeLocation,
  fakeExternalLinterMessage,
} from '../../test-helpers';
import { renderWithStoreAndRouter } from '../../storybook-utils';

import LinterMessage, { LinterMessageBase } from '.';

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
  return renderWithStoreAndRouter(children, {
    location: createFakeLocation({
      search: queryString.stringify({ messageUid }),
    }),
  });
};

export default {
  title: 'Components/LinterMessage',
  component: LinterMessageBase,
} as Meta;

export const Error = () => {
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
};

export const ErrorHighlighted = () => {
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
};

export const Warning = () => {
  return render(
    <LinterMessage
      message={createMessage({
        type: 'warning',
        message: 'The manifest contains a dictionary but no id property.',
        description: [
          'A dictionary was found in the manifest, but there was no id set.',
        ],
      })}
    />,
  );
};

export const WarningHighlighted = () => {
  const messageUid = 'some-uid';

  return renderWithMessageUid(
    <LinterMessage
      message={createMessage({
        type: 'warning',
        message: 'The manifest contains a dictionary but no id property.',
        description: [
          'A dictionary was found in the manifest, but there was no id set.',
        ],
        uid: messageUid,
      })}
    />,
    messageUid,
  );
};

export const Notice = () => {
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
};

export const NoticeHighlighted = () => {
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
};

export const MultiLineDescription = () => {
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
};

export const MessageWithALink = () => {
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
};

export const InlinedError = () => {
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
};

export const InlinedErrorHighlighted = () => {
  const messageUid = 'some-uid';

  return renderWithMessageUid(
    <LinterMessage
      inline
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
};

export const InlinedWarning = () => {
  return render(
    <LinterMessage
      inline
      message={createMessage({
        type: 'warning',
        message: 'The manifest contains a dictionary but no id property.',
        description: [
          'A dictionary was found in the manifest, but there was no id set.',
        ],
      })}
    />,
  );
};

export const InlinedNotice = () => {
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
};

export const TwoInlineMessagesStacked = () => {
  return render(
    <>
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
    </>,
  );
};

export const TwoInlineMessagesStackedWithOneHighlighted = () => {
  const messageUid = 'some-uid';

  return renderWithMessageUid(
    <>
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
    </>,
    messageUid,
  );
};
