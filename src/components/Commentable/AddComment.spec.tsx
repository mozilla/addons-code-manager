import * as React from 'react';
import { Store } from 'redux';

import AddComment, { AddCommentBase, PublicProps } from './AddComment';
import configureStore from '../../configureStore';
import { actions as commentsActions } from '../../reducers/comments';
import { shallowUntilTarget, spyOn } from '../../test-helpers';

describe(__filename, () => {
  const render = (moreProps: { store?: Store } & Partial<PublicProps>) => {
    const props = {
      fileName: null,
      line: null,
      store: configureStore(),
      versionId: 1,
      ...moreProps,
    };
    return shallowUntilTarget(<AddComment {...props} />, AddCommentBase);
  };

  it('renders a custom className', () => {
    const className = 'example-class';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it('dispatches beginComment() on click', () => {
    const versionId = 234;
    const fileName = 'manifest.json';
    const line = 543;
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ line, fileName, store, versionId });
    root.simulate('click');

    expect(dispatch).toHaveBeenCalledWith(
      commentsActions.beginComment({
        commentId: undefined,
        fileName,
        line,
        versionId,
      }),
    );
  });
});
