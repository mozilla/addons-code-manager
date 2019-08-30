import * as React from 'react';
import { shallow } from 'enzyme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { createFakeComment } from '../../test-helpers';
import styles from './styles.module.scss';

import Comment, { PublicProps } from '.';

describe(__filename, () => {
  const render = (moreProps: Partial<PublicProps> = {}) => {
    const props = {
      comment: null,
      readOnly: true,
      ...moreProps,
    };
    return shallow(<Comment {...props} />);
  };

  it('renders a form when there is no comment', () => {
    const root = render({ comment: null });

    expect(root.find(`.${styles.form}`)).toHaveLength(1);
    expect(root.find(`.${styles.textarea}`)).toHaveLength(1);
  });

  it('renders a comment when provided', () => {
    const comment = createFakeComment();

    const root = render({ comment });

    expect(root.find(`.${styles.form}`)).toHaveLength(0);
    expect(root.find(`.${styles.comment}`)).toHaveLength(1);
    expect(root.find(`.${styles.comment}`).html()).toContain(comment.content);
    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
  });

  it('sanitizes the content of a comment', () => {
    const comment = createFakeComment({ content: '<span>foo</span>' });

    const root = render({ comment });

    expect(root.find(`.${styles.comment}`).html()).not.toContain(
      comment.content,
    );
    // HTML `span` are removed.
    expect(root.find(`.${styles.comment}`).html()).toContain('foo');
  });

  it('renders a form to edit a comment when the readOnly prop is false', () => {
    const comment = createFakeComment();
    const root = render({ comment, readOnly: false });

    expect(root.find(`.${styles.form}`)).toHaveLength(1);
    expect(root.find(`.${styles.textarea}`)).toHaveProp(
      'value',
      comment.content,
    );
  });

  describe('keydown protection', () => {
    const createFakeTextareaRef = () => {
      return {
        ...React.createRef(),
        current: {
          ...document.createElement('textarea'),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      };
    };

    it('stops propagation of keydown events on mount', () => {
      const fakeRef = createFakeTextareaRef();
      const root = render({ createTextareaRef: () => fakeRef });

      expect(fakeRef.current.addEventListener).toHaveBeenCalledWith(
        'keydown',
        (root.instance() as Comment).keydownListener,
      );
    });

    it('removes keydown event listeners on unmount', () => {
      const fakeRef = createFakeTextareaRef();
      const root = render({ createTextareaRef: () => fakeRef });
      const { keydownListener } = root.instance() as Comment;
      root.unmount();

      expect(fakeRef.current.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        keydownListener,
      );
    });

    it('does not add/remove listeners with an undefined ref', () => {
      // Make sure this doesn't throw an error.
      const root = render({ createTextareaRef: () => undefined });
      root.unmount();
    });

    it('does not add/remove listeners with a null DOM node', () => {
      // Make sure this doesn't throw an error.
      const root = render({ createTextareaRef: () => React.createRef() });
      root.unmount();
    });
  });
});
