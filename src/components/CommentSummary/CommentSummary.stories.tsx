/* eslint-disable react/prop-types */
import * as React from 'react';
import { Meta } from '@storybook/react';

import { createInternalComment } from '../../reducers/comments';
import {
  createOneLineComment,
  createVeryLongComments,
} from '../../storybook-utils';
import { createFakeExternalComment } from '../../test-helpers';

import CommentSummary from '.';

const render = ({ comments = [createFakeExternalComment()] } = {}) => {
  return (
    <CommentSummary comments={comments.map((c) => createInternalComment(c))} />
  );
};

export default {
  title: 'Components/CommentSummary',
  component: CommentSummary,
} as Meta;

export const OneLineComment = () => {
  return render({ comments: createOneLineComment() });
};

export const MultipleLineComments = () => {
  return render({
    comments: [
      createFakeExternalComment({
        filename: 'manifest.json',
        lineno: 23,
        comment: 'This is a deprecated permission',
      }),
      createFakeExternalComment({
        filename: 'scripts/background.js',
        lineno: 432,
        comment: 'This function call is not allowed',
      }),
      createFakeExternalComment({
        filename: 'scripts/content-script.js',
        lineno: 432,
        comment: 'Calling eval is definitely not allowed.',
      }),
      createFakeExternalComment({
        filename: 'lib/react.js',
        lineno: 432,
        comment: `When attaching a ref to a DOM component like <div />, you get the DOM node back; when attaching a ref to a composite component like <TextInput />, you'll get the React class instance. In the latter case, you can call methods on that component if any are exposed in its class definition.
                
                Note that when the referenced component is unmounted and whenever the ref changes, the old ref will be called with null as an argument. This prevents memory leaks in the case that the instance is stored, as in the second example. Also note that when writing refs with inline function expressions as in the examples here, React sees a different function object each time so on every update, ref will be called with null immediately before it's called with the component instance.`,
      }),
    ],
  });
};

export const OneFileComment = () => {
  return render({
    comments: [
      createFakeExternalComment({
        filename: 'src/util/systematic-dysfunctioner.js',
        lineno: null,
        comment: 'This file does not appear to be used anywhere. Is it?',
      }),
    ],
  });
};

export const OneVersionComment = () => {
  return render({
    comments: [
      createFakeExternalComment({
        filename: null,
        lineno: null,
        comment: 'Your add-on looks pretty good.',
      }),
    ],
  });
};

export const MixedVersionAndFileComments = () => {
  return render({
    comments: [
      createFakeExternalComment({
        filename: 'manifest.json',
        lineno: null,
        comment: 'Nice manifest file',
      }),
      createFakeExternalComment({
        filename: 'manifest.json',
        lineno: 12,
        comment: 'This permission is not used anywhere. Do you still need it?',
      }),
      createFakeExternalComment({
        filename: null,
        lineno: null,
        comment: 'This is a separate overall comment.',
      }),
      createFakeExternalComment({
        filename: null,
        lineno: null,
        comment: 'Really nice add-on',
      }),
    ],
  });
};

export const VeryLongComments = () => {
  return render({ comments: createVeryLongComments() });
};

export const MultipleCommentsOnTheSameLine = () => {
  const filename = 'manifest.json';
  const lineno = 23;

  return render({
    comments: [
      createFakeExternalComment({
        filename,
        lineno,
        comment: 'This is the first comment for this file',
      }),
      createFakeExternalComment({
        filename,
        lineno,
        comment: 'This is the second comment for this file',
      }),
    ],
  });
};
