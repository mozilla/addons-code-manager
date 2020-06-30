import dedent from 'dedent';
import * as React from 'react';
import { shallow } from 'enzyme';

import {
  ExternalComment,
  createInternalComment,
} from '../../reducers/comments';
import {
  createFakeExternalComment,
  fakeVersionWithContent,
} from '../../test-helpers';

import CommentSummary, { PublicProps } from '.';

describe(__filename, () => {
  const createComments = (comments: Partial<ExternalComment>[]) => {
    return comments.map((c) => {
      return createInternalComment(createFakeExternalComment(c));
    });
  };

  const render = ({
    comments = createComments([createFakeExternalComment()]),
    ...props
  }: Partial<PublicProps> = {}) => {
    return shallow(<CommentSummary comments={comments} {...props} />);
  };

  const renderComments = (comments: Partial<ExternalComment>[]) => {
    const root = render({ comments: createComments(comments) });
    return String(root.find('textarea').prop('value')).trim();
  };

  const createVersionComment = (props = {}) => {
    return {
      filename: null,
      lineno: null,
      version: fakeVersionWithContent,
      ...props,
    };
  };

  it('accepts a custom className', () => {
    const className = 'CustomClass';

    expect(render({ className })).toHaveClassName(className);
  });

  it('renders zero comments', () => {
    expect(renderComments([])).toEqual('');
  });

  it('renders overall comments', () => {
    const comment1 = 'First comment';
    const comment2 = 'Second comment';

    const comments = [
      createVersionComment({ comment: comment1 }),
      createVersionComment({ comment: comment2 }),
    ];

    expect(renderComments(comments)).toEqual(
      dedent(`
        Overall comment(s):

        ${comment1}

        ${comment2}
      `),
    );
  });

  it('renders overall comments mixed with file comments', () => {
    const filename = 'manifest.json';
    const versionComment = 'Comment about the version';
    const fileComment = 'Comment about the file';
    const lineno = 23;
    const lineComment = 'Comment about a specific line';

    const comments = [
      { filename, comment: fileComment },
      { filename, lineno, comment: lineComment },
      createVersionComment({ comment: versionComment }),
    ];

    expect(renderComments(comments)).toEqual(
      dedent(`
        Overall comment(s):

        ${versionComment}

        File:
        ${filename}

        ${fileComment}

        File:
        ${filename}#L${lineno}

        ${lineComment}
      `),
    );
  });

  it('renders grouped file comments', () => {
    const file1 = 'manifest.json';
    const file2 = 'scripts/background.js';

    const file1comment1 = 'First comment about file 1';
    const file1comment2 = 'Second comment about file 1';

    const file2comment1 = 'First comment about file 2';
    const file2comment2 = 'Second comment about file 2';

    const comments = [
      // These are defined out of order to make sure they get grouped.
      { filename: file1, comment: file1comment1 },
      { filename: file2, comment: file2comment1 },
      { filename: file1, comment: file1comment2 },
      { filename: file2, comment: file2comment2 },
    ];

    expect(renderComments(comments)).toEqual(
      dedent(`
        File:
        ${file1}

        ${file1comment1}

        ${file1comment2}

        File:
        ${file2}

        ${file2comment1}

        ${file2comment2}
      `),
    );
  });

  it('renders grouped line comments', () => {
    const filename = 'manifest.json';

    const line1comment1 = 'First comment about line 1';
    const line1comment2 = 'Second comment about line 1';

    const line2comment1 = 'First comment about line 2';
    const line2comment2 = 'Second comment about line 2';

    const comments = [
      // These are defined out of order to make sure they get grouped.
      { filename, lineno: 1, comment: line1comment1 },
      { filename, lineno: 2, comment: line2comment1 },
      { filename, lineno: 1, comment: line1comment2 },
      { filename, lineno: 2, comment: line2comment2 },
    ];

    expect(renderComments(comments)).toEqual(
      dedent(`
        File:
        ${filename}#L1

        ${line1comment1}

        ${line1comment2}

        File:
        ${filename}#L2

        ${line2comment1}

        ${line2comment2}
      `),
    );
  });

  it('renders multi-line comments', () => {
    const filename = 'manifest.json';
    const comment = dedent(`
      This is a comment...

      ...with many lines...

      ...so you can read all about the thing.
      `);

    expect(renderComments([{ filename, comment }])).toEqual(
      dedent(`
        File:
        ${filename}

        ${comment}
      `),
    );
  });
});
